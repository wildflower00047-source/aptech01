import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';
import audit from '../services/audit.service.js';
import riskService from '../services/risk.service.js';
import tokenService from '../services/token.service.js';
import { setAuthCookies } from '../utils/cookies.js';
import { toB64url, fromB64url, userIdBytes } from '../utils/webauthn.js';
import { sanitize } from './auth.controller.js';

const rp = () => ({ id: env.webauthn.rpId, name: env.webauthn.rpName, origin: env.webauthn.origin });
const CHALLENGE_TTL = 5 * 60 * 1000;

const publicCredential = (c) => ({
  id: c.credentialID,
  name: c.name,
  deviceType: c.deviceType,
  backedUp: c.backedUp,
  transports: c.transports || [],
  createdAt: c.createdAt,
  lastUsedAt: c.lastUsedAt,
});

// GET /api/auth/passkeys
export const listPasskeys = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+webauthnCredentials');
  res.status(200).json({
    success: true,
    data: { passkeys: (user.webauthnCredentials || []).map(publicCredential) },
  });
});

// POST /api/auth/passkeys/register/options
export const passkeyRegisterOptions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+webauthnCredentials');
  const existing = user.webauthnCredentials || [];

  const options = await generateRegistrationOptions({
    rpName: rp().name,
    rpID: rp().id,
    userID: userIdBytes(user._id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.credentialID, transports: c.transports || [] })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });

  user.webauthnChallenge = options.challenge;
  user.webauthnChallengeExpires = new Date(Date.now() + CHALLENGE_TTL);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, data: { options } });
});

// POST /api/auth/passkeys/register/verify
export const passkeyRegisterVerify = asyncHandler(async (req, res) => {
  const { response, name } = req.body;
  const user = await User.findById(req.user._id).select(
    '+webauthnCredentials +webauthnChallenge +webauthnChallengeExpires',
  );
  if (!user.webauthnChallenge || user.webauthnChallengeExpires < Date.now()) {
    throw ApiError.badRequest('Registration challenge expired, please try again');
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.webauthnChallenge,
      expectedOrigin: rp().origin,
      expectedRPID: rp().id,
    });
  } catch (error) {
    throw ApiError.badRequest(error.message || 'Passkey verification failed');
  }
  if (!verification.verified || !verification.registrationInfo) {
    throw ApiError.badRequest('Passkey registration failed');
  }

  const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const credential = {
    credentialID: typeof credentialID === 'string' ? credentialID : toB64url(credentialID),
    credentialPublicKey:
      typeof credentialPublicKey === 'string' ? credentialPublicKey : toB64url(credentialPublicKey),
    counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: response?.response?.transports || [],
    name: name || 'Passkey',
    createdAt: new Date(),
    lastUsedAt: null,
  };

  user.webauthnCredentials = [...(user.webauthnCredentials || []), credential];
  user.webauthnChallenge = undefined;
  user.webauthnChallengeExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await audit.record(req, {
    action: 'user.passkey_added',
    category: 'security',
    description: `Passkey added (${credential.deviceType || 'device'})`,
  });

  res.status(201).json({
    success: true,
    message: 'Passkey added',
    data: { passkeys: user.webauthnCredentials.map(publicCredential) },
  });
});

// DELETE /api/auth/passkeys/:id
export const deletePasskey = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+webauthnCredentials');
  const before = user.webauthnCredentials || [];
  const after = before.filter((c) => c.credentialID !== req.params.id);
  if (after.length === before.length) throw ApiError.notFound('Passkey not found');

  user.webauthnCredentials = after;
  await user.save({ validateBeforeSave: false });

  await audit.record(req, {
    action: 'user.passkey_removed',
    category: 'security',
    description: 'Passkey removed',
  });

  res.status(200).json({
    success: true,
    message: 'Passkey removed',
    data: { passkeys: after.map(publicCredential) },
  });
});

// POST /api/auth/passkey/login/options
export const passkeyLoginOptions = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmail(email).select(
    '+webauthnCredentials +webauthnChallenge +webauthnChallengeExpires',
  );
  const credentials = user?.webauthnCredentials || [];

  const options = await generateAuthenticationOptions({
    rpID: rp().id,
    userVerification: 'preferred',
    allowCredentials: credentials.map((c) => ({ id: c.credentialID, transports: c.transports || [] })),
  });

  if (user) {
    user.webauthnChallenge = options.challenge;
    user.webauthnChallengeExpires = new Date(Date.now() + CHALLENGE_TTL);
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, data: { options } });
});

// POST /api/auth/passkey/login/verify
export const passkeyLoginVerify = asyncHandler(async (req, res) => {
  const { email, response } = req.body;
  const user = await User.findByEmail(email).select(
    '+webauthnCredentials +webauthnChallenge +webauthnChallengeExpires +loginAttempts +lockUntil',
  );
  if (!user || !user.webauthnChallenge) throw ApiError.unauthorized('Passkey sign-in failed');
  if (user.isBanned) throw ApiError.forbidden('Account has been banned');
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

  const credential = (user.webauthnCredentials || []).find((c) => c.credentialID === response.id);
  if (!credential) throw ApiError.unauthorized('Unknown passkey');

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.webauthnChallenge,
      expectedOrigin: rp().origin,
      expectedRPID: rp().id,
      authenticator: {
        credentialID: fromB64url(credential.credentialID),
        credentialPublicKey: fromB64url(credential.credentialPublicKey),
        counter: credential.counter,
        transports: credential.transports || [],
      },
    });
  } catch (error) {
    throw ApiError.unauthorized(error.message || 'Passkey sign-in failed');
  }
  if (!verification.verified) throw ApiError.unauthorized('Passkey sign-in failed');

  credential.counter = verification.authenticationInfo.newCounter;
  credential.lastUsedAt = new Date();
  user.webauthnChallenge = undefined;
  user.webauthnChallengeExpires = undefined;

  const risk = await riskService.assessLoginRisk(user, req);
  user.lastRiskScore = risk.score;
  await user.resetLoginAttempts(req.ip);

  const { accessToken, refreshToken } = await tokenService.createSession(user, req, {
    riskScore: risk.score,
    riskLevel: risk.level,
    riskFactors: risk.factors,
  });
  setAuthCookies(res, { accessToken, refreshToken });

  await audit.record(req, {
    user,
    action: 'user.passkey_login',
    category: 'auth',
    description: `Passkey login: ${user.email}`,
    metadata: { riskScore: risk.score },
  });

  res.status(200).json({
    success: true,
    message: 'Signed in with passkey',
    data: { user: sanitize(user), accessToken, risk },
  });
});

export default {
  listPasskeys,
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  deletePasskey,
  passkeyLoginOptions,
  passkeyLoginVerify,
};

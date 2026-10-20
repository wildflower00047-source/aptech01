import jwt from 'jsonwebtoken';
import { UAParser } from 'ua-parser-js';
import env from '../config/env.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';

const parseTtlToMs = (ttl) => {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * map[unit];
};

const parseDevice = (userAgent = '') => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  return {
    device: result.device.type ? `${result.device.vendor || ''} ${result.device.type}`.trim() : 'Desktop',
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version?.split('.')[0] || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
  };
};

export const signAccessToken = (user, sessionId) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, sid: sessionId?.toString() },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenTtl, issuer: 'authsec' },
  );

export const signRefreshToken = (user, sessionId) =>
  jwt.sign({ sub: user._id.toString(), sid: sessionId?.toString(), jti: generateRandomToken(16) }, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenTtl,
    issuer: 'authsec',
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.accessTokenSecret, { issuer: 'authsec' });

export const verifyRefreshToken = (token) => jwt.verify(token, env.refreshTokenSecret, { issuer: 'authsec' });

// Creates a Session document and returns signed tokens for a device.
export const createSession = async (user, req, extra = {}) => {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const { device, browser, os } = parseDevice(userAgent);

  const session = await Session.create({
    user: user._id,
    refreshTokenHash: 'pending',
    userAgent,
    ip,
    device,
    browser,
    os,
    expiresAt: new Date(Date.now() + parseTtlToMs(env.refreshTokenTtl)),
    ...extra,
  });

  const accessToken = signAccessToken(user, session._id);
  const refreshToken = signRefreshToken(user, session._id);
  session.refreshTokenHash = hashToken(refreshToken);
  await session.save();

  return { session, accessToken, refreshToken };
};

// Rotates a refresh token: revokes the old session and issues a new one (rotation).
export const rotateSession = async (refreshToken, req) => {
  const payload = verifyRefreshToken(refreshToken);
  const session = await Session.findById(payload.sid);
  if (!session || !session.isActive) throw new Error('Session not found or revoked');

  const incomingHash = hashToken(refreshToken);
  if (session.refreshTokenHash !== incomingHash) {
    // Reuse detected -> revoke all sessions for the user.
    await Session.updateMany(
      { user: session.user, revokedAt: { $exists: false } },
      { revokedAt: new Date(), revokedReason: 'refresh_token_reuse' },
    );
    throw new Error('Refresh token reuse detected');
  }

  session.revokedAt = new Date();
  session.revokedReason = 'rotated';
  await session.save();

  // Load the real user so the newly issued access token carries role/email.
  const user = await User.findById(session.user);
  if (!user) throw new Error('User no longer exists');
  if (!user.isActive) throw new Error('Account is deactivated');
  if (user.isBanned) throw new Error('Account has been banned');
  return createSession(user, req);
};

export const revokeSession = async (sessionId, reason = 'logout') => {
  await Session.findByIdAndUpdate(sessionId, { revokedAt: new Date(), revokedReason: reason });
};

export const revokeAllUserSessions = async (userId, reason = 'logout_all') => {
  await Session.updateMany(
    { user: userId, revokedAt: { $exists: false } },
    { revokedAt: new Date(), revokedReason: reason },
  );
};

export const parseTtl = parseTtlToMs;

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createSession,
  rotateSession,
  revokeSession,
  revokeAllUserSessions,
  parseTtl,
};

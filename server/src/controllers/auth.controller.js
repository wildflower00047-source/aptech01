import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';
import Session from '../models/Session.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { hashToken } from '../utils/crypto.js';
import env from '../config/env.js';
import tokenService from '../services/token.service.js';
import emailService from '../services/email.service.js';
import audit from '../services/audit.service.js';
import { permissionsForRole } from '../utils/roles.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';
import riskService from '../services/risk.service.js';
import settingsService from '../services/settings.service.js';

const sanitize = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  isEmailVerified: user.isEmailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  isActive: user.isActive,
  isBanned: user.isBanned,
  permissions: typeof user.permissions === 'function' ? user.permissions() : permissionsForRole(user.role),
  preferences: user.preferences,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const issueTokens = async (res, user, req, sessionExtra = {}) => {
  const { accessToken, refreshToken, session } = await tokenService.createSession(user, req, sessionExtra);
  setAuthCookies(res, { accessToken, refreshToken });
  return { accessToken, refreshToken, session };
};

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('Email is already registered');

  if (!settingsService.getSettings().registrationOpen) {
    throw ApiError.forbidden('Registration is currently closed');
  }

  const user = await User.create({ name, email, password });
  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await emailService.sendVerificationEmail(user, rawToken);
  await audit.record(req, {
    user,
    action: 'user.register',
    category: 'auth',
    description: `New registration: ${user.email}`,
  });

  res.status(201).json({
    success: true,
    message: 'Registered successfully. Please check your email to verify your account.',
    data: { user: sanitize(user) },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, totp, recoveryCode } = req.body;

  const user = await User.findByEmail(email, true);
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  if (user.isLocked) {
    const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw ApiError.locked(`Account locked. Try again in ${minutes} minute(s)`);
  }
  if (user.isBanned) throw ApiError.forbidden('Account has been banned');
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.registerFailedLogin();
    await audit.record(req, {
      user,
      action: 'user.login',
      category: 'auth',
      status: 'failure',
      description: `Failed login for ${user.email}`,
    });
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Policy gates configured by admins in system settings.
  const policy = settingsService.getSettings();
  if (policy.requireEmailVerification && !user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email address before signing in');
  }
  if (policy.require2FAForAdmins && user.role === 'admin' && !user.twoFactorEnabled) {
    throw ApiError.forbidden('Administrators must enable two-factor authentication before signing in');
  }

  // Assess login risk (device/IP novelty, recent failures, odd hour).
  const risk = await riskService.assessLoginRisk(user, req);

  // Two-factor gate (TOTP code or a one-time recovery code).
  if (user.twoFactorEnabled) {
    if (!totp && !recoveryCode) {
      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        message: 'Two-factor authentication code required',
      });
    }

    let verified = false;
    if (totp) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totp,
        window: 1,
      });
    }
    if (!verified && recoveryCode) {
      const hashed = hashToken(recoveryCode.trim());
      const codes = user.twoFactorRecoveryCodes || [];
      if (codes.includes(hashed)) {
        user.twoFactorRecoveryCodes = codes.filter((c) => c !== hashed);
        await user.save({ validateBeforeSave: false });
        verified = true;
        await audit.record(req, {
          user,
          action: 'user.recovery_code_used',
          category: 'security',
          description: 'Signed in with a recovery code',
        });
      }
    }

    if (!verified) {
      await user.registerFailedLogin();
      throw ApiError.unauthorized('Invalid two-factor code');
    }
  }

  user.lastRiskScore = risk.score;
  await user.resetLoginAttempts(req.ip);
  const tokens = await issueTokens(res, user, req, {
    riskScore: risk.score,
    riskLevel: risk.level,
    riskFactors: risk.factors,
  });

  await audit.record(req, {
    user,
    action: 'user.login',
    category: 'auth',
    description: `Successful login: ${user.email}`,
    metadata: { ip: req.ip, riskScore: risk.score, riskLevel: risk.level },
  });

  if (user.loginAlertsEnabled && (user.isEmailVerified || risk.level === 'high')) {
    emailService
      .sendLoginAlertEmail(user, {
        ip: req.ip,
        device: req.headers['user-agent'],
        riskLevel: risk.level,
      })
      .catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user: sanitize(user), accessToken: tokens.accessToken, risk },
  });
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let rotated;
  try {
    rotated = await tokenService.rotateSession(token, req);
  } catch (error) {
    clearAuthCookies(res);
    throw ApiError.unauthorized(error.message || 'Invalid refresh token');
  }

  const user = await User.findById(rotated.session.user);
  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw ApiError.unauthorized('User unavailable');
  }

  setAuthCookies(res, {
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken,
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: { user: sanitize(user), accessToken: rotated.accessToken },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) {
    try {
      const payload = tokenService.verifyRefreshToken(token);
      await tokenService.revokeSession(payload.sid, 'logout');
    } catch {
      /* ignore */
    }
  }
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/logout-all
export const logoutAll = asyncHandler(async (req, res) => {
  await tokenService.revokeAllUserSessions(req.user._id, 'logout_all');
  clearAuthCookies(res);
  await audit.record(req, {
    action: 'user.logout_all',
    category: 'security',
    description: 'All sessions revoked',
  });
  res.status(200).json({ success: true, message: 'Logged out from all devices' });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: sanitize(req.user) } });
});

// GET /api/auth/verify-email?token=...
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw ApiError.badRequest('Verification token is required');

  const user = await User.findOne({
    emailVerificationToken: hashToken(token),
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) throw ApiError.badRequest('Invalid or expired verification token');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await audit.record(req, {
    user,
    action: 'user.email_verified',
    category: 'account',
    description: `Email verified: ${user.email}`,
  });
  emailService.sendWelcomeEmail(user).catch(() => {});

  res.status(200).json({ success: true, message: 'Email verified successfully', data: { user: sanitize(user) } });
});

// POST /api/auth/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmail(email);
  // Respond the same regardless to avoid user enumeration.
  if (user && !user.isEmailVerified) {
    const rawToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    await emailService.sendVerificationEmail(user, rawToken);
  }
  res.status(200).json({ success: true, message: 'If the email exists, a verification link was sent.' });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findByEmail(email);
  if (user) {
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    await emailService.sendPasswordResetEmail(user, rawToken);
    await audit.record(req, {
      user,
      action: 'user.forgot_password',
      category: 'security',
      description: `Password reset requested: ${user.email}`,
    });
  }
  res.status(200).json({ success: true, message: 'If the email exists, a reset link was sent.' });
});

// POST /api/auth/reset-password?token=...
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires +password +passwordHistory');

  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  if (await user.isPasswordReused(password)) {
    throw ApiError.badRequest('This password was used recently. Please choose a different one.');
  }

  user.pushPasswordHistory();
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Revoke all sessions after a password reset.
  await tokenService.revokeAllUserSessions(user._id, 'password_reset');
  clearAuthCookies(res);

  await audit.record(req, {
    user,
    action: 'user.reset_password',
    category: 'security',
    description: `Password reset completed: ${user.email}`,
  });

  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
});

// PATCH /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +passwordHistory');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  if (await user.isPasswordReused(newPassword)) {
    throw ApiError.badRequest('This password was used recently. Please choose a different one.');
  }

  user.pushPasswordHistory();
  user.password = newPassword;
  await user.save();

  await tokenService.revokeAllUserSessions(user._id, 'password_change');
  clearAuthCookies(res);

  await audit.record(req, {
    action: 'user.change_password',
    category: 'security',
    description: 'Password changed',
  });

  res.status(200).json({ success: true, message: 'Password changed. Please log in again.' });
});

// ---- 2FA ----

// POST /api/auth/2fa/setup
export const setupTwoFactor = asyncHandler(async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `${env.twoFaIssuer} (${req.user.email})`, issuer: env.twoFaIssuer });
  const user = await User.findById(req.user._id);
  user.twoFactorSecret = secret.base32;
  user.twoFactorEnabled = false;
  await user.save({ validateBeforeSave: false });

  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
  res.status(200).json({
    success: true,
    message: 'Scan the QR code with your authenticator app',
    data: { secret: secret.base32, qrCode: qrDataUrl },
  });
});

// POST /api/auth/2fa/verify
export const verifyTwoFactor = asyncHandler(async (req, res) => {
  const { totp } = req.body;
  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  if (!user.twoFactorSecret) throw ApiError.badRequest('Run 2FA setup first');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: totp,
    window: 1,
  });
  if (!verified) throw ApiError.badRequest('Invalid code, try again');

  user.twoFactorEnabled = true;
  const recoveryCodes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex'));
  user.twoFactorRecoveryCodes = recoveryCodes.map((c) => hashToken(c));
  user.recoveryCodesCreatedAt = new Date();
  await user.save({ validateBeforeSave: false });

  await audit.record(req, {
    action: 'user.2fa_enabled',
    category: 'security',
    description: 'Two-factor authentication enabled',
  });

  res.status(200).json({
    success: true,
    message: 'Two-factor authentication enabled',
    data: { recoveryCodes },
  });
});

// POST /api/auth/2fa/disable
export const disableTwoFactor = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password +twoFactorSecret');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.badRequest('Password is incorrect');

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorRecoveryCodes = undefined;
  user.recoveryCodesCreatedAt = undefined;
  user.completedTasks = (user.completedTasks || []).filter((t) => t !== 'save_recovery_codes');
  await user.save({ validateBeforeSave: false });

  await audit.record(req, {
    action: 'user.2fa_disabled',
    category: 'security',
    description: 'Two-factor authentication disabled',
  });

  res.status(200).json({ success: true, message: 'Two-factor authentication disabled' });
});

// ---- Sessions / devices ----

// GET /api/auth/sessions
export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ user: req.user._id, revokedAt: { $exists: false }, expiresAt: { $gt: Date.now() } })
    .sort('-lastUsedAt')
    .lean();
  const currentId = req.session?._id?.toString();
  res.status(200).json({
    success: true,
    data: {
      sessions: sessions.map((s) => ({ ...s, current: s._id.toString() === currentId })),
    },
  });
});

// DELETE /api/auth/sessions/:id
export const revokeSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) throw ApiError.notFound('Session not found');
  await tokenService.revokeSession(session._id, 'revoked_by_user');
  res.status(200).json({ success: true, message: 'Session revoked' });
});

export { sanitize };
export default {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  listSessions,
  revokeSessionById,
};

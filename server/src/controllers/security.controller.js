import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import audit from '../services/audit.service.js';
import { computeSecurity, TASKS, BADGES } from '../services/securityScore.service.js';
import { hashToken } from '../utils/crypto.js';

const buildContext = async (user) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [sessionsCount, passkeyCount, recentFailedLogins] = await Promise.all([
    Session.countDocuments({ user: user._id, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } }),
    (user.webauthnCredentials || []).length,
    AuditLog.countDocuments({
      user: user._id,
      action: 'user.login',
      status: 'failure',
      createdAt: { $gte: since },
    }),
  ]);
  return { sessionsCount, passkeyCount, recentFailedLogins };
};

const loadUser = (id) => User.findById(id).select('+webauthnCredentials');

const persistProgress = async (user, security) => {
  if (user.xp !== security.xp || user.level !== security.level) {
    user.xp = security.xp;
    user.level = security.level;
    user.badges = security.badges;
    await user.save({ validateBeforeSave: false });
  }
};

// GET /api/security
export const getSecurity = asyncHandler(async (req, res) => {
  const user = await loadUser(req.user._id);
  const ctx = await buildContext(user);
  const security = computeSecurity(user, ctx);
  await persistProgress(user, security);

  res.status(200).json({
    success: true,
    data: { security, badgesCatalog: BADGES },
  });
});

// POST /api/security/quests/:key/claim
export const claimQuest = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const task = TASKS.find((t) => t.key === key);
  if (!task) throw ApiError.notFound('Quest not found');
  if (!task.claimable) throw ApiError.badRequest('This quest cannot be claimed manually');

  const user = await loadUser(req.user._id);
  const ctx = await buildContext(user);

  if (key === 'save_recovery_codes' && !user.twoFactorEnabled) {
    throw ApiError.badRequest('Enable two-factor authentication first');
  }
  if (key === 'review_sessions' && (ctx.sessionsCount || 0) > 3) {
    throw ApiError.badRequest('Revoke unused sessions before claiming this quest');
  }

  if (!(user.completedTasks || []).includes(key)) {
    user.completedTasks = [...(user.completedTasks || []), key];
    await user.save({ validateBeforeSave: false });
  }

  const security = computeSecurity(user, await buildContext(user));
  await persistProgress(user, security);

  await audit.record(req, {
    action: 'user.quest_claimed',
    category: 'security',
    description: `Claimed security quest "${task.title}"`,
  });

  res.status(200).json({ success: true, message: 'Quest claimed', data: { security } });
});

// PATCH /api/security/login-alerts
export const updateLoginAlerts = asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  const user = await loadUser(req.user._id);
  user.loginAlertsEnabled = Boolean(enabled);
  await user.save({ validateBeforeSave: false });

  const security = computeSecurity(user, await buildContext(user));
  await persistProgress(user, security);

  res.status(200).json({
    success: true,
    message: enabled ? 'Login alerts enabled' : 'Login alerts disabled',
    data: { security },
  });
});

// POST /api/security/recovery-codes/regenerate
export const regenerateRecoveryCodes = asyncHandler(async (req, res) => {
  const user = await loadUser(req.user._id);
  if (!user.twoFactorEnabled) throw ApiError.badRequest('Enable two-factor authentication first');

  const codes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex'));
  user.twoFactorRecoveryCodes = codes.map((c) => hashToken(c));
  user.recoveryCodesCreatedAt = new Date();
  await user.save({ validateBeforeSave: false });

  await audit.record(req, {
    action: 'user.recovery_codes_regenerated',
    category: 'security',
    description: 'Regenerated 2FA recovery codes',
  });

  const security = computeSecurity(user, await buildContext(user));
  await persistProgress(user, security);

  res.status(200).json({
    success: true,
    message: 'Recovery codes regenerated. Store them somewhere safe.',
    data: { recoveryCodes: codes, security },
  });
});

export default { getSecurity, claimQuest, updateLoginAlerts, regenerateRecoveryCodes };

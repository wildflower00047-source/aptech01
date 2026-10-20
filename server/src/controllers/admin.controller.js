import User from '../models/User.js';
import Session from '../models/Session.js';
import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import audit from '../services/audit.service.js';
import tokenService from '../services/token.service.js';
import rbac from '../services/rbac.service.js';
import settings from '../services/settings.service.js';
import { ROLES, PERMISSIONS, roleAtLeast } from '../utils/roles.js';
import { sanitize } from './auth.controller.js';

// GET /api/admin/users?page=&limit=&search=&role=&status=&sort=
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;
  if (req.query.status === 'banned') filter.isBanned = true;
  if (req.query.status === 'verified') filter.isEmailVerified = true;

  const sort = req.query.sort || '-createdAt';

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: users.map(sanitize),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    },
  });
});

// GET /api/admin/users/:id
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  const sessions = await Session.countDocuments({ user: user._id, revokedAt: { $exists: false } });
  res.status(200).json({ success: true, data: { user: sanitize(user), activeSessions: sessions } });
});

// POST /api/admin/users
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = ROLES.USER } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('Email already registered');

  const user = await User.create({ name, email, password, role, isEmailVerified: true });
  await audit.record(req, {
    action: 'admin.create_user',
    category: 'admin',
    description: `Created user ${user.email} with role ${role}`,
    metadata: { targetUser: user._id },
  });
  res.status(201).json({ success: true, message: 'User created', data: { user: sanitize(user) } });
});

// PATCH /api/admin/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!Object.values(ROLES).includes(role)) throw ApiError.badRequest('Invalid role');

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot change your own role');

  const previousRole = user.role;
  user.role = role;
  await user.save({ validateBeforeSave: false });

  await audit.record(req, {
    action: 'admin.update_role',
    category: 'admin',
    description: `Changed role of ${user.email} from ${previousRole} to ${role}`,
    metadata: { targetUser: user._id, previousRole, role },
  });

  res.status(200).json({ success: true, message: 'Role updated', data: { user: sanitize(user) } });
});

// PATCH /api/admin/users/:id/status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive, isBanned, bannedReason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot change your own status');

  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (typeof isBanned === 'boolean') {
    user.isBanned = isBanned;
    user.bannedReason = isBanned ? bannedReason || 'Policy violation' : undefined;
  }
  await user.save({ validateBeforeSave: false });

  if (!user.isActive || user.isBanned) {
    await tokenService.revokeAllUserSessions(user._id, 'account_suspended');
  }

  await audit.record(req, {
    action: 'admin.update_status',
    category: 'admin',
    description: `Updated status for ${user.email}`,
    metadata: { targetUser: user._id, isActive: user.isActive, isBanned: user.isBanned },
  });

  res.status(200).json({ success: true, message: 'Status updated', data: { user: sanitize(user) } });
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');
  if (roleAtLeast(user.role, ROLES.ADMIN)) throw ApiError.forbidden('Cannot delete another administrator');

  await tokenService.revokeAllUserSessions(user._id, 'account_deleted');
  await User.findByIdAndDelete(user._id);

  await audit.record(req, {
    action: 'admin.delete_user',
    category: 'admin',
    description: `Deleted user ${user.email}`,
    metadata: { targetUser: user._id },
  });

  res.status(200).json({ success: true, message: 'User deleted' });
});

// GET /api/admin/stats
export const getStats = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, active, banned, verified, admins, newThisWeek, twoFactor, byRole] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ role: ROLES.ADMIN }),
    User.countDocuments({ createdAt: { $gte: since } }),
    User.countDocuments({ twoFactorEnabled: true }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        total,
        active,
        banned,
        verified,
        admins,
        newThisWeek,
        twoFactor,
        byRole: byRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      },
    },
  });
});

// GET /api/admin/audit-logs?page=&limit=&category=&action=
export const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.action) filter.action = new RegExp(req.query.action, 'i');
  if (req.query.user) filter.user = req.query.user;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('user', 'name email role').lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1, hasNext: page * limit < total, hasPrev: page > 1 },
    },
  });
});

// GET /api/admin/threats
export const getThreats = asyncHandler(async (req, res) => {
  const size = Math.min(100, parseInt(req.query.limit, 10) || settings.getSettings().threatFeedSize || 25);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [securityEvents, riskySessions, failedByIp, failedTotal] = await Promise.all([
    AuditLog.find({ category: 'security' }).sort('-createdAt').limit(size).populate('user', 'name email role').lean(),
    Session.find({ riskLevel: { $in: ['medium', 'high'] } })
      .sort('-createdAt')
      .limit(size)
      .populate('user', 'name email role')
      .lean(),
    AuditLog.aggregate([
      { $match: { action: 'user.login', status: 'failure', createdAt: { $gte: since } } },
      { $group: { _id: '$ip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: size },
    ]),
    AuditLog.countDocuments({ action: 'user.login', status: 'failure', createdAt: { $gte: since } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      securityEvents,
      riskySessions,
      failedByIp: failedByIp.map((r) => ({ ip: r._id || 'unknown', count: r.count })),
      summary: { failedLogins7d: failedTotal, riskySessions: riskySessions.length },
    },
  });
});

// GET /api/admin/rbac
export const getRbac = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: rbac.getMatrix() });
});

// PATCH /api/admin/rbac/:role
export const updateRolePermissions = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { permissions = [] } = req.body;
  if (!Object.values(ROLES).includes(role)) throw ApiError.badRequest('Invalid role');

  const valid = Object.values(PERMISSIONS);
  const clean = [...new Set(permissions.filter((p) => valid.includes(p)))];

  await rbac.setRolePermissions(role, clean, req.user._id);
  await audit.record(req, {
    action: 'admin.update_rbac',
    category: 'admin',
    description: `Updated permissions for role ${role}`,
    metadata: { role, permissions: clean },
  });

  res.status(200).json({ success: true, message: `Updated permissions for ${role}`, data: rbac.getMatrix() });
});

// POST /api/admin/rbac/:role/reset
export const resetRolePermissions = asyncHandler(async (req, res) => {
  const { role } = req.params;
  if (!Object.values(ROLES).includes(role)) throw ApiError.badRequest('Invalid role');

  const permissions = await rbac.resetRole(role);
  await audit.record(req, {
    action: 'admin.reset_rbac',
    category: 'admin',
    description: `Reset permissions for role ${role} to defaults`,
    metadata: { role },
  });

  res.status(200).json({ success: true, message: `Reset ${role} to defaults`, data: rbac.getMatrix(), restored: permissions });
});

// GET /api/admin/settings
export const getSettings = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: { settings: settings.getSettings() } });
});

// PATCH /api/admin/settings
export const updateSettings = asyncHandler(async (req, res) => {
  const updated = await settings.updateSettings(req.body, req.user._id);
  await audit.record(req, {
    action: 'admin.update_settings',
    category: 'admin',
    description: 'Updated system settings',
    metadata: { settings: updated },
  });
  res.status(200).json({ success: true, message: 'Settings updated', data: { settings: updated } });
});

export default {
  listUsers,
  getUser,
  createUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getStats,
  listAuditLogs,
  getThreats,
  getRbac,
  updateRolePermissions,
  resetRolePermissions,
  getSettings,
  updateSettings,
};

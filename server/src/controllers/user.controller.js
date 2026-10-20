import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import audit from '../services/audit.service.js';
import tokenService from '../services/token.service.js';
import { clearAuthCookies } from '../utils/cookies.js';
import { sanitize } from './auth.controller.js';

// GET /api/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: sanitize(req.user) } });
});

// PATCH /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'bio', 'avatar', 'preferences'];
  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowed.includes(key)) updates[key] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  await audit.record(req, {
    action: 'user.update_profile',
    category: 'account',
    description: 'Profile updated',
    metadata: { fields: Object.keys(updates) },
  });

  res.status(200).json({ success: true, message: 'Profile updated', data: { user: sanitize(user) } });
});

// DELETE /api/users/profile  (soft-delete / deactivate own account)
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.badRequest('Password is incorrect');

  user.isActive = false;
  await user.save({ validateBeforeSave: false });

  await tokenService.revokeAllUserSessions(user._id, 'account_deleted');
  clearAuthCookies(res);

  await audit.record(req, {
    action: 'user.delete_account',
    category: 'account',
    description: 'Account deactivated',
  });

  res.status(200).json({ success: true, message: 'Account deactivated successfully' });
});

export default { getProfile, updateProfile, deleteAccount };

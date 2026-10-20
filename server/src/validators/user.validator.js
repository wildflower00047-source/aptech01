import { body } from 'express-validator';
import { ROLES } from '../utils/roles.js';
import { strongPassword } from './auth.validator.js';

export const updateProfileValidator = [
  body('name').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('bio').optional({ values: 'falsy' }).isLength({ max: 280 }).withMessage('Bio must be at most 280 characters'),
  body('avatar').optional({ values: 'falsy' }).isURL().withMessage('Avatar must be a valid URL'),
  body('preferences.theme').optional({ values: 'falsy' }).isIn(['light', 'dark', 'system']).withMessage('Invalid theme'),
  body('preferences.emailNotifications').optional().isBoolean(),
];

export const deleteAccountValidator = [body('password').notEmpty().withMessage('Password is required to delete account')];

export const createUserValidator = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  strongPassword('password'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role'),
];

export const updateRoleValidator = [body('role').isIn(Object.values(ROLES)).withMessage('Invalid role')];

export const updateStatusValidator = [
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('isBanned').optional().isBoolean().withMessage('isBanned must be boolean'),
  body('bannedReason').optional({ values: 'falsy' }).isLength({ max: 200 }),
];

export default {
  updateProfileValidator,
  deleteAccountValidator,
  createUserValidator,
  updateRoleValidator,
  updateStatusValidator,
};

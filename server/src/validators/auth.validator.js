import { body } from 'express-validator';

export const strongPassword = (field = 'password', label = 'Password') =>
  body(field)
    .isLength({ min: 8, max: 72 })
    .withMessage(`${label} must be 8-72 characters`)
    .matches(/[a-z]/)
    .withMessage(`${label} must contain a lowercase letter`)
    .matches(/[A-Z]/)
    .withMessage(`${label} must contain an uppercase letter`)
    .matches(/[0-9]/)
    .withMessage(`${label} must contain a number`)
    .matches(/[^A-Za-z0-9]/)
    .withMessage(`${label} must contain a special character`);

export const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  strongPassword('password'),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('totp').optional({ values: 'falsy' }).isLength({ min: 6, max: 6 }).withMessage('2FA code must be 6 digits'),
];

export const emailOnlyValidator = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  strongPassword('password'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  strongPassword('newPassword', 'New password'),
];

export const twoFactorVerifyValidator = [
  body('totp').isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code'),
];

export const twoFactorDisableValidator = [body('password').notEmpty().withMessage('Password is required')];

export default {
  registerValidator,
  loginValidator,
  emailOnlyValidator,
  resetPasswordValidator,
  changePasswordValidator,
  twoFactorVerifyValidator,
  twoFactorDisableValidator,
  strongPassword,
};

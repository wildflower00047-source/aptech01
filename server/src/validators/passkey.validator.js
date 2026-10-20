import { body } from 'express-validator';

export const passkeyRegisterVerifyValidator = [
  body('response').isObject().withMessage('Invalid passkey response'),
  body('name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 60 }),
];

export const passkeyLoginOptionsValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
];

export const passkeyLoginVerifyValidator = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('response').isObject().withMessage('Invalid passkey response'),
];

export default {
  passkeyRegisterVerifyValidator,
  passkeyLoginOptionsValidator,
  passkeyLoginVerifyValidator,
};

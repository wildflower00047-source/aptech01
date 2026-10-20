import { body, param } from 'express-validator';

export const claimQuestValidator = [param('key').isString().trim().isLength({ min: 2, max: 40 })];

export const loginAlertsValidator = [
  body('enabled').isBoolean().withMessage('enabled must be a boolean'),
];

export default { claimQuestValidator, loginAlertsValidator };

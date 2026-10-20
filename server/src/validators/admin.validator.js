import { body, param } from 'express-validator';
import { ROLES } from '../utils/roles.js';

export const updateRbacValidator = [
  param('role').isIn(Object.values(ROLES)).withMessage('Invalid role'),
  body('permissions').isArray().withMessage('permissions must be an array'),
  body('permissions.*').isString().withMessage('Each permission must be a string'),
];

export const updateSettingsValidator = [
  body('registrationOpen').optional().isBoolean().toBoolean(),
  body('requireEmailVerification').optional().isBoolean().toBoolean(),
  body('require2FAForAdmins').optional().isBoolean().toBoolean(),
  body('anomalyHighRiskRequires2FA').optional().isBoolean().toBoolean(),
  body('banAfterMaxAttempts').optional().isBoolean().toBoolean(),
  body('maintenanceMode').optional().isBoolean().toBoolean(),
  body('sessionIdleTimeoutMinutes').optional().isInt({ min: 0, max: 1440 }).toInt(),
  body('threatFeedSize').optional().isInt({ min: 5, max: 100 }).toInt(),
];

export default { updateRbacValidator, updateSettingsValidator };

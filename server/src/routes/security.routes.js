import { Router } from 'express';
import * as security from '../controllers/security.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { claimQuestValidator, loginAlertsValidator } from '../validators/security.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', security.getSecurity);
router.post('/quests/:key/claim', validate(claimQuestValidator), security.claimQuest);
router.patch('/login-alerts', validate(loginAlertsValidator), security.updateLoginAlerts);
router.post('/recovery-codes/regenerate', security.regenerateRecoveryCodes);

export default router;

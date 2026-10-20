import { Router } from 'express';
import * as user from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { updateProfileValidator, deleteAccountValidator } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.get('/profile', user.getProfile);
router.patch('/profile', validate(updateProfileValidator), user.updateProfile);
router.delete('/profile', validate(deleteAccountValidator), user.deleteAccount);

export default router;

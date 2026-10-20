import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import * as passkey from '../controllers/passkey.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { authLimiter, strictLimiter } from '../middleware/rateLimit.js';
import {
  registerValidator,
  loginValidator,
  emailOnlyValidator,
  resetPasswordValidator,
  changePasswordValidator,
  twoFactorVerifyValidator,
  twoFactorDisableValidator,
} from '../validators/auth.validator.js';
import {
  passkeyRegisterVerifyValidator,
  passkeyLoginOptionsValidator,
  passkeyLoginVerifyValidator,
} from '../validators/passkey.validator.js';

const router = Router();

// Public
router.post('/register', authLimiter, validate(registerValidator), auth.register);
router.post('/login', authLimiter, validate(loginValidator), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/verify-email', auth.verifyEmail);
router.post('/resend-verification', authLimiter, validate(emailOnlyValidator), auth.resendVerification);
router.post('/forgot-password', strictLimiter, validate(emailOnlyValidator), auth.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordValidator), auth.resetPassword);

// Protected
router.get('/me', authenticate, auth.getMe);
router.post('/logout-all', authenticate, auth.logoutAll);
router.patch('/change-password', authenticate, validate(changePasswordValidator), auth.changePassword);

router.post('/2fa/setup', authenticate, auth.setupTwoFactor);
router.post('/2fa/verify', authenticate, validate(twoFactorVerifyValidator), auth.verifyTwoFactor);
router.post('/2fa/disable', authenticate, validate(twoFactorDisableValidator), auth.disableTwoFactor);

router.get('/sessions', authenticate, auth.listSessions);
router.delete('/sessions/:id', authenticate, auth.revokeSessionById);

// Passkeys (WebAuthn) — passwordless sign-in
router.post('/passkey/login/options', authLimiter, validate(passkeyLoginOptionsValidator), passkey.passkeyLoginOptions);
router.post('/passkey/login/verify', authLimiter, validate(passkeyLoginVerifyValidator), passkey.passkeyLoginVerify);

// Passkeys (WebAuthn) — management (authenticated)
router.get('/passkeys', authenticate, passkey.listPasskeys);
router.post('/passkeys/register/options', authenticate, passkey.passkeyRegisterOptions);
router.post('/passkeys/register/verify', authenticate, validate(passkeyRegisterVerifyValidator), passkey.passkeyRegisterVerify);
router.delete('/passkeys/:id', authenticate, passkey.deletePasskey);

export default router;

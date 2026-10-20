import crypto from 'crypto';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Pre-authentication endpoints where a CSRF cookie may not exist yet.
const EXEMPT_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/passkey/login/options',
  '/auth/passkey/login/verify',
];

const cookieBase = {
  httpOnly: false, // must be readable by the SPA to echo back in a header
  secure: env.cookieSecure,
  sameSite: env.cookieSecure ? 'none' : 'lax',
  domain: env.cookieDomain,
  path: '/',
};

// Issues a double-submit CSRF token cookie if the client does not have one yet.
export const issueCsrfToken = (req, res, next) => {
  if (!req.cookies?.csrfToken) {
    res.cookie('csrfToken', crypto.randomBytes(24).toString('hex'), {
      ...cookieBase,
      maxAge: 2 * 60 * 60 * 1000,
    });
  }
  next();
};

// Enforces the double-submit token for state-changing requests that carry cookies.
export const csrfProtection = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (EXEMPT_PATHS.some((p) => req.path.startsWith(p))) return next();

  const cookieToken = req.cookies?.csrfToken;
  // No CSRF cookie means a non-browser client (e.g. curl with bearer token); allow.
  if (!cookieToken) return next();

  const headerToken = req.headers['x-csrf-token'];
  if (!headerToken || headerToken.length !== cookieToken.length) {
    return next(ApiError.forbidden('Invalid or missing CSRF token'));
  }
  const a = Buffer.from(headerToken);
  const b = Buffer.from(cookieToken);
  if (!crypto.timingSafeEqual(a, b)) {
    return next(ApiError.forbidden('Invalid or missing CSRF token'));
  }
  return next();
};

export default { issueCsrfToken, csrfProtection };

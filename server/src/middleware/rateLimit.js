import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const handler = (_req, _res, next) => next(ApiError.tooMany('Too many requests, please slow down'));

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export default { globalLimiter, authLimiter, strictLimiter };

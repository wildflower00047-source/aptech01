import User from '../models/User.js';
import Session from '../models/Session.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import tokenService from '../services/token.service.js';
import settingsService from '../services/settings.service.js';

const extractAccessToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
};

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractAccessToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = tokenService.verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Access token expired');
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');
  if (user.isBanned) throw ApiError.forbidden(`Account banned: ${user.bannedReason || 'policy violation'}`);
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw ApiError.unauthorized('Password changed, please log in again');
  }

  if (payload.sid) {
    const session = await Session.findById(payload.sid);
    if (!session || !session.isActive) {
      throw ApiError.unauthorized('Session expired or revoked');
    }

    // Optional idle timeout configured in system settings (0 = disabled).
    const idleMinutes = settingsService.getSettings().sessionIdleTimeoutMinutes;
    if (idleMinutes > 0) {
      const idleMs = idleMinutes * 60 * 1000;
      const lastUsed = (session.lastUsedAt || session.updatedAt || new Date()).getTime();
      if (Date.now() - lastUsed > idleMs) {
        session.revokedAt = new Date();
        session.revokedReason = 'idle_timeout';
        await session.save();
        throw ApiError.unauthorized('Session timed out due to inactivity');
      }
      // Touch the session, throttled to at most once per minute.
      if (Date.now() - lastUsed > 60 * 1000) {
        session.lastUsedAt = new Date();
        await session.save();
      }
    }

    req.session = session;
  }

  req.user = user;
  req.token = token;
  return next();
});

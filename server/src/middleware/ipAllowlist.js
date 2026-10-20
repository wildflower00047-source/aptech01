import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

// Restricts admin accounts to a configured set of IPs when ADMIN_IP_ALLOWLIST is set.
// Empty allowlist => feature disabled (default in development).
export const adminIpAllowlist = (req, _res, next) => {
  const list = env.adminIpAllowlist;
  if (!list.length) return next();
  if (req.user?.role !== 'admin') return next();

  const ip = req.ip || req.socket?.remoteAddress || '';
  const allowed = list.some((entry) => ip === entry || ip.endsWith(entry) || ip.includes(entry));

  if (!allowed) {
    return next(ApiError.forbidden('Your IP address is not allowed to access admin resources'));
  }
  return next();
};

export default adminIpAllowlist;

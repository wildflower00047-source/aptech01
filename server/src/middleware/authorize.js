import ApiError from '../utils/ApiError.js';
import { ROLE_HIERARCHY, permissionsForRole } from '../utils/roles.js';

// Role-based guard. Usage: authorize('admin') or authorize('moderator', 'admin')
export const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (allowedRoles.length === 0) return next();
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access denied. Requires role: ${allowedRoles.join(' or ')}`),
      );
    }
    return next();
  };

// Minimum role guard using hierarchy. Usage: authorizeMin('moderator')
export const authorizeMin = (minRole) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
  if (userLevel < requiredLevel) {
    return next(ApiError.forbidden(`Access denied. Requires at least: ${minRole}`));
  }
  return next();
};

// Permission-based guard. Usage: authorizePermission('delete:users')
export const authorizePermission =
  (...requiredPermissions) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    const granted = permissionsForRole(req.user.role);
    const ok = requiredPermissions.every((p) => granted.includes(p));
    if (!ok) return next(ApiError.forbidden('Insufficient permissions'));
    return next();
  };

export default { authorize, authorizeMin, authorizePermission };

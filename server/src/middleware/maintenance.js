import settingsService from '../services/settings.service.js';
import ApiError from '../utils/ApiError.js';

// Paths that must stay reachable so an administrator can sign in and turn
// maintenance mode back off (relative to the /api mount point). Note that
// /admin/settings is still protected by the normal auth + role + permission
// guards further down the stack.
const ALWAYS_OPEN = ['/health', '/meta/rbac', '/admin/settings', '/docs'];

const isOpenPath = (path) => path.startsWith('/auth') || ALWAYS_OPEN.some((p) => path.startsWith(p));

// When maintenance mode is enabled, block every API route except health, RBAC
// metadata and the auth routes. Returns 503 with a machine-readable code.
export const maintenanceMode = (req, _res, next) => {
  if (!settingsService.getSettings().maintenanceMode) return next();
  if (isOpenPath(req.path)) return next();
  return next(
    ApiError.serviceUnavailable(
      'AuthSec is undergoing scheduled maintenance. Please try again shortly.',
    ),
  );
};

export default maintenanceMode;

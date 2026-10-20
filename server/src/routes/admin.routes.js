import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeMin, authorizePermission } from '../middleware/authorize.js';
import { adminIpAllowlist } from '../middleware/ipAllowlist.js';
import validate from '../middleware/validate.js';
import { ROLES, PERMISSIONS } from '../utils/roles.js';
import {
  createUserValidator,
  updateRoleValidator,
  updateStatusValidator,
} from '../validators/user.validator.js';
import { updateRbacValidator, updateSettingsValidator } from '../validators/admin.validator.js';

const router = Router();

// Every admin route requires authentication.
router.use(authenticate);
// Optional admin IP allowlist (no-op unless ADMIN_IP_ALLOWLIST is set).
router.use(adminIpAllowlist);

// Reads are available to moderators and above.
router.get('/users', authorizeMin(ROLES.MODERATOR), authorizePermission(PERMISSIONS.READ_USERS), admin.listUsers);
router.get('/users/:id', authorizeMin(ROLES.MODERATOR), authorizePermission(PERMISSIONS.READ_USERS), admin.getUser);
router.get('/audit-logs', authorizeMin(ROLES.MODERATOR), authorizePermission(PERMISSIONS.READ_AUDIT_LOGS), admin.listAuditLogs);
router.get('/stats', authorizeMin(ROLES.MODERATOR), admin.getStats);

// Threat feed
router.get('/threats', authorizeMin(ROLES.MODERATOR), authorizePermission(PERMISSIONS.VIEW_THREATS), admin.getThreats);

// RBAC editor (admin only)
router.get('/rbac', authorizeMin(ROLES.ADMIN), authorizePermission(PERMISSIONS.MANAGE_RBAC), admin.getRbac);
router.patch('/rbac/:role', authorizeMin(ROLES.ADMIN), authorizePermission(PERMISSIONS.MANAGE_RBAC), validate(updateRbacValidator), admin.updateRolePermissions);
router.post('/rbac/:role/reset', authorizeMin(ROLES.ADMIN), authorizePermission(PERMISSIONS.MANAGE_RBAC), admin.resetRolePermissions);

// System settings (admin only)
router.get('/settings', authorizeMin(ROLES.ADMIN), authorizePermission(PERMISSIONS.MANAGE_SETTINGS), admin.getSettings);
router.patch('/settings', authorizeMin(ROLES.ADMIN), authorizePermission(PERMISSIONS.MANAGE_SETTINGS), validate(updateSettingsValidator), admin.updateSettings);

// Mutations are admin-only.
router.post('/users', authorizeMin(ROLES.ADMIN), validate(createUserValidator), admin.createUser);
router.patch('/users/:id/role', authorizeMin(ROLES.ADMIN), validate(updateRoleValidator), admin.updateUserRole);
router.patch('/users/:id/status', authorizeMin(ROLES.ADMIN), validate(updateStatusValidator), admin.updateUserStatus);
router.delete('/users/:id', authorizeMin(ROLES.ADMIN), admin.deleteUser);

export default router;

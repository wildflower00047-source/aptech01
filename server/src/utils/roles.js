export const ROLES = Object.freeze({
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
});

export const PERMISSIONS = Object.freeze({
  READ_PROFILE: 'read:profile',
  UPDATE_PROFILE: 'update:profile',
  READ_USERS: 'read:users',
  CREATE_USERS: 'create:users',
  UPDATE_USERS: 'update:users',
  DELETE_USERS: 'delete:users',
  MANAGE_ROLES: 'manage:roles',
  READ_AUDIT_LOGS: 'read:audit_logs',
  MANAGE_SESSIONS: 'manage:sessions',
  VIEW_THREATS: 'view:threats',
  MANAGE_SECURITY: 'manage:security',
  MANAGE_RBAC: 'manage:rbac',
  MANAGE_SETTINGS: 'manage:settings',
});

// Human-readable labels for the RBAC editor UI.
export const PERMISSION_LABELS = Object.freeze({
  [PERMISSIONS.READ_PROFILE]: 'View own profile',
  [PERMISSIONS.UPDATE_PROFILE]: 'Update own profile',
  [PERMISSIONS.READ_USERS]: 'View users',
  [PERMISSIONS.CREATE_USERS]: 'Create users',
  [PERMISSIONS.UPDATE_USERS]: 'Update users',
  [PERMISSIONS.DELETE_USERS]: 'Delete users',
  [PERMISSIONS.MANAGE_ROLES]: 'Manage roles',
  [PERMISSIONS.READ_AUDIT_LOGS]: 'View audit logs',
  [PERMISSIONS.MANAGE_SESSIONS]: 'Manage sessions',
  [PERMISSIONS.VIEW_THREATS]: 'View threat feed',
  [PERMISSIONS.MANAGE_SECURITY]: 'Manage security policy',
  [PERMISSIONS.MANAGE_RBAC]: 'Edit roles & permissions',
  [PERMISSIONS.MANAGE_SETTINGS]: 'Manage system settings',
});

// Role -> permission map (defaults / central source of truth for the RBAC layer).
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.USER]: [PERMISSIONS.READ_PROFILE, PERMISSIONS.UPDATE_PROFILE],
  [ROLES.MODERATOR]: [
    PERMISSIONS.READ_PROFILE,
    PERMISSIONS.UPDATE_PROFILE,
    PERMISSIONS.READ_USERS,
    PERMISSIONS.UPDATE_USERS,
    PERMISSIONS.READ_AUDIT_LOGS,
    PERMISSIONS.VIEW_THREATS,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
});

export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.USER]: 1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]: 3,
});

// In-memory RBAC overrides, hydrated from the database by rbac.service on boot.
const roleOverrides = {};

export const setRoleOverride = (role, permissions) => {
  if (!permissions) delete roleOverrides[role];
  else roleOverrides[role] = [...permissions];
};

export const clearRoleOverrides = () => {
  Object.keys(roleOverrides).forEach((role) => delete roleOverrides[role]);
};

export const getRoleOverrides = () => JSON.parse(JSON.stringify(roleOverrides));

// Effective permissions for a role (override wins, otherwise the default map).
export const permissionsForRole = (role) =>
  roleOverrides[role] ? [...roleOverrides[role]] : [...(ROLE_PERMISSIONS[role] || [])];

export const getDefaultPermissionsForRole = (role) => [...(ROLE_PERMISSIONS[role] || [])];

export const getEffectiveMatrix = () =>
  Object.keys(ROLES).reduce((acc, key) => {
    const role = ROLES[key];
    acc[role] = permissionsForRole(role);
    return acc;
  }, {});

export const roleAtLeast = (role, minRole) =>
  (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[minRole] || 0);

export default {
  ROLES,
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  permissionsForRole,
  getDefaultPermissionsForRole,
  getEffectiveMatrix,
  roleAtLeast,
  setRoleOverride,
  clearRoleOverrides,
  getRoleOverrides,
};

import RoleConfig from '../models/RoleConfig.js';
import logger from '../utils/logger.js';
import {
  ROLES,
  setRoleOverride,
  clearRoleOverrides,
  getRoleOverrides,
  getEffectiveMatrix,
  getDefaultPermissionsForRole,
  PERMISSION_LABELS,
} from '../utils/roles.js';

// Hydrates the in-memory RBAC overrides from the database on boot.
export const loadOverrides = async () => {
  try {
    clearRoleOverrides();
    const docs = await RoleConfig.find().lean();
    docs.forEach((doc) => setRoleOverride(doc.role, doc.permissions));
    if (docs.length) logger.info(`RBAC: loaded ${docs.length} role override(s)`);
  } catch (error) {
    logger.warn(`RBAC overrides not loaded: ${error.message}`);
  }
};

export const getMatrix = () => {
  const overrides = getRoleOverrides();
  return {
    roles: ROLES,
    permissions: PERMISSION_LABELS,
    effective: getEffectiveMatrix(),
    defaults: Object.keys(ROLES).reduce((acc, key) => {
      acc[ROLES[key]] = getDefaultPermissionsForRole(ROLES[key]);
      return acc;
    }, {}),
    overrides,
  };
};

export const setRolePermissions = async (role, permissions, actorId) => {
  const doc = await RoleConfig.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: actorId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  setRoleOverride(role, doc.permissions);
  return doc;
};

export const resetRole = async (role) => {
  await RoleConfig.deleteOne({ role });
  setRoleOverride(role, null);
  return getDefaultPermissionsForRole(role);
};

export default { loadOverrides, getMatrix, setRolePermissions, resetRole };

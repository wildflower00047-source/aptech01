import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  permissionsForRole,
  getDefaultPermissionsForRole,
  getEffectiveMatrix,
  roleAtLeast,
  setRoleOverride,
  clearRoleOverrides,
  getRoleOverrides,
} from '../../src/utils/roles.js';

describe('roles / RBAC', () => {
  it('exposes the three role tiers', () => {
    expect(Object.values(ROLES)).toEqual(['user', 'moderator', 'admin']);
  });

  it('gives admin every permission by default', () => {
    expect(getDefaultPermissionsForRole(ROLES.ADMIN).sort()).toEqual(Object.values(PERMISSIONS).sort());
  });

  it('gives a regular user only profile permissions', () => {
    expect(permissionsForRole(ROLES.USER)).toEqual([
      PERMISSIONS.READ_PROFILE,
      PERMISSIONS.UPDATE_PROFILE,
    ]);
  });

  it('orders the role hierarchy user < moderator < admin', () => {
    expect(ROLE_HIERARCHY[ROLES.USER]).toBeLessThan(ROLE_HIERARCHY[ROLES.MODERATOR]);
    expect(ROLE_HIERARCHY[ROLES.MODERATOR]).toBeLessThan(ROLE_HIERARCHY[ROLES.ADMIN]);
  });

  it('computes roleAtLeast using the hierarchy', () => {
    expect(roleAtLeast(ROLES.ADMIN, ROLES.MODERATOR)).toBe(true);
    expect(roleAtLeast(ROLES.USER, ROLES.MODERATOR)).toBe(false);
    expect(roleAtLeast(ROLES.MODERATOR, ROLES.MODERATOR)).toBe(true);
  });

  it('applies and clears runtime overrides', () => {
    clearRoleOverrides();
    expect(permissionsForRole(ROLES.MODERATOR)).toEqual(ROLE_PERMISSIONS[ROLES.MODERATOR]);

    setRoleOverride(ROLES.MODERATOR, [PERMISSIONS.READ_USERS]);
    expect(permissionsForRole(ROLES.MODERATOR)).toEqual([PERMISSIONS.READ_USERS]);
    expect(getRoleOverrides()).toHaveProperty(ROLES.MODERATOR);

    setRoleOverride(ROLES.MODERATOR, null);
    expect(permissionsForRole(ROLES.MODERATOR)).toEqual(ROLE_PERMISSIONS[ROLES.MODERATOR]);
    expect(getRoleOverrides()).not.toHaveProperty(ROLES.MODERATOR);
  });

  it('builds the effective matrix for every role', () => {
    clearRoleOverrides();
    const matrix = getEffectiveMatrix();
    expect(Object.keys(matrix).sort()).toEqual(['admin', 'moderator', 'user']);
    expect(matrix.admin.length).toBeGreaterThan(matrix.user.length);
  });

  it('returns a defensive copy so callers cannot mutate the source', () => {
    const perms = permissionsForRole(ROLES.USER);
    perms.push('hacked');
    expect(permissionsForRole(ROLES.USER)).not.toContain('hacked');
  });
});

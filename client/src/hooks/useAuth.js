import { useMemo } from 'react';
import { useAppSelector } from '../app/hooks.js';

const ROLE_LEVEL = { user: 1, moderator: 2, admin: 3 };

export const useAuth = () => {
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);
  const bootstrapped = useAppSelector((state) => state.auth.bootstrapped);
  const twoFactorRequired = useAppSelector((state) => state.auth.twoFactorRequired);

  return useMemo(
    () => ({
      user,
      status,
      bootstrapped,
      twoFactorRequired,
      isAuthenticated: Boolean(user),
      isLoading: status === 'loading' && !bootstrapped,
      hasRole: (...roles) => Boolean(user) && roles.includes(user.role),
      atLeastRole: (minRole) => Boolean(user) && (ROLE_LEVEL[user.role] || 0) >= (ROLE_LEVEL[minRole] || 0),
      hasPermission: (permission) => Boolean(user) && (user.permissions || []).includes(permission),
      isAdmin: user?.role === 'admin',
      isModerator: user?.role === 'moderator' || user?.role === 'admin',
    }),
    [user, status, bootstrapped, twoFactorRequired],
  );
};

export default useAuth;

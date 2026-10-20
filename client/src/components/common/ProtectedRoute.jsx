import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Spinner } from '../ui/Badge.jsx';

export const FullScreenLoader = () => (
  <div className="grid min-h-screen place-items-center bg-ink-50 dark:bg-ink-950">
    <div className="flex flex-col items-center gap-4">
      <Spinner size={44} />
      <p className="text-sm font-medium text-ink-500 dark:text-ink-400">Securing your session…</p>
    </div>
  </div>
);

// Protects a route: requires auth, and optionally a role / min role / permission.
export const ProtectedRoute = ({ roles, minRole, permission, children }) => {
  const { isAuthenticated, isLoading, bootstrapped, hasRole, atLeastRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading || !bootstrapped) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !hasRole(...roles)) return <Navigate to="/unauthorized" replace />;
  if (minRole && !atLeastRole(minRole)) return <Navigate to="/unauthorized" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />;

  return children ?? <Outlet />;
};

// Redirects authenticated users away from public-only pages (login/register).
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading, bootstrapped } = useAuth();

  if (isLoading || !bootstrapped) return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children ?? <Outlet />;
};

// Inline guard for buttons/sections (not a route).
export const Can = ({ roles, minRole, permission, children, fallback = null }) => {
  const { hasRole, atLeastRole, hasPermission } = useAuth();
  if (roles && !hasRole(...roles)) return fallback;
  if (minRole && !atLeastRole(minRole)) return fallback;
  if (permission && !hasPermission(permission)) return fallback;
  return children;
};

export default ProtectedRoute;

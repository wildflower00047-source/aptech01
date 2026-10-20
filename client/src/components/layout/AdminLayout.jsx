import { NavLink, Outlet, Link } from 'react-router-dom';
import { FiUsers, FiActivity, FiBarChart2, FiArrowLeft, FiShield, FiAlertTriangle, FiKey, FiSettings } from 'react-icons/fi';import { useAuth } from '../../hooks/useAuth.js';
import { roleBadge, cn } from '../../lib/utils.js';

export const AdminLayout = () => {
  const { user, hasPermission } = useAuth();

  const items = [
    { to: '/admin', label: 'Overview', icon: FiBarChart2, end: true },
    { to: '/admin/users', label: 'Users', icon: FiUsers },
    { to: '/admin/threats', label: 'Threat center', icon: FiAlertTriangle, permission: 'view:threats' },
    { to: '/admin/audit', label: 'Audit logs', icon: FiActivity },
    { to: '/admin/rbac', label: 'Roles & permissions', icon: FiKey, permission: 'manage:rbac' },
    { to: '/admin/settings', label: 'Settings', icon: FiSettings, permission: 'manage:settings' },
  ].filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="card sticky top-24 p-4">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500/10 to-violet-500/10 p-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white">
              <FiShield size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold">Admin console</p>
              <p className="text-xs text-ink-400">{user?.email}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                      : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/5',
                  )
                }
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/dashboard"
            className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 dark:hover:bg-white/5"
          >
            <FiArrowLeft size={16} /> Back to app
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <div className="flex gap-1.5 overflow-x-auto">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-brand-500 text-white' : 'bg-white/60 text-ink-500 dark:bg-white/5',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <span className={cn('badge capitalize', roleBadge(user?.role))}>{user?.role}</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

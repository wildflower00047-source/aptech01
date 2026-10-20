import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown, FiLogOut, FiMenu, FiShield, FiUser, FiX } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth.js';
import { useLogoutMutation } from '../../api/apiSlice.js';
import { setAccessToken } from '../../api/axios.js';
import { Avatar } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { Logo } from './Logo.jsx';
import { roleBadge, cn } from '../../lib/utils.js';

export const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const [logout] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      setAccessToken(null);
      setMenuOpen(false);
      setMobileOpen(false);
      navigate('/login');
    }
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'Profile' },
    { to: '/security', label: 'Security' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo to={isAuthenticated ? '/dashboard' : '/'} />

        <nav className="hidden items-center gap-1 md:flex">
          {isAuthenticated &&
            links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/5',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/5',
                )
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white p-1 pr-2 transition hover:border-brand-400 dark:border-white/10 dark:bg-white/5"
              >
                <Avatar name={user?.name} src={user?.avatar} size="sm" />
                <span className="hidden text-sm font-medium sm:block">{user?.name?.split(' ')[0]}</span>
                <FiChevronDown size={15} className="text-ink-400" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="card absolute right-0 z-20 mt-2 w-60 overflow-hidden p-1.5"
                    >
                      <div className="border-b border-ink-100 px-3 py-3 dark:border-white/5">
                        <p className="truncate text-sm font-semibold">{user?.name}</p>
                        <p className="truncate text-xs text-ink-400">{user?.email}</p>
                        <span className={cn('badge mt-2 capitalize', roleBadge(user?.role))}>{user?.role}</span>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/5"
                      >
                        <FiUser size={16} /> My profile
                      </Link>
                      <Link
                        to="/security"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/5"
                      >
                        <FiShield size={16} /> Security
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
                      >
                        <FiLogOut size={16} /> Sign out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button>Get started</Button>
              </Link>
            </div>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200 dark:border-white/10 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-ink-200/70 md:hidden dark:border-white/10"
          >
            <div className="space-y-1 p-4">
              {(isAuthenticated ? links : []).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/5"
                >
                  {link.label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400"
                >
                  Admin
                </NavLink>
              )}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1">
                    <Button variant="secondary" className="w-full">Sign in</Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full">Get started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

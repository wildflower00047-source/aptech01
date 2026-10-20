import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShield, FiLock, FiZap } from 'react-icons/fi';
import { Logo } from './Logo.jsx';

const highlights = [
  { icon: FiShield, title: 'JWT + refresh rotation', text: 'Short-lived access tokens with rotating refresh sessions.' },
  { icon: FiLock, title: '2FA & device control', text: 'TOTP authenticator, recovery codes and session management.' },
  { icon: FiZap, title: 'Role-based authorization', text: 'Granular roles (user, moderator, admin) and permissions.' },
];

export const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:py-16">
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="hidden flex-col justify-between rounded-3xl border border-white/60 bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 p-10 text-white shadow-glow lg:flex"
    >
      <div>
        <Logo />
        <h2 className="mt-10 text-3xl font-extrabold leading-tight">
          Secure by design.
          <br />
          Beautiful by default.
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/70">
          A production-grade MERN authentication & authorization platform with everything you need to ship safely.
        </p>
      </div>
      <div className="space-y-4">
        {highlights.map((h) => (
          <div key={h.title} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
              <h.icon size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">{h.title}</p>
              <p className="text-xs text-white/70">{h.text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="flex items-center gap-2 text-xs text-white/60">
        <FiCheckCircle size={14} /> Trusted by developers building secure products.
      </p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col justify-center"
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">{footer}</div>}
      </div>
    </motion.div>
  </div>
);

export const AuthLink = ({ to, children }) => (
  <Link to={to} className="link">
    {children}
  </Link>
);

export default AuthLayout;

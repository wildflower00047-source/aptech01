import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiShield,
  FiKey,
  FiSmartphone,
  FiUsers,
  FiActivity,
  FiRefreshCw,
  FiLock,
  FiCheck,
  FiZap,
  FiMail,
  FiMonitor,
} from 'react-icons/fi';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

const features = [
  { icon: FiKey, title: 'JWT access & refresh', text: 'Short-lived access tokens with rotating refresh sessions and automatic renewal.' },
  { icon: FiSmartphone, title: 'Two-factor auth', text: 'TOTP authenticator support with QR setup and one-time recovery codes.' },
  { icon: FiUsers, title: 'Role-based access', text: 'User, moderator and admin roles with a granular permission matrix.' },
  { icon: FiMonitor, title: 'Session management', text: 'See every active device and revoke sessions remotely in one click.' },
  { icon: FiActivity, title: 'Audit logging', text: 'Every sensitive action is recorded with IP, device and metadata.' },
  { icon: FiMail, title: 'Email flows', text: 'Verification, password reset and login alerts — ready to plug into SMTP.' },
  { icon: FiLock, title: 'Hardened security', text: 'Helmet, rate limiting, account lockout, bcrypt hashing and validation.' },
  { icon: FiRefreshCw, title: 'Extensible API', text: 'A clean, documented REST API that scales with your product.' },
];

const stats = [
  { value: '15m', label: 'Access token TTL' },
  { value: '7d', label: 'Refresh session' },
  { value: '3', label: 'Role tiers' },
  { value: '10+', label: 'Auth endpoints' },
];

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
              <FiZap size={13} /> Production-ready MERN auth starter
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-900 dark:text-white sm:text-6xl">
              Authentication &amp; authorization, <span className="gradient-text">done right.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-500 dark:text-ink-400">
              AuthSec gives you a battle-tested security layer — JWT sessions, 2FA, RBAC, audit logs and a
              hyper-modern React experience — so you can focus on your product.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button className="px-6 py-3 text-base">
                    Go to dashboard <FiArrowRight />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button className="px-6 py-3 text-base">
                      Start for free <FiArrowRight />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" className="px-6 py-3 text-base">
                      Live demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500 dark:text-ink-400">
              {['No credit card', 'Open architecture', 'Deploy anywhere'].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <FiCheck className="text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500/30 to-violet-500/30 blur-2xl" />
            <div className="glass relative rounded-3xl p-6 shadow-glow">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-medium text-ink-400">authsec · secure session</span>
              </div>
              <div className="rounded-2xl bg-ink-950/90 p-5 font-mono text-xs leading-relaxed text-ink-300">
                <p><span className="text-emerald-400">POST</span> /api/auth/login <span className="text-ink-600">→ 200</span></p>
                <p className="text-ink-500">{'// httpOnly cookies set'}</p>
                <p className="mt-2"><span className="text-brand-400">accessToken</span> = <span className="text-amber-300">eyJhbGci...</span> <span className="text-ink-600">(15m)</span></p>
                <p><span className="text-violet-400">refreshToken</span> = <span className="text-amber-300">eyJhbGci...</span> <span className="text-ink-600">(7d)</span></p>
                <p className="mt-2 text-emerald-400">✓ role: admin · 9 permissions</p>
                <p className="mt-2"><span className="text-emerald-400">GET</span> /api/auth/me <span className="text-ink-600">→ 200</span></p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {stats.slice(0, 4).map((s) => (
                  <div key={s.label} className="rounded-xl border border-ink-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xl font-extrabold text-ink-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-ink-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-ink-200/70 bg-white/50 dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="text-center"
            >
              <p className="text-3xl font-extrabold gradient-text">{s.value}</p>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Everything you need to ship secure auth
          </h2>
          <p className="mt-3 text-ink-500 dark:text-ink-400">
            A complete feature set covering authentication, authorization and account security.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06 }}
              whileHover={{ y: -6 }}
              className="card group p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white">
                <f.icon size={20} />
              </span>
              <h3 className="mt-4 font-semibold text-ink-900 dark:text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security section */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 p-8 text-white shadow-glow sm:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold">
                <FiShield size={13} /> Security first
              </span>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
                Built with the OWASP checklist in mind
              </h2>
              <p className="mt-4 text-white/75">
                Defense in depth across every layer — from hashed secrets and rotating tokens to brute-force
                protection and full audit trails.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'bcrypt password hashing',
                  'Refresh token rotation',
                  'Account lockout',
                  'Rate limiting',
                  'httpOnly secure cookies',
                  'Request validation',
                  'Role & permission guards',
                  'Audit logging',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                    <FiCheck className="text-emerald-300" size={15} /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: FiShield, label: 'Helmet', value: 'Headers' },
                { icon: FiLock, label: 'bcrypt', value: '12 rounds' },
                { icon: FiSmartphone, label: 'TOTP', value: '2FA ready' },
                { icon: FiActivity, label: 'Audit', value: 'Full trail' },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                  <c.icon size={22} className="text-white/90" />
                  <p className="mt-3 text-lg font-bold">{c.value}</p>
                  <p className="text-xs text-white/70">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-24 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          Ready to secure your app?
        </h2>
        <p className="mt-3 text-ink-500 dark:text-ink-400">
          Spin up the demo, explore the admin console, and wire it into your stack.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={isAuthenticated ? '/dashboard' : '/register'}>
            <Button className="px-6 py-3 text-base">
              {isAuthenticated ? 'Open dashboard' : 'Create free account'} <FiArrowRight />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;

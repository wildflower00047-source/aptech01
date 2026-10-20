import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiShield,
  FiSmartphone,
  FiMonitor,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiKey,
  FiActivity,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.js';
import { useGetSessionsQuery, useGetSecurityQuery } from '../api/apiSlice.js';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import { Badge, Avatar } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import SecurityScoreCard from '../components/security/SecurityScoreCard.jsx';
import { roleBadge, formatRelative, cn } from '../lib/utils.js';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const Dashboard = () => {
  const { user, isAdmin, isModerator } = useAuth();
  const { data } = useGetSessionsQuery();
  const { data: securityData } = useGetSecurityQuery();
  const sessions = data?.data?.sessions || [];
  const security = securityData?.data?.security;

  const checklist = [
    { label: 'Email verified', done: user?.isEmailVerified, to: '/profile' },
    { label: 'Two-factor authentication', done: user?.twoFactorEnabled, to: '/security' },
    { label: 'Profile completed', done: Boolean(user?.bio), to: '/profile' },
  ];
  const completed = checklist.filter((c) => c.done).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} src={user?.avatar} size="lg" />
          <div>
            <p className="text-sm text-ink-500 dark:text-ink-400">{greeting()},</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">{user?.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn('badge capitalize', roleBadge(user?.role))}>{user?.role}</span>
              {user?.isEmailVerified ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><FiCheckCircle size={11} /> Verified</Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400"><FiAlertCircle size={11} /> Unverified</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/security"><Button variant="secondary"><FiShield /> Security</Button></Link>
          {isModerator && <Link to="/admin"><Button><FiActivity /> {isAdmin ? 'Admin' : 'Moderation'}</Button></Link>}
        </div>
      </motion.div>

      <Card className="mt-6">
        <CardHeader title="Security score" subtitle="Your account hardening progress" icon={FiShield} />
        <SecurityScoreCard security={security} />
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Account role" value={user?.role} icon={FiUser} accent="brand" delay={0} />
        <StatCard label="Permissions" value={user?.permissions?.length || 0} icon={FiKey} accent="sky" delay={0.05} hint="Granted by your role" />
        <StatCard label="2FA" value={user?.twoFactorEnabled ? 'On' : 'Off'} icon={FiSmartphone} accent={user?.twoFactorEnabled ? 'emerald' : 'amber'} delay={0.1} />
        <StatCard label="Active sessions" value={sessions.length} icon={FiMonitor} accent="rose" delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Security checklist" subtitle={`${completed} of ${checklist.length} completed`} icon={FiShield} />
          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
                <span className="flex items-center gap-3 text-sm font-medium">
                  {item.done ? <FiCheckCircle className="text-emerald-500" /> : <FiAlertCircle className="text-amber-500" />}
                  {item.label}
                </span>
                {item.done ? (
                  <span className="text-xs font-semibold text-emerald-500">Done</span>
                ) : (
                  <Link to={item.to} className="link text-xs">Set up <FiArrowRight className="inline" size={12} /></Link>
                )}
              </div>
            ))}
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${(completed / checklist.length) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Your permissions" subtitle="Role-based access" icon={FiKey} />
          <div className="flex flex-wrap gap-2">
            {(user?.permissions || []).map((p) => (
              <span key={p} className="rounded-lg bg-ink-100 px-2.5 py-1 font-mono text-xs text-ink-600 dark:bg-white/5 dark:text-ink-300">
                {p}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Recent sessions"
          subtitle="Devices currently signed in"
          icon={FiMonitor}
          action={<Link to="/security" className="link text-sm">Manage</Link>}
        />
        <div className="space-y-2">
          {sessions.slice(0, 4).map((s) => (
            <div key={s._id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
                  <FiMonitor size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium">{s.browser} · {s.os}</p>
                  <p className="text-xs text-ink-400">{s.ip} · {formatRelative(s.lastUsedAt)}</p>
                </div>
              </div>
              {s.current && <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">This device</Badge>}
            </div>
          ))}
          {sessions.length === 0 && <p className="text-sm text-ink-400">No active sessions.</p>}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

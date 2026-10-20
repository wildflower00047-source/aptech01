import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiCheckCircle,
  FiUserX,
  FiShield,
  FiActivity,
  FiMail,
  FiSmartphone,
  FiArrowRight,
  FiTrendingUp,
} from 'react-icons/fi';
import { useGetStatsQuery, useGetAuditLogsQuery } from '../../api/apiSlice.js';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Spinner } from '../../components/ui/Badge.jsx';
import { roleBadge, formatRelative, cn } from '../../lib/utils.js';

const ActionIcon = ({ status }) =>
  status === 'failure' ? <FiUserX className="text-red-500" /> : <FiCheckCircle className="text-emerald-500" />;

export const AdminOverview = () => {
  const { data, isLoading } = useGetStatsQuery();
  const { data: logsData } = useGetAuditLogsQuery({ limit: 6 });
  const stats = data?.data?.stats;
  const logs = logsData?.data?.logs || [];

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner size={40} />
      </div>
    );
  }

  const roleEntries = Object.entries(stats?.byRole || {});

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">Admin overview</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Platform health and user insights.</p>
        </div>
        <Link to="/admin/users" className="btn-primary">
          Manage users <FiArrowRight />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats?.total ?? 0} icon={FiUsers} accent="brand" hint={`+${stats?.newThisWeek ?? 0} this week`} />
        <StatCard label="Active" value={stats?.active ?? 0} icon={FiCheckCircle} accent="emerald" />
        <StatCard label="Verified emails" value={stats?.verified ?? 0} icon={FiMail} accent="sky" />
        <StatCard label="2FA enabled" value={stats?.twoFactor ?? 0} icon={FiSmartphone} accent="violet" />
        <StatCard label="Admins" value={stats?.admins ?? 0} icon={FiShield} accent="rose" />
        <StatCard label="Banned" value={stats?.banned ?? 0} icon={FiUserX} accent="amber" />
        <StatCard label="New this week" value={stats?.newThisWeek ?? 0} icon={FiTrendingUp} accent="emerald" />
        <StatCard label="Roles" value={roleEntries.length} icon={FiActivity} accent="brand" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Users by role" subtitle="Distribution across roles" icon={FiUsers} />
          <div className="space-y-4">
            {roleEntries.map(([role, count]) => {
              const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={role}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className={cn('badge capitalize', roleBadge(role))}>{role}</span>
                    <span className="font-semibold">{count} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {roleEntries.length === 0 && <p className="text-sm text-ink-400">No data yet.</p>}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent activity"
            subtitle="Latest audit events"
            icon={FiActivity}
            action={<Link to="/admin/audit" className="link text-sm">View all</Link>}
          />
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-100 dark:bg-white/5">
                  <ActionIcon status={log.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{log.action}</p>
                  <p className="truncate text-xs text-ink-400">
                    {log.actorEmail || log.user?.email || 'system'} · {formatRelative(log.createdAt)}
                  </p>
                </div>
                <span className={cn('badge', log.category === 'security' ? 'bg-amber-500/15 text-amber-600' : 'bg-ink-500/15 text-ink-500')}>
                  {log.category}
                </span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-ink-400">No activity yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;

import { FiAlertTriangle, FiShield, FiActivity, FiWifi, FiMonitor, FiRefreshCw } from 'react-icons/fi';
import { useGetThreatsQuery } from '../../api/apiSlice.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Badge, Spinner } from '../../components/ui/Badge.jsx';
import { formatRelative, cn } from '../../lib/utils.js';

const riskStyle = {
  high: 'bg-red-500/15 text-red-600 dark:text-red-400',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  low: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

export const AdminThreats = () => {
  const { data, isLoading, isFetching, refetch } = useGetThreatsQuery();
  const threats = data?.data || {};
  const summary = threats.summary || {};
  const securityEvents = threats.securityEvents || [];
  const riskySessions = threats.riskySessions || [];
  const failedByIp = threats.failedByIp || [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">Threat center</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Security signals across the platform.</p>
        </div>
        <Button variant="secondary" loading={isFetching} onClick={refetch}>
          <FiRefreshCw /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Failed logins (7d)" value={summary.failedLogins7d ?? 0} icon={FiAlertTriangle} accent="rose" />
        <StatCard label="Risky sessions" value={summary.riskySessions ?? 0} icon={FiShield} accent="amber" />
        <StatCard label="Security events" value={securityEvents.length} icon={FiActivity} accent="brand" />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Spinner size={40} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Risky sessions" subtitle="Sign-ins flagged medium or high risk" icon={FiMonitor} />
            <div className="space-y-2">
              {riskySessions.map((s) => (
                <div key={s._id} className="rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{s.user?.name || s.user?.email || 'Unknown'}</p>
                    <Badge className={riskStyle[s.riskLevel] || riskStyle.low}>{s.riskLevel} · {s.riskScore}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">
                    {s.device || 'device'} · {s.browser || 'browser'} · {s.ip} · {formatRelative(s.createdAt)}
                  </p>
                  {(s.riskFactors || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.riskFactors.map((f) => (
                        <span key={f.key} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                          {f.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {riskySessions.length === 0 && <p className="text-sm text-ink-400">No risky sessions detected.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Suspicious IPs" subtitle="Most failed sign-ins in the last 7 days" icon={FiWifi} />
            <div className="space-y-2">
              {failedByIp.map((row) => (
                <div key={row.ip} className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
                  <span className="font-mono text-sm text-ink-600 dark:text-ink-300">{row.ip}</span>
                  <span className={cn('badge', row.count >= 5 ? riskStyle.high : riskStyle.medium)}>{row.count} failed</span>
                </div>
              ))}
              {failedByIp.length === 0 && <p className="text-sm text-ink-400">No failed sign-ins recorded.</p>}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Security event feed" subtitle="Recent security-related audit events" icon={FiActivity} />
            <div className="space-y-2">
              {securityEvents.map((e) => (
                <div key={e._id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                    <FiAlertTriangle size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.action}</p>
                    <p className="truncate text-xs text-ink-400">
                      {e.user?.email || e.actorEmail || 'system'} · {e.description || '—'}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-ink-400">{formatRelative(e.createdAt)}</span>
                </div>
              ))}
              {securityEvents.length === 0 && <p className="text-sm text-ink-400">No security events.</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminThreats;

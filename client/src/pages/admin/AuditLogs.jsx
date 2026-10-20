import { useState } from 'react';
import { FiActivity, FiSearch, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useGetAuditLogsQuery } from '../../api/apiSlice.js';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, Spinner } from '../../components/ui/Badge.jsx';
import { formatDate, cn } from '../../lib/utils.js';

const CATEGORIES = ['auth', 'account', 'security', 'admin', 'system'];

const categoryStyle = {
  auth: 'bg-brand-500/15 text-brand-600 dark:text-brand-400',
  account: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  security: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  admin: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
  system: 'bg-ink-500/15 text-ink-500',
};

export const AdminAuditLogs = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20, category: '', action: '' });
  const { data, isLoading, isFetching } = useGetAuditLogsQuery(filters);

  const logs = data?.data?.logs || [];
  const pagination = data?.data?.pagination;

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: key === 'page' ? value : 1 }));
  const cellCls = 'px-4 py-3 text-sm';

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">Audit logs</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {pagination ? `${pagination.total} recorded events` : 'Security and account activity'}
        </p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input icon={FiSearch} placeholder="Search action (e.g. user.login)" value={filters.action} onChange={(e) => setFilter('action', e.target.value)} />
          <select className="input" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          <select className="input" value={filters.limit} onChange={(e) => setFilter('limit', Number(e.target.value))}>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-400 dark:border-white/5">
                <th className={cellCls}>Status</th>
                <th className={cellCls}>Action</th>
                <th className={cellCls}>Actor</th>
                <th className={cellCls}>Category</th>
                <th className={cellCls}>IP</th>
                <th className={cellCls}>Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-16 text-center"><Spinner size={32} /></td>
                </tr>
              )}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-ink-400">No audit events found.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-ink-50 transition hover:bg-ink-50/60 dark:border-white/5 dark:hover:bg-white/5">
                  <td className={cellCls}>
                    {log.status === 'success' ? (
                      <FiCheckCircle className="text-emerald-500" />
                    ) : (
                      <FiXCircle className="text-red-500" />
                    )}
                  </td>
                  <td className={cn(cellCls, 'font-medium')} title={log.description}>
                    {log.action}
                  </td>
                  <td className={cn(cellCls, 'text-ink-500 dark:text-ink-400')}>
                    {log.user?.name || log.actorEmail || 'system'}
                  </td>
                  <td className={cellCls}>
                    <Badge className={categoryStyle[log.category]}>{log.category}</Badge>
                  </td>
                  <td className={cn(cellCls, 'font-mono text-xs text-ink-400')}>{log.ip || '—'}</td>
                  <td className={cn(cellCls, 'whitespace-nowrap text-ink-400')}>{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 dark:border-white/5">
            <p className="text-xs text-ink-400">
              Page {pagination.page} of {pagination.pages} {isFetching && '· updating…'}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={!pagination.hasPrev} onClick={() => setFilter('page', filters.page - 1)}>
                <FiChevronLeft /> Prev
              </Button>
              <Button variant="secondary" disabled={!pagination.hasNext} onClick={() => setFilter('page', filters.page + 1)}>
                Next <FiChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <p className="mt-4 flex items-center gap-2 text-xs text-ink-400">
        <FiActivity size={13} /> Logs are read-only and retained for security monitoring.
      </p>
    </div>
  );
};

export default AdminAuditLogs;

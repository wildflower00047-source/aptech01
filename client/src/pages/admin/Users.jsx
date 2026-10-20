import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiUserPlus,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiMail,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
} from '../../api/apiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Avatar, Badge, Spinner } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import PasswordStrength from '../../components/common/PasswordStrength.jsx';
import { roleBadge, statusBadge, formatDate, extractError, passwordStrength, cn } from '../../lib/utils.js';

const ROLES = ['user', 'moderator', 'admin'];

export const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', role: '', status: '' });
  const { data, isLoading, isFetching } = useGetUsersQuery(filters);
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateRole] = useUpdateUserRoleMutation();
  const [updateStatus] = useUpdateUserStatusMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;
  const { score } = passwordStrength(form.password);

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: key === 'page' ? value : 1 }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (score < 5) return toast.error('Please choose a stronger password');
    try {
      await createUser(form).unwrap();
      toast.success('User created');
      setCreateOpen(false);
      setForm({ name: '', email: '', password: '', role: 'user' });
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const handleRole = async (id, role) => {
    try {
      await updateRole({ id, role }).unwrap();
      toast.success('Role updated');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const handleStatus = async (user, patch) => {
    try {
      await updateStatus({ id: user.id, ...patch }).unwrap();
      toast.success('Status updated');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(confirmDelete.id).unwrap();
      toast.success('User deleted');
      setConfirmDelete(null);
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const cellCls = 'px-4 py-3 text-sm';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">Users</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {pagination ? `${pagination.total} total accounts` : 'Manage account access'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <FiUserPlus /> Add user
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            icon={FiSearch}
            placeholder="Search name or email"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
          <select className="input" value={filters.role} onChange={(e) => setFilter('role', e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </select>
          <select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
            <option value="verified">Verified</option>
          </select>
          <select className="input" value={filters.limit} onChange={(e) => setFilter('limit', Number(e.target.value))}>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-400 dark:border-white/5">
                <th className={cellCls}>User</th>
                <th className={cellCls}>Role</th>
                <th className={cellCls}>Status</th>
                <th className={cellCls}>Joined</th>
                <th className={cn(cellCls, 'text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Spinner size={32} />
                  </td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-ink-400">No users match your filters.</td>
                </tr>
              )}
              {users.map((u) => {
                const status = statusBadge(u);
                return (
                  <tr key={u.id} className="border-b border-ink-50 transition hover:bg-ink-50/60 dark:border-white/5 dark:hover:bg-white/5">
                    <td className={cellCls}>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatar} size="sm" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate font-medium text-ink-800 dark:text-ink-100">
                            {u.name}
                            {u.isEmailVerified && <FiCheckCircle size={12} className="text-emerald-500" />}
                          </p>
                          <p className="flex items-center gap-1 truncate text-xs text-ink-400"><FiMail size={11} /> {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cellCls}>
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRole(u.id, e.target.value)}
                          className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs capitalize dark:border-white/10 dark:bg-ink-950"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r} className="capitalize">{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={cn('badge capitalize', roleBadge(u.role))}>{u.role}</span>
                      )}
                    </td>
                    <td className={cellCls}>
                      <Badge className={status.className} dot>{status.label}</Badge>
                    </td>
                    <td className={cn(cellCls, 'text-ink-400')}>{formatDate(u.createdAt, { timeStyle: undefined })}</td>
                    <td className={cn(cellCls, 'text-right')}>
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1">
                          {u.isBanned || !u.isActive ? (
                            <button
                              title="Activate"
                              onClick={() => handleStatus(u, { isActive: true, isBanned: false, bannedReason: '' })}
                              className="grid h-8 w-8 place-items-center rounded-lg text-emerald-500 transition hover:bg-emerald-500/10"
                            >
                              <FiUserCheck size={16} />
                            </button>
                          ) : (
                            <button
                              title="Ban"
                              onClick={() => handleStatus(u, { isBanned: true, bannedReason: 'Banned by admin' })}
                              className="grid h-8 w-8 place-items-center rounded-lg text-amber-500 transition hover:bg-amber-500/10"
                            >
                              <FiUserX size={16} />
                            </button>
                          )}
                          <button
                            title="Delete"
                            onClick={() => setConfirmDelete(u)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-500/10"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400"><FiShield className="inline" size={12} /> view only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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

      {/* Create user */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create a new user">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <div>
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            {form.password && <PasswordStrength password={form.password} />}
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input capitalize" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating}><FiUserPlus /> Create user</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete user?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete permanently</Button>
          </>
        }
      >
        <p className="text-sm text-ink-500 dark:text-ink-400">
          This permanently deletes <span className="font-semibold text-ink-700 dark:text-ink-200">{confirmDelete?.email}</span> and revokes all their sessions.
        </p>
      </Modal>
    </div>
  );
};

export default AdminUsers;

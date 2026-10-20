import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiKey, FiRotateCcw, FiSave, FiLock } from 'react-icons/fi';
import {
  useGetRbacQuery,
  useUpdateRolePermissionsMutation,
  useResetRolePermissionsMutation,
} from '../../api/apiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Badge.jsx';
import { extractError, cn } from '../../lib/utils.js';

const roleAccent = {
  user: 'from-brand-500 to-violet-500',
  moderator: 'from-amber-500 to-orange-500',
  admin: 'from-fuchsia-500 to-rose-500',
};

export const AdminRbac = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage:rbac');
  const { data, isLoading } = useGetRbacQuery(undefined, { skip: !canManage });
  const [updateRole, { isLoading: saving }] = useUpdateRolePermissionsMutation();
  const [resetRole, { isLoading: resetting }] = useResetRolePermissionsMutation();

  const matrix = data?.data;
  const roles = matrix ? Object.values(matrix.roles) : [];
  const permissions = matrix ? matrix.permissions : {};

  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (matrix?.effective) setDraft(matrix.effective);
  }, [matrix]);

  if (!canManage) {
    return (
      <Card className="grid place-items-center py-16 text-center">
        <FiLock className="mb-3 text-ink-400" size={26} />
        <p className="font-semibold">Access restricted</p>
        <p className="mt-1 text-sm text-ink-400">You need the &quot;Edit roles &amp; permissions&quot; permission.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner size={40} />
      </div>
    );
  }

  const toggle = (role, permissionKey) => {
    setDraft((prev) => {
      const current = prev[role] || [];
      const next = current.includes(permissionKey)
        ? current.filter((p) => p !== permissionKey)
        : [...current, permissionKey];
      return { ...prev, [role]: next };
    });
  };

  const save = async (role) => {
    try {
      await updateRole({ role, permissions: draft[role] || [] }).unwrap();
      toast.success(`Saved permissions for ${role}`);
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const reset = async (role) => {
    try {
      await resetRole(role).unwrap();
      toast.success(`Reset ${role} to defaults`);
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">Roles &amp; permissions</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Live RBAC editor. Changes apply immediately to all sessions of the affected role.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {roles.map((role) => {
          const granted = draft[role] || [];
          const isDefault = JSON.stringify([...granted].sort()) === JSON.stringify([...(matrix?.defaults?.[role] || [])].sort());
          return (
            <Card key={role}>
              <CardHeader
                title={<span className="capitalize">{role}</span>}
                subtitle={isDefault ? 'Using default permissions' : 'Custom overrides active'}
                icon={FiKey}
                action={
                  <span className={cn('grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white', roleAccent[role])}>
                    <FiKey size={16} />
                  </span>
                }
              />
              <div className="space-y-1.5">
                {Object.entries(permissions).map(([key, label]) => {
                  const checked = granted.includes(key);
                  return (
                    <label
                      key={key}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition',
                        checked
                          ? 'border-brand-400/40 bg-brand-500/5'
                          : 'border-ink-100 hover:bg-ink-50 dark:border-white/5 dark:hover:bg-white/5',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(role, key)}
                        className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="flex-1">{label}</span>
                      <span className="font-mono text-[10px] text-ink-400">{key}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <Button loading={saving} onClick={() => save(role)}>
                  <FiSave /> Save
                </Button>
                <Button variant="secondary" loading={resetting} onClick={() => reset(role)}>
                  <FiRotateCcw /> Reset
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminRbac;

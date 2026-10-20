import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiSettings, FiSave, FiLock, FiShield, FiUserCheck, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../api/apiSlice.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Spinner } from '../../components/ui/Badge.jsx';
import { extractError, cn } from '../../lib/utils.js';

const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative h-6 w-11 shrink-0 rounded-full transition',
      checked ? 'bg-brand-500' : 'bg-ink-200 dark:bg-white/10',
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
        checked ? 'left-[22px]' : 'left-0.5',
      )}
    />
  </button>
);

const TOGGLES = [
  { key: 'registrationOpen', label: 'Open registration', hint: 'Allow new users to sign up.', icon: FiUserCheck },
  { key: 'require2FAForAdmins', label: 'Require 2FA for admins', hint: 'Force administrators to enable 2FA.', icon: FiShield },
  { key: 'anomalyHighRiskRequires2FA', label: 'High-risk sign-ins require 2FA', hint: 'Challenge risky logins with a second factor.', icon: FiAlertTriangle },
  { key: 'banAfterMaxAttempts', label: 'Auto-ban after max attempts', hint: 'Lock accounts after repeated failures.', icon: FiLock },
  { key: 'maintenanceMode', label: 'Maintenance mode', hint: 'Show a maintenance notice to users.', icon: FiSettings },
];

export const AdminSettings = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage:settings');
  const { data, isLoading } = useGetSettingsQuery(undefined, { skip: !canManage });
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data?.data?.settings) setForm(data.data.settings);
  }, [data]);

  if (!canManage) {
    return (
      <Card className="grid place-items-center py-16 text-center">
        <FiLock className="mb-3 text-ink-400" size={26} />
        <p className="font-semibold">Access restricted</p>
        <p className="mt-1 text-sm text-ink-400">You need the &quot;Manage system settings&quot; permission.</p>
      </Card>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner size={40} />
      </div>
    );
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    try {
      await updateSettings({
        registrationOpen: form.registrationOpen,
        require2FAForAdmins: form.require2FAForAdmins,
        anomalyHighRiskRequires2FA: form.anomalyHighRiskRequires2FA,
        banAfterMaxAttempts: form.banAfterMaxAttempts,
        maintenanceMode: form.maintenanceMode,
        sessionIdleTimeoutMinutes: Number(form.sessionIdleTimeoutMinutes) || 0,
        threatFeedSize: Number(form.threatFeedSize) || 25,
      }).unwrap();
      toast.success('Settings saved');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">System settings</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Platform-wide security and access policies.</p>
        </div>
        <Button loading={saving} onClick={save}>
          <FiSave /> Save changes
        </Button>
      </div>

      <Card>
        <CardHeader title="Security policy" subtitle="Tune platform security behaviour" icon={FiShield} />
        <div className="space-y-2">
          {TOGGLES.map(({ key, label, hint, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-ink-400">{hint}</p>
                </div>
              </div>
              <Switch checked={Boolean(form[key])} onChange={(v) => set(key, v)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Thresholds" subtitle="Session and threat detection tuning" icon={FiClock} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Session idle timeout (minutes, 0 = off)"
            type="number"
            min={0}
            max={1440}
            value={form.sessionIdleTimeoutMinutes}
            onChange={(e) => set('sessionIdleTimeoutMinutes', e.target.value)}
          />
          <Input
            label="Threat feed size"
            type="number"
            min={5}
            max={100}
            value={form.threatFeedSize}
            onChange={(e) => set('threatFeedSize', e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;

import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FiLock,
  FiSmartphone,
  FiMonitor,
  FiTrash2,
  FiShield,
  FiKey,
  FiCheckCircle,
  FiCopy,
  FiLogOut,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.js';
import {
  useChangePasswordMutation,
  useSetupTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useDisableTwoFactorMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useLogoutAllMutation,
  useGetSecurityQuery,
} from '../api/apiSlice.js';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import PasswordStrength from '../components/common/PasswordStrength.jsx';
import SecurityQuests from '../components/security/SecurityQuests.jsx';
import PasskeyManager from '../components/security/PasskeyManager.jsx';
import { extractError, formatRelative, passwordStrength, cn } from '../lib/utils.js';
import { setAccessToken } from '../api/axios.js';

export const Security = () => {
  const { user } = useAuth();
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();
  const [setup2fa, { isLoading: settingUp }] = useSetupTwoFactorMutation();
  const [verify2fa, { isLoading: verifying }] = useVerifyTwoFactorMutation();
  const [disable2fa, { isLoading: disabling }] = useDisableTwoFactorMutation();
  const { data: sessionsData, isLoading: loadingSessions } = useGetSessionsQuery();
  const { data: securityData } = useGetSecurityQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [logoutAll, { isLoading: loggingOutAll }] = useLogoutAllMutation();

  const security = securityData?.data?.security;

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [totp, setTotp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  const sessions = sessionsData?.data?.sessions || [];
  const { score } = passwordStrength(pwd.newPassword);

  const submitPassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) return toast.error('Passwords do not match');
    if (score < 5) return toast.error('Please choose a stronger password');
    try {
      await changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }).unwrap();
      toast.success('Password changed. Signing you out...');
      setAccessToken(null);
      setTimeout(() => (window.location.href = '/login'), 1200);
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const startSetup = async () => {
    try {
      const res = await setup2fa().unwrap();
      setTwoFactorSetup(res.data);
      setRecoveryCodes([]);
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const confirmSetup = async () => {
    try {
      const res = await verify2fa({ totp }).unwrap();
      setRecoveryCodes(res.data.recoveryCodes);
      setTwoFactorSetup(null);
      setTotp('');
      toast.success('Two-factor authentication enabled');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const handleDisable = async () => {
    try {
      await disable2fa({ password: disablePassword }).unwrap();
      setDisableOpen(false);
      setDisablePassword('');
      toast.success('Two-factor authentication disabled');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const revoke = async (id) => {
    try {
      await revokeSession(id).unwrap();
      toast.success('Session revoked');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll().unwrap();
      setAccessToken(null);
      toast.success('Signed out from all devices');
      setTimeout(() => (window.location.href = '/login'), 1000);
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const copy = (text, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">Security settings</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Protect your account with a strong password and 2FA.</p>

      <div className="mt-6 space-y-6">
        {/* Gamified security quests */}
        <SecurityQuests security={security} onRecoveryCodes={setRecoveryCodes} />

        {/* Change password */}
        <Card>
          <CardHeader title="Password" subtitle="Update your account password" icon={FiLock} />
          <form onSubmit={submitPassword} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Current password"
                type="password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <Input
                label="New password"
                type="password"
                value={pwd.newPassword}
                onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="New strong password"
                required
              />
            </div>
            <Input
              label="Confirm new password"
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password"
              error={pwd.confirm && pwd.confirm !== pwd.newPassword ? 'Passwords do not match' : ''}
              required
            />
            {pwd.newPassword && (
              <div className="sm:col-span-2">
                <PasswordStrength password={pwd.newPassword} />
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" loading={changing}><FiLock /> Update password</Button>
            </div>
          </form>
        </Card>

        {/* 2FA */}
        <Card>
          <CardHeader
            title="Two-factor authentication"
            subtitle="Add an extra layer of security with a TOTP app"
            icon={FiSmartphone}
            action={
              <Badge className={user?.twoFactorEnabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-ink-500/15 text-ink-500'}>
                {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            }
          />

          {recoveryCodes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle /> 2FA enabled — save your recovery codes
              </p>
              <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">Each code can be used once if you lose your device.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {recoveryCodes.map((code) => (
                  <span key={code} className="rounded-lg bg-white px-2 py-1.5 text-center font-mono text-xs dark:bg-ink-950">{code}</span>
                ))}
              </div>
              <Button variant="secondary" className="mt-3" onClick={() => copy(recoveryCodes.join('\n'), 'Recovery codes copied')}>
                <FiCopy /> Copy all
              </Button>
            </motion.div>
          )}

          {user?.twoFactorEnabled ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-4 dark:border-white/5">
              <p className="text-sm text-ink-500 dark:text-ink-400">Two-factor authentication is protecting your account.</p>
              <Button variant="danger" onClick={() => setDisableOpen(true)}>Disable 2FA</Button>
            </div>
          ) : twoFactorSetup ? (
            <div className="grid gap-5 sm:grid-cols-[auto,1fr]">
              <div className="rounded-2xl bg-white p-3 dark:bg-white">
                <img src={twoFactorSetup.qrCode} alt="2FA QR code" className="h-40 w-40" />
              </div>
              <div>
                <p className="text-sm font-medium">1. Scan the QR code with your authenticator app.</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-ink-100 px-3 py-2 font-mono text-xs dark:bg-white/5">{twoFactorSetup.secret}</code>
                  <Button variant="secondary" onClick={() => copy(twoFactorSetup.secret, 'Secret copied')}><FiCopy /></Button>
                </div>
                <p className="mt-4 text-sm font-medium">2. Enter the 6-digit code to confirm.</p>
                <div className="mt-2 flex gap-2">
                  <Input value={totp} onChange={(e) => setTotp(e.target.value)} maxLength={6} inputMode="numeric" placeholder="123456" containerClassName="max-w-[160px]" />
                  <Button loading={verifying} onClick={confirmSetup}><FiCheckCircle /> Verify</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-4 dark:border-white/5">
              <p className="text-sm text-ink-500 dark:text-ink-400">Strengthen your account by enabling 2FA.</p>
              <Button loading={settingUp} onClick={startSetup}><FiShield /> Enable 2FA</Button>
            </div>
          )}
        </Card>

        {/* Passkeys */}
        <PasskeyManager />

        {/* Sessions */}
        <Card>
          <CardHeader
            title="Active sessions"
            subtitle="Devices currently signed in to your account"
            icon={FiMonitor}
            action={
              <Button variant="secondary" loading={loggingOutAll} onClick={handleLogoutAll}>
                <FiLogOut /> Sign out all
              </Button>
            }
          />
          <div className="space-y-2">
            {loadingSessions && <p className="text-sm text-ink-400">Loading sessions…</p>}
            {sessions.map((s) => (
              <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-500">
                    <FiMonitor size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{s.browser} · {s.os}</p>
                    <p className="text-xs text-ink-400">{s.ip} · {formatRelative(s.lastUsedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.current ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">This device</Badge>
                  ) : (
                    <Button variant="ghost" onClick={() => revoke(s._id)} className="text-red-500 hover:bg-red-500/10">
                      <FiTrash2 /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!loadingSessions && sessions.length === 0 && <p className="text-sm text-ink-400">No active sessions.</p>}
          </div>
        </Card>

        {/* Permissions (authorization insight) */}
        <Card>
          <CardHeader title="Access & permissions" subtitle="Granted by your role" icon={FiKey} />
          <div className="flex flex-wrap gap-2">
            {(user?.permissions || []).map((p) => (
              <span key={p} className={cn('rounded-lg bg-ink-100 px-2.5 py-1 font-mono text-xs text-ink-600 dark:bg-white/5 dark:text-ink-300')}>
                {p}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        title="Disable two-factor authentication"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisableOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={disabling} onClick={handleDisable}>Disable 2FA</Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">Enter your password to confirm disabling 2FA.</p>
        <Input label="Password" type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="••••••••" />
      </Modal>
    </div>
  );
};

export default Security;

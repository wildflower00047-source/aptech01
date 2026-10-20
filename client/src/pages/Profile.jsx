import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSave, FiUser, FiImage, FiFileText, FiMail, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.js';
import { useUpdateProfileMutation, useDeleteAccountMutation, useResendVerificationMutation, useLogoutMutation } from '../api/apiSlice.js';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { roleBadge, cn, extractError } from '../lib/utils.js';

export const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const [resend, { isLoading: resending }] = useResendVerificationMutation();
  const [logout] = useLogoutMutation();

  const [form, setForm] = useState({ name: '', bio: '', avatar: '', emailNotifications: true });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        emailNotifications: user.preferences?.emailNotifications ?? true,
      });
    }
  }, [user]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        avatar: form.avatar,
        preferences: { theme: user?.preferences?.theme || 'system', emailNotifications: form.emailNotifications },
      }).unwrap();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const handleResend = async () => {
    try {
      await resend({ email: user.email }).unwrap();
      toast.success('Verification email sent (check the server console in dev).');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount({ password }).unwrap();
      toast.success('Account deactivated');
      await logout().unwrap();
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">Profile settings</h1>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage your account information and preferences.</p>

      {!user?.isEmailVerified && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-300">Your email is not verified yet.</p>
          </div>
          <Button variant="secondary" loading={resending} onClick={handleResend}>Resend link</Button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="h-fit lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user?.name} src={form.avatar} size="xl" />
            <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{user?.name}</h3>
            <p className="text-sm text-ink-400">{user?.email}</p>
            <span className={cn('badge mt-3 capitalize', roleBadge(user?.role))}>{user?.role}</span>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Personal information" subtitle="Update your public profile" icon={FiUser} />
          <form onSubmit={save} className="space-y-4">
            <Input label="Full name" icon={FiUser} value={form.name} onChange={update('name')} required />
            <div>
              <label className="label">Bio</label>
              <div className="relative">
                <FiFileText className="pointer-events-none absolute left-3 top-3 text-ink-400" size={17} />
                <textarea
                  value={form.bio}
                  onChange={update('bio')}
                  rows={3}
                  maxLength={280}
                  placeholder="Tell us a little about yourself"
                  className="input pl-10"
                />
              </div>
              <p className="mt-1 text-xs text-ink-400">{form.bio.length}/280</p>
            </div>
            <Input label="Avatar URL" icon={FiImage} placeholder="https://..." value={form.avatar} onChange={update('avatar')} hint="Paste a direct image URL" />

            <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3.5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <FiMail className="text-ink-400" />
                <span className="text-sm">Email notifications</span>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, emailNotifications: !f.emailNotifications }))}
                className={cn('relative h-6 w-11 rounded-full transition', form.emailNotifications ? 'bg-brand-500' : 'bg-ink-300 dark:bg-ink-700')}
              >
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', form.emailNotifications ? 'left-[22px]' : 'left-0.5')} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" loading={isLoading}><FiSave /> Save changes</Button>
              <span className="flex items-center gap-1.5 text-xs text-ink-400">
                <FiMail size={13} /> {user?.email}
              </span>
            </div>
          </form>
        </Card>
      </div>

      <Card className="mt-6 border-red-500/20 dark:border-red-500/20">
        <CardHeader title="Danger zone" subtitle="Irreversible account actions" icon={FiShield} />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Deactivate account</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">All sessions will be revoked and you&apos;ll be signed out.</p>
          </div>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Deactivate</Button>
        </div>
      </Card>

      {isAdmin && (
        <p className="mt-6 text-center text-xs text-ink-400">
          Need admin tools? Visit the <Link to="/admin" className="link">admin console</Link>.
        </p>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Deactivate your account?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Deactivate account</Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
          This will deactivate your account and sign you out of all devices. Enter your password to confirm.
        </p>
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </Modal>
    </div>
  );
};

export default Profile;

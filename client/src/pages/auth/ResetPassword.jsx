import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import PasswordStrength from '../../components/common/PasswordStrength.jsx';
import { useResetPasswordMutation } from '../../api/apiSlice.js';
import { extractError, passwordStrength } from '../../lib/utils.js';

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [reset, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();
  const { score } = passwordStrength(form.password);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (score < 5) return toast.error('Please choose a stronger password');
    if (!token) return toast.error('Missing reset token');
    try {
      await reset({ token, password: form.password }).unwrap();
      toast.success('Password reset! Please sign in.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <Link to="/login" className="link">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-red-500/10 text-red-500">
            <FiCheckCircle size={22} />
          </span>
          <p className="font-semibold text-ink-800 dark:text-ink-100">Invalid reset link</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Request a new password reset link to continue.
          </p>
          <Link to="/forgot-password">
            <Button className="mt-4">Request new link</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Input
              label="New password"
              type="password"
              icon={FiLock}
              placeholder="Enter new password"
              value={form.password}
              onChange={update('password')}
              required
              autoComplete="new-password"
            />
            {form.password && <PasswordStrength password={form.password} />}
          </div>
          <Input
            label="Confirm password"
            type="password"
            icon={FiLock}
            placeholder="Repeat new password"
            value={form.confirm}
            onChange={update('confirm')}
            required
            autoComplete="new-password"
            error={form.confirm && form.confirm !== form.password ? 'Passwords do not match' : ''}
          />
          <Button type="submit" loading={isLoading} className="w-full">
            Reset password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;

import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiSmartphone, FiKey } from 'react-icons/fi';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useLoginMutation, usePasskeyLoginOptionsMutation, usePasskeyLoginVerifyMutation } from '../../api/apiSlice.js';
import { setAccessToken } from '../../api/axios.js';
import { extractError } from '../../lib/utils.js';

const DEMO = [
  { label: 'Admin', email: 'admin@authsec.dev', password: 'Admin@12345', color: 'text-fuchsia-500' },
  { label: 'Moderator', email: 'moderator@authsec.dev', password: 'Moderator@123', color: 'text-amber-500' },
  { label: 'User', email: 'user@authsec.dev', password: 'User@12345', color: 'text-brand-500' },
];

export const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', totp: '' });
  const [twoFactor, setTwoFactor] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [getPasskeyOptions] = usePasskeyLoginOptionsMutation();
  const [verifyPasskey, { isLoading: passkeyLoading }] = usePasskeyLoginVerifyMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { email: form.email, password: form.password };
      if (form.totp) payload.totp = form.totp;
      const res = await login(payload).unwrap();
      if (res.twoFactorRequired) {
        setTwoFactor(true);
        toast('Enter your two-factor code', { icon: '🔐' });
        return;
      }
      setAccessToken(res.data.accessToken);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(extractError(error, 'Unable to sign in'));
    }
  };

  const fillDemo = (creds) => setForm({ email: creds.email, password: creds.password, totp: '' });

  const signInWithPasskey = async () => {
    if (!browserSupportsWebAuthn()) {
      toast.error('This browser does not support passkeys');
      return;
    }
    if (!form.email) {
      toast.error('Enter your email first');
      return;
    }
    try {
      const { data: optData } = await getPasskeyOptions({ email: form.email }).unwrap();
      const authResp = await startAuthentication(optData.options);
      const res = await verifyPasskey({ email: form.email, response: authResp }).unwrap();
      setAccessToken(res.data.accessToken);
      toast.success('Signed in with passkey');
      navigate(from, { replace: true });
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'AbortError') {
        toast.error('Passkey sign-in cancelled');
      } else {
        toast.error(extractError(error, 'Passkey sign-in failed'));
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AuthSec account to continue."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="link">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          icon={FiMail}
          placeholder="you@example.com"
          value={form.email}
          onChange={update('email')}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          icon={FiLock}
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          required
          autoComplete="current-password"
        />

        {twoFactor && (
          <Input
            label="Two-factor code"
            icon={FiSmartphone}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            value={form.totp}
            onChange={update('totp')}
            autoFocus
          />
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
            <input type="checkbox" className="rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="link text-sm">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={isLoading} className="w-full">
          {twoFactor ? 'Verify & sign in' : 'Sign in'} <FiArrowRight />
        </Button>

        {!twoFactor && (
          <>
            <div className="relative text-center">
              <span className="relative z-10 bg-ink-50 px-3 text-xs font-medium uppercase tracking-wider text-ink-400 dark:bg-ink-950">
                or
              </span>
              <div className="absolute left-0 top-1/2 h-px w-full bg-ink-200 dark:bg-white/10" />
            </div>
            <Button type="button" variant="secondary" className="w-full" loading={passkeyLoading} onClick={signInWithPasskey}>
              <FiKey /> Sign in with a passkey
            </Button>
          </>
        )}
      </form>

      <div className="mt-8">
        <div className="relative mb-4 text-center">
          <span className="relative z-10 bg-ink-50 px-3 text-xs font-medium uppercase tracking-wider text-ink-400 dark:bg-ink-950">
            Demo accounts
          </span>
          <div className="absolute left-0 top-1/2 h-px w-full bg-ink-200 dark:bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => fillDemo(d)}
              className="rounded-xl border border-ink-200 bg-white px-2 py-2.5 text-xs font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
            >
              <span className={d.color}>{d.label}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;

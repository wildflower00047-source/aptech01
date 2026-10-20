import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import PasswordStrength from '../../components/common/PasswordStrength.jsx';
import { useRegisterMutation } from '../../api/apiSlice.js';
import { extractError, passwordStrength } from '../../lib/utils.js';

export const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const { score } = passwordStrength(form.password);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (score < 5) {
      toast.error('Please choose a stronger password');
      return;
    }
    if (!terms) {
      toast.error('Please accept the terms to continue');
      return;
    }
    try {
      await register({ name: form.name, email: form.email, password: form.password }).unwrap();
      toast.success('Account created! Check your email to verify.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (error) {
      toast.error(extractError(error, 'Registration failed'));
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join AuthSec and start building securely in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" icon={FiUser} placeholder="Jane Doe" value={form.name} onChange={update('name')} required autoComplete="name" />
        <Input label="Email address" type="email" icon={FiMail} placeholder="you@example.com" value={form.email} onChange={update('email')} required autoComplete="email" />
        <div>
          <Input label="Password" type="password" icon={FiLock} placeholder="Create a strong password" value={form.password} onChange={update('password')} required autoComplete="new-password" />
          {form.password && <PasswordStrength password={form.password} />}
        </div>
        <Input label="Confirm password" type="password" icon={FiLock} placeholder="Repeat your password" value={form.confirm} onChange={update('confirm')} required autoComplete="new-password" error={form.confirm && form.confirm !== form.password ? 'Passwords do not match' : ''} />

        <label className="flex items-start gap-2.5 text-sm text-ink-500 dark:text-ink-400">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-0.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            I agree to the <span className="link">Terms of Service</span> and <span className="link">Privacy Policy</span>.
          </span>
        </label>

        <Button type="submit" loading={isLoading} className="w-full">
          Create account <FiArrowRight />
        </Button>
      </form>

      <ul className="mt-6 grid gap-2 text-xs text-ink-400">
        {['Email verification included', 'Optional two-factor authentication', 'Free and developer friendly'].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <FiCheck className="text-emerald-500" size={14} /> {f}
          </li>
        ))}
      </ul>
    </AuthLayout>
  );
};

export default Register;

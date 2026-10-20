import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft, FiSend } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useForgotPasswordMutation } from '../../api/apiSlice.js';
import { extractError } from '../../lib/utils.js';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [forgot, { isLoading }] = useForgotPasswordMutation();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await forgot({ email }).unwrap();
      setSent(true);
      toast.success('If the email exists, a reset link was sent.');
    } catch (error) {
      toast.error(extractError(error));
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="link inline-flex items-center gap-1">
          <FiArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <FiSend size={22} />
          </span>
          <p className="font-semibold text-ink-800 dark:text-ink-100">Reset link sent</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Check <span className="font-medium">{email}</span>. In development, the link is printed to the server
            console.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            icon={FiMail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button type="submit" loading={isLoading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;

import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiMail, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Badge.jsx';
import { useVerifyEmailQuery, useResendVerificationMutation } from '../../api/apiSlice.js';
import { extractError } from '../../lib/utils.js';

export const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const location = useLocation();
  const email = location.state?.email;
  const [resend, { isLoading: resending }] = useResendVerificationMutation();

  const { data, isLoading, isError, error } = useVerifyEmailQuery(token, { skip: !token });

  useEffect(() => {
    if (data) toast.success('Email verified successfully!');
  }, [data]);

  const handleResend = async () => {
    if (!email) return toast.error('Enter your email from the sign-in page to resend.');
    try {
      await resend({ email }).unwrap();
      toast.success('Verification email sent (check the server console in dev).');
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const State = ({ icon: Icon, color, title, text }) => (
    <div className="text-center">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ${color}`}
      >
        <Icon size={30} />
      </motion.span>
      <h3 className="text-lg font-bold text-ink-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{text}</p>
    </div>
  );

  return (
    <AuthLayout title="Email verification" subtitle="Confirming your email address.">
      {!token ? (
        <>
          <State
            icon={FiMail}
            color="bg-brand-500/10 text-brand-500"
            title="Check your inbox"
            text={email ? `We sent a verification link to ${email}.` : 'We sent you a verification link.'}
          />
          <p className="mt-4 text-center text-xs text-ink-400">
            In development the email is printed to the server terminal.
          </p>
        </>
      ) : isLoading ? (
        <div className="grid place-items-center py-8">
          <Spinner size={40} />
        </div>
      ) : isError ? (
        <>
          <State
            icon={FiXCircle}
            color="bg-red-500/10 text-red-500"
            title="Verification failed"
            text={extractError(error, 'The link may be invalid or expired.')}
          />
        </>
      ) : (
        <State
          icon={FiCheckCircle}
          color="bg-emerald-500/10 text-emerald-500"
          title="Email verified"
          text="Your email is confirmed. You can now sign in."
        />
      )}

      <div className="mt-6 flex flex-col gap-3">
        {!token && (
          <Button variant="secondary" loading={resending} onClick={handleResend} className="w-full">
            Resend verification email
          </Button>
        )}
        <Link to="/login">
          <Button className="w-full">Go to sign in</Button>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;

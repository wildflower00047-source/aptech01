import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiArrowLeft, FiHome } from 'react-icons/fi';
import { Button } from '../components/ui/Button.jsx';

export const Unauthorized = () => (
  <div className="mx-auto grid max-w-lg place-items-center px-4 py-24 text-center">
    <motion.span
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      className="grid h-20 w-20 place-items-center rounded-3xl bg-amber-500/10 text-amber-500"
    >
      <FiLock size={38} />
    </motion.span>
    <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Access denied</h1>
    <p className="mt-3 text-ink-500 dark:text-ink-400">
      You don&apos;t have the required role or permission to view this page. If you believe this is a mistake, contact an
      administrator.
    </p>
    <div className="mt-8 flex gap-3">
      <Link to="/dashboard">
        <Button><FiArrowLeft /> Back to dashboard</Button>
      </Link>
      <Link to="/">
        <Button variant="secondary"><FiHome /> Home</Button>
      </Link>
    </div>
  </div>
);

export default Unauthorized;

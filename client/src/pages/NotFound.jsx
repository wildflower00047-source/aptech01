import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCompass, FiArrowLeft, FiHome } from 'react-icons/fi';
import { Button } from '../components/ui/Button.jsx';

export const NotFound = () => (
  <div className="mx-auto grid max-w-lg place-items-center px-4 py-24 text-center">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-7xl font-black gradient-text">404</p>
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="mt-4 inline-grid h-16 w-16 place-items-center rounded-2xl bg-brand-500/10 text-brand-500"
      >
        <FiCompass size={30} />
      </motion.span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Page not found</h1>
      <p className="mt-3 text-ink-500 dark:text-ink-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/dashboard">
          <Button><FiArrowLeft /> Go back</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary"><FiHome /> Home</Button>
        </Link>
      </div>
    </motion.div>
  </div>
);

export default NotFound;

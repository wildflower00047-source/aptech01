import { motion } from 'framer-motion';
import { FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export const Logo = ({ to = '/', compact = false }) => (
  <Link to={to} className="flex items-center gap-2.5">
    <motion.span
      whileHover={{ rotate: 8, scale: 1.05 }}
      className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-lg shadow-brand-500/30"
    >
      <FiShield size={19} />
    </motion.span>
    {!compact && (
      <span className="text-lg font-extrabold tracking-tight text-ink-900 dark:text-white">
        Auth<span className="gradient-text">Sec</span>
      </span>
    )}
  </Link>
);

export default Logo;

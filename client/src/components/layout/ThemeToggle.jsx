import { FiMoon, FiSun } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme.js';

export const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`relative grid h-9 w-9 place-items-center rounded-xl border border-ink-200 bg-white text-ink-600 transition hover:text-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300 ${className || ''}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <motion.span key={isDark ? 'moon' : 'sun'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
        {isDark ? <FiMoon size={17} /> : <FiSun size={17} />}
      </motion.span>
    </button>
  );
};

export default ThemeToggle;

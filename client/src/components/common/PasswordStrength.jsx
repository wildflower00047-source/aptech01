import { motion } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';
import { passwordStrength, cn } from '../../lib/utils.js';

const RULES = [
  { key: 'length', label: '8+ characters' },
  { key: 'lower', label: 'Lowercase letter' },
  { key: 'upper', label: 'Uppercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'special', label: 'Special character' },
];

export const PasswordStrength = ({ password = '' }) => {
  const { checks, score, label, color } = passwordStrength(password);

  return (
    <div className="mt-3 space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-ink-500 dark:text-ink-400">Password strength</span>
          <span className={cn('font-semibold', score >= 4 ? 'text-emerald-500' : score >= 2 ? 'text-amber-500' : 'text-red-500')}>
            {password ? label : '—'}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
          <motion.div
            className={cn('h-full rounded-full', color)}
            initial={false}
            animate={{ width: `${(score / 5) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          />
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-1.5">
        {RULES.map((rule) => {
          const ok = checks[rule.key];
          return (
            <li
              key={rule.key}
              className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-emerald-500' : 'text-ink-400')}
            >
              {ok ? <FiCheck size={13} /> : <FiX size={13} />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;

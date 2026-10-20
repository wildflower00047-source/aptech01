import { motion } from 'framer-motion';
import { cn } from '../../lib/utils.js';

export const StatCard = ({ label, value, icon: Icon, accent = 'brand', hint, delay = 0 }) => {
  const accents = {
    brand: 'from-brand-500 to-violet-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    sky: 'from-sky-500 to-cyan-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card relative overflow-hidden p-5"
    >
      <div className={cn('absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl', accents[accent])} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</span>
        {Icon && (
          <span className={cn('grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white', accents[accent])}>
            <Icon size={17} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </motion.div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="grid place-items-center rounded-2xl border border-dashed border-ink-300/70 p-10 text-center dark:border-white/10">
    {Icon && (
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-white/5">
        <Icon size={22} />
      </span>
    )}
    <h4 className="font-semibold text-ink-800 dark:text-ink-100">{title}</h4>
    {description && <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default StatCard;

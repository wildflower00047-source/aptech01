import { cn } from '../../lib/utils.js';

export const Card = ({ children, className, ...props }) => (
  <div className={cn('card p-6', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, icon: Icon }) => (
  <div className="mb-5 flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      {Icon && (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
          <Icon size={20} />
        </span>
      )}
      <div>
        <h3 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export default Card;

import { cn } from '../../lib/utils.js';

export const Badge = ({ children, className, dot = false, ...props }) => (
  <span className={cn('badge', className)} {...props}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

export const Avatar = ({ name = '', src, size = 'md', className }) => {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' };
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-white/70 dark:ring-white/10', sizes[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'grid place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-bold text-white',
        sizes[size],
        className,
      )}
    >
      {initials || '?'}
    </span>
  );
};

export const Spinner = ({ size = 20, className }) => (
  <span
    style={{ width: size, height: size }}
    className={cn('inline-block animate-spin rounded-full border-2 border-brand-500 border-t-transparent', className)}
  />
);

export default Badge;

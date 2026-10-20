import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const Spinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
);

export const Button = forwardRef(function Button(
  { children, variant = 'primary', loading = false, className, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(variants[variant] || variants.primary, className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export default Button;

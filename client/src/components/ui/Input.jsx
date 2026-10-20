import { forwardRef, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { cn } from '../../lib/utils.js';

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, type = 'text', className, containerClassName, hint, ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && show ? 'text' : type;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            <Icon size={17} />
          </span>
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'input',
            Icon && 'pl-10',
            isPassword && 'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-brand-500"
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <FiEyeOff size={17} /> : <FiEye size={17} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      )}
    </div>
  );
});

export default Input;

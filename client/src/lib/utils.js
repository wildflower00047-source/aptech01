import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (value, options = {}) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(value));
};

export const formatRelative = (value) => {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value, { timeStyle: undefined });
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const passwordStrength = (password = '') => {
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-500'];
  return { checks, score, label: labels[score], color: colors[score] };
};

export const roleBadge = (role) =>
  ({
    admin: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
    moderator: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    user: 'bg-brand-500/15 text-brand-600 dark:text-brand-400',
  })[role] || 'bg-ink-500/15 text-ink-500';

export const statusBadge = ({ isBanned, isActive }) => {
  if (isBanned) return { label: 'Banned', className: 'bg-red-500/15 text-red-600 dark:text-red-400' };
  if (!isActive) return { label: 'Inactive', className: 'bg-ink-500/15 text-ink-500' };
  return { label: 'Active', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
};

export const extractError = (error, fallback = 'Something went wrong') => {
  // RTK Query throws the value returned by the baseQuery ({ status, data }),
  // while plain axios errors carry `response.data`. Support both.
  const data = error?.response?.data ?? error?.data;
  if (Array.isArray(data) && data.length) {
    return data.map((e) => e.message || e).join(', ');
  }
  if (data?.errors?.length) return data.errors.map((e) => e.message).join(', ');
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.message) return data.message;
  if (typeof error?.error === 'string' && error.error) return error.error;
  if (error?.status === 'FETCH_ERROR') return 'Cannot reach the API. Is the server running on port 5000?';
  if (error?.status === 'PARSING_ERROR') return 'The API returned an unexpected response.';
  return error?.message || fallback;
};

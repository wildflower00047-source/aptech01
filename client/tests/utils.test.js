import { describe, it, expect } from 'vitest';
import {
  cn,
  getInitials,
  passwordStrength,
  roleBadge,
  statusBadge,
  extractError,
  formatRelative,
} from '../src/lib/utils.js';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    const isHidden = false;
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', isHidden && 'hidden', 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('getInitials', () => {
  it('returns up to two uppercase initials', () => {
    expect(getInitials('Jane Doe')).toBe('JD');
    expect(getInitials('Cher')).toBe('C');
    expect(getInitials('Ada Lovelace King')).toBe('AL');
    expect(getInitials('')).toBe('');
  });
});

describe('passwordStrength', () => {
  it('marks a strong password as excellent', () => {
    const result = passwordStrength('Str0ng@Pass');
    expect(result.score).toBe(5);
    expect(result.label).toBe('Excellent');
    expect(result.checks).toEqual({ length: true, lower: true, upper: true, number: true, special: true });
  });

  it('scores an empty password at zero', () => {
    const result = passwordStrength('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('Very weak');
  });

  it('detects missing character classes', () => {
    const result = passwordStrength('alllowercase');
    expect(result.checks.upper).toBe(false);
    expect(result.checks.number).toBe(false);
    expect(result.checks.special).toBe(false);
  });
});

describe('badges', () => {
  it('maps each role to a class string', () => {
    for (const role of ['admin', 'moderator', 'user', 'unknown']) {
      expect(typeof roleBadge(role)).toBe('string');
    }
  });

  it('derives account status badges', () => {
    expect(statusBadge({ isBanned: true, isActive: true }).label).toBe('Banned');
    expect(statusBadge({ isBanned: false, isActive: false }).label).toBe('Inactive');
    expect(statusBadge({ isBanned: false, isActive: true }).label).toBe('Active');
  });
});

describe('formatRelative', () => {
  it('formats recent timestamps', () => {
    expect(formatRelative(new Date())).toBe('just now');
    expect(formatRelative(new Date(Date.now() - 5 * 60 * 1000))).toBe('5m ago');
    expect(formatRelative(null)).toBe('—');
  });
});

describe('extractError', () => {
  it('prefers API error envelopes', () => {
    expect(extractError({ data: { message: 'Nope' } })).toBe('Nope');
    expect(extractError({ data: { errors: [{ message: 'a' }, { message: 'b' }] } })).toBe('a, b');
    expect(extractError({ status: 'FETCH_ERROR' })).toMatch(/Cannot reach the API/);
  });

  it('falls back to a default message', () => {
    expect(extractError({}, 'fallback')).toBe('fallback');
  });
});

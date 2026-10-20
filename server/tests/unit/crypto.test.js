import { describe, it, expect } from 'vitest';
import { generateRandomToken, hashToken, timingSafeEqual } from '../../src/utils/crypto.js';

describe('crypto utils', () => {
  it('generates a hex token of the requested byte length', () => {
    const token = generateRandomToken(16);
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token).toHaveLength(32);
  });

  it('generates unique tokens', () => {
    expect(generateRandomToken()).not.toBe(generateRandomToken());
  });

  it('hashes deterministically to a 64-char sha256 hex digest', () => {
    const a = hashToken('secret');
    const b = hashToken('secret');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(hashToken('secret2'));
  });

  it('compares strings of equal length safely', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
  });

  it('returns false when lengths differ (never throws)', () => {
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('', 'x')).toBe(false);
  });
});

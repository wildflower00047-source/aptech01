import { describe, it, expect } from 'vitest';
import { computeSecurity, TASKS } from '../../src/services/securityScore.service.js';

const fullUser = {
  isEmailVerified: true,
  twoFactorEnabled: true,
  loginAlertsEnabled: true,
  passwordChangedAt: new Date(),
  recoveryCodesCreatedAt: new Date(),
  completedTasks: ['review_sessions'],
};

const fullCtx = { passkeyCount: 1, sessionsCount: 1, recentFailedLogins: 0 };

describe('security score service', () => {
  it('awards a perfect score to a fully hardened account', () => {
    const result = computeSecurity(fullUser, fullCtx);
    expect(result.score).toBe(100);
    expect(result.grade).toBe('A+');
    expect(result.completedCount).toBe(TASKS.length);
    expect(result.nextTask).toBeNull();
    expect(result.badges).toContain('completionist');
    expect(result.badges).toContain('impenetrable');
  });

  it('lowers the score when 2FA is disabled', () => {
    const withTwoFa = computeSecurity(fullUser, fullCtx).score;
    const withoutTwoFa = computeSecurity({ ...fullUser, twoFactorEnabled: false }, fullCtx).score;
    expect(withoutTwoFa).toBeLessThan(withTwoFa);
  });

  it('flags a stale password via the rotate_password task', () => {
    const old = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const result = computeSecurity({ ...fullUser, passwordChangedAt: old }, fullCtx);
    const task = result.tasks.find((t) => t.key === 'rotate_password');
    expect(task.done).toBe(false);
  });

  it('treats a fresh account with limited context as an incomplete grade', () => {
    const result = computeSecurity({ completedTasks: [] }, { passkeyCount: 0, sessionsCount: 0, recentFailedLogins: 0 });
    expect(result.score).toBeLessThan(100);
    expect(result.grade).not.toBe('A+');
    expect(result.tasks.every((t) => 'done' in t && 'key' in t)).toBe(true);
    expect(result.nextTask).not.toBeNull();
  });

  it('returns level metadata derived from XP', () => {
    const result = computeSecurity(fullUser, fullCtx);
    expect(result.level).toBeGreaterThanOrEqual(1);
    expect(typeof result.levelTitle).toBe('string');
    expect(result.xpProgressPercent).toBeGreaterThanOrEqual(0);
    expect(result.xpProgressPercent).toBeLessThanOrEqual(100);
  });

  it('regression: recent failures break the clean_record task', () => {
    const result = computeSecurity(fullUser, { ...fullCtx, recentFailedLogins: 3 });
    expect(result.tasks.find((t) => t.key === 'clean_record').done).toBe(false);
  });
});

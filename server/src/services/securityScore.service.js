// Security posture scoring + gamified "security quests", levels and badges.
// Everything is derived from real account state so the score always reflects
// the truth (enable 2FA -> score goes up; disable it -> score drops).

export const TASKS = [
  {
    key: 'verify_email',
    title: 'Verify your email',
    description: 'Confirm ownership of your email address.',
    xp: 80,
    score: 12,
    badge: 'verified',
    icon: 'mail',
    to: '/profile',
  },
  {
    key: 'enable_2fa',
    title: 'Enable two-factor authentication',
    description: 'Add a TOTP authenticator app as a second factor.',
    xp: 150,
    score: 22,
    badge: 'fortified',
    icon: 'smartphone',
    to: '/security',
  },
  {
    key: 'add_passkey',
    title: 'Add a passkey',
    description: 'Go passwordless with a WebAuthn passkey or security key.',
    xp: 180,
    score: 14,
    badge: 'passwordless',
    icon: 'key',
    to: '/security',
  },
  {
    key: 'enable_login_alerts',
    title: 'Turn on login alerts',
    description: 'Get an email whenever a new sign-in happens.',
    xp: 60,
    score: 8,
    badge: 'watchful',
    icon: 'bell',
    to: '/security',
  },
  {
    key: 'rotate_password',
    title: 'Keep a fresh password',
    description: 'Rotate your password at least every 180 days.',
    xp: 100,
    score: 12,
    badge: 'fresh',
    icon: 'lock',
    to: '/security',
  },
  {
    key: 'save_recovery_codes',
    title: 'Save your recovery codes',
    description: 'Store your 2FA recovery codes somewhere safe.',
    xp: 40,
    score: 6,
    badge: 'backup',
    icon: 'copy',
    to: '/security',
    claimable: true,
  },
  {
    key: 'review_sessions',
    title: 'Review active sessions',
    description: 'Check your devices and revoke anything unfamiliar.',
    xp: 50,
    score: 6,
    badge: 'sentinel',
    icon: 'monitor',
    to: '/security',
    claimable: true,
  },
  {
    key: 'clean_record',
    title: 'No recent failed logins',
    description: 'Stay free of failed sign-in attempts.',
    xp: 70,
    score: 20,
    badge: 'clean',
    icon: 'shield',
    to: '/security',
  },
];

export const BADGES = Object.freeze({
  verified: { label: 'Verified', emoji: '✅', color: 'emerald' },
  fortified: { label: 'Fortified', emoji: '🛡️', color: 'brand' },
  passwordless: { label: 'Passwordless', emoji: '🔑', color: 'violet' },
  watchful: { label: 'Watchful', emoji: '👁️', color: 'amber' },
  fresh: { label: 'Fresh Credentials', emoji: '🔄', color: 'sky' },
  backup: { label: 'Backed Up', emoji: '💾', color: 'rose' },
  sentinel: { label: 'Sentinel', emoji: '📡', color: 'brand' },
  clean: { label: 'Clean Record', emoji: '🧼', color: 'emerald' },
  impenetrable: { label: 'Impenetrable', emoji: '🏰', color: 'violet' },
  veteran: { label: 'Veteran', emoji: '🎖️', color: 'amber' },
  completionist: { label: 'Completionist', emoji: '👑', color: 'rose' },
});

const DAY = 24 * 60 * 60 * 1000;

const isDone = (task, user, ctx) => {
  switch (task.key) {
    case 'verify_email':
      return Boolean(user.isEmailVerified);
    case 'enable_2fa':
      return Boolean(user.twoFactorEnabled);
    case 'add_passkey':
      return (ctx.passkeyCount || 0) > 0;
    case 'enable_login_alerts':
      return user.loginAlertsEnabled !== false;
    case 'rotate_password':
      return !user.passwordChangedAt || Date.now() - new Date(user.passwordChangedAt).getTime() < 180 * DAY;
    case 'save_recovery_codes':
      return Boolean(user.recoveryCodesCreatedAt) || (user.completedTasks || []).includes('save_recovery_codes');
    case 'review_sessions':
      return (user.completedTasks || []).includes('review_sessions') || (ctx.sessionsCount || 0) <= 1;
    case 'clean_record':
      return (ctx.recentFailedLogins || 0) === 0;
    default:
      return false;
  }
};

const gradeFor = (score) => {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  if (score >= 30) return 'E';
  return 'F';
};

const levelFor = (xp) => {
  let level = 1;
  let remaining = xp;
  let need = 120;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.35);
  }
  return { level, xpIntoLevel: remaining, xpForNext: need };
};

const levelTitle = (level) => {
  const titles = ['Rookie', 'Apprentice', 'Guardian', 'Sentinel', 'Warden', 'Cipher', 'Paladin', 'Archon', 'Overwatch', 'Legend'];
  return titles[Math.min(level - 1, titles.length - 1)] || 'Legend';
};

export const computeSecurity = (user, ctx = {}) => {
  const tasks = TASKS.map((task) => {
    const done = isDone(task, user, ctx);
    return {
      key: task.key,
      title: task.title,
      description: task.description,
      xp: task.xp,
      score: task.score,
      badge: task.badge,
      icon: task.icon,
      to: task.to,
      claimable: Boolean(task.claimable),
      done,
      claimed: (user.completedTasks || []).includes(task.key),
    };
  });

  const score = tasks.reduce((sum, t) => (t.done ? sum + t.score : sum), 0);
  const xp = tasks.reduce((sum, t) => (t.done ? sum + t.xp : sum), 0);
  const { level, xpIntoLevel, xpForNext } = levelFor(xp);

  const earned = tasks.filter((t) => t.done).map((t) => t.badge);
  if (score >= 95) earned.push('impenetrable');
  if (level >= 5) earned.push('veteran');
  if (tasks.every((t) => t.done)) earned.push('completionist');
  const badges = [...new Set(earned)];

  const nextTask = tasks.find((t) => !t.done) || null;

  return {
    score,
    grade: gradeFor(score),
    maxScore: 100,
    xp,
    level,
    levelTitle: levelTitle(level),
    xpIntoLevel,
    xpForNext,
    xpProgressPercent: Math.round((xpIntoLevel / xpForNext) * 100),
    tasks,
    completedCount: tasks.filter((t) => t.done).length,
    totalCount: tasks.length,
    badges,
    earnedBadges: badges.map((key) => ({ key, ...(BADGES[key] || { label: key, emoji: '🏅', color: 'brand' }) })),
    nextTask,
  };
};

export default { computeSecurity, TASKS, BADGES };

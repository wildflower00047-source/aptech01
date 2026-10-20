import env from '../config/env.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Session from '../models/Session.js';
import { ROLES } from '../utils/roles.js';
import logger from '../utils/logger.js';

const demoUsers = () => [
  {
    name: env.seedAdmin.name,
    email: env.seedAdmin.email,
    password: env.seedAdmin.password,
    role: ROLES.ADMIN,
    isEmailVerified: true,
    bio: 'Platform administrator.',
  },
  {
    name: 'Mia Moderator',
    email: 'moderator@authsec.dev',
    password: 'Moderator@123',
    role: ROLES.MODERATOR,
    isEmailVerified: true,
    bio: 'Keeps the community safe.',
  },
  {
    name: 'Sam User',
    email: 'user@authsec.dev',
    password: 'User@12345',
    role: ROLES.USER,
    isEmailVerified: true,
    bio: 'Just a regular member.',
  },
];

// Seeds the database. When `force` is false it only seeds if there are no users,
// which is what the one-command `npm run dev` bootstrap uses.
export const seedDatabase = async ({ force = true } = {}) => {
  if (force) {
    await Promise.all([AuditLog.deleteMany({}), Session.deleteMany({}), User.deleteMany({})]);
    logger.warn('Cleared users, sessions and audit logs.');
  } else {
    const existing = await User.estimatedDocumentCount();
    if (existing > 0) {
      logger.info(`Seed skipped: ${existing} user(s) already exist.`);
      return { skipped: true, count: existing };
    }
  }

  const users = await User.create(demoUsers());
  logger.success(`Seeded ${users.length} users:`);
  users.forEach((u) => logger.info(`  - ${u.role.padEnd(9)} ${u.email}`));
  logger.info(`Login with admin: ${env.seedAdmin.email} / ${env.seedAdmin.password}`);
  return { skipped: false, count: users.length };
};

export default seedDatabase;

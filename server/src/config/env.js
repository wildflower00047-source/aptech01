import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGO_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV === 'production') {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_auth',

  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:5000',

  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_change_me_please_000',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_change_me_please_000',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookieSecure: toBool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 12),
  maxLoginAttempts: toInt(process.env.MAX_LOGIN_ATTEMPTS, 5),
  lockTimeMs: toInt(process.env.LOCK_TIME_MINUTES, 15) * 60 * 1000,

  email: {
    host: process.env.EMAIL_HOST || '',
    port: toInt(process.env.EMAIL_PORT, 587),
    secure: toBool(process.env.EMAIL_SECURE, false),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'AuthSec <no-reply@authsec.dev>',
  },

  twoFaIssuer: process.env.TWO_FA_ISSUER || 'AuthSec',

  // WebAuthn / passkeys
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'AuthSec',
    rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
  },

  // Optional comma-separated IP allowlist for admin accounts (empty = disabled).
  adminIpAllowlist: (process.env.ADMIN_IP_ALLOWLIST || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean),

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'Super Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@authsec.dev',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
};

export default env;

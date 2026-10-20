import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Environment must be configured BEFORE the app (and its env config) is loaded.
// ---------------------------------------------------------------------------
const TEST_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/authsec_test';
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = TEST_URI;
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'test_access_secret_test_access_secret_00000000';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_test_refresh_secret_000000';

// Try to reach a MongoDB instance. When unreachable the whole suite is skipped
// so `npm test` never fails on machines/CI without a database.
let mongoAvailable = false;
try {
  await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 1500 });
  mongoAvailable = true;
} catch {
  mongoAvailable = false;
}

const request = (await import('supertest')).default;
const { default: app } = await import('../../src/app.js');
const { default: User } = await import('../../src/models/User.js');
const { default: Session } = await import('../../src/models/Session.js');
const { default: AuditLog } = await import('../../src/models/AuditLog.js');

const resetDb = () => Promise.all([User.deleteMany({}), Session.deleteMany({}), AuditLog.deleteMany({})]);

// Issues (via /api/health) and returns the double-submit CSRF token the agent holds.
const csrfToken = async (agent) => {
  const res = await agent.get('/api/health');
  const cookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('csrfToken='));
  return cookie ? cookie.split(';')[0].slice('csrfToken='.length) : '';
};

describe.skipIf(!mongoAvailable)('AuthSec API (integration)', () => {
  beforeAll(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await resetDb();
    await User.create([
      { name: 'Admin', email: 'admin@test.dev', password: 'Admin@12345', role: 'admin', isEmailVerified: true },
      { name: 'User', email: 'user@test.dev', password: 'User@12345', role: 'user', isEmailVerified: true },
    ]);
  });

  describe('health', () => {
    it('reports a healthy API and database', async () => {
      const res = await request(app).get('/api/health').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.db).toBe('connected');
    });

    it('exposes the RBAC matrix', async () => {
      const res = await request(app).get('/api/meta/rbac').expect(200);
      expect(res.body.data.roles).toMatchObject({ ADMIN: 'admin', USER: 'user' });
      expect(res.body.data.matrix).toHaveProperty('user');
    });

    it('serves the OpenAPI description', async () => {
      const res = await request(app).get('/api/docs/openapi.json').expect(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.paths).toHaveProperty('/auth/login');
    });
  });

  describe('registration & login', () => {
    it('registers a new user with 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New Person', email: 'new@test.dev', password: 'Newpass@123' })
        .expect(201);
      expect(res.body.data.user.email).toBe('new@test.dev');
      expect(res.body.data.user.isEmailVerified).toBe(false);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('rejects a weak password with 400', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Weak', email: 'weak@test.dev', password: 'short' })
        .expect(400);
    });

    it('logs in and sets auth cookies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.dev', password: 'User@12345' })
        .expect(200);
      expect(res.body.data.user.email).toBe('user@test.dev');
      const cookies = res.headers['set-cookie'] || [];
      expect(cookies.join(';')).toContain('accessToken=');
      expect(cookies.join(';')).toContain('refreshToken=');
    });

    it('rejects bad credentials with 401', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.dev', password: 'WrongPass@123' })
        .expect(401);
    });

    it('refreshes tokens and rotates the session', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: 'user@test.dev', password: 'User@12345' }).expect(200);
      const res = await agent.post('/api/auth/refresh').expect(200);
      expect(res.body.data.accessToken).toBeTruthy();
      // The refreshed access token must still be usable and carry the right user.
      const me = await agent.get('/api/auth/me').set('Authorization', `Bearer ${res.body.data.accessToken}`).expect(200);
      expect(me.body.data.user.email).toBe('user@test.dev');
    });
  });

  describe('authentication & authorization', () => {
    it('rejects unauthenticated access to /auth/me', async () => {
      await request(app).get('/api/auth/me').expect(401);
    });

    it('lets an admin reach admin routes', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: 'admin@test.dev', password: 'Admin@12345' }).expect(200);
      const res = await agent.get('/api/admin/stats').expect(200);
      expect(res.body.data.stats.total).toBeGreaterThanOrEqual(2);
    });

    it('forbids a regular user from admin routes (403)', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/login').send({ email: 'user@test.dev', password: 'User@12345' }).expect(200);
      await agent.get('/api/admin/stats').expect(403);
      await agent.get('/api/admin/users').expect(403);
    });

    it('prevents self role changes', async () => {
      const agent = request.agent(app);
      const token = await csrfToken(agent);
      const login = await agent
        .post('/api/auth/login')
        .send({ email: 'admin@test.dev', password: 'Admin@12345' })
        .expect(200);
      await agent
        .patch(`/api/admin/users/${login.body.data.user.id}/role`)
        .set('X-CSRF-Token', token)
        .send({ role: 'user' })
        .expect(400);
    });
  });

  describe('system settings', () => {
    it('blocks traffic with 503 while maintenance mode is enabled', async () => {
      const agent = request.agent(app);
      const token = await csrfToken(agent);
      await agent.post('/api/auth/login').send({ email: 'admin@test.dev', password: 'Admin@12345' }).expect(200);
      await agent
        .patch('/api/admin/settings')
        .set('X-CSRF-Token', token)
        .send({ maintenanceMode: true })
        .expect(200);

      await request(app).get('/api/admin/users').expect(503);
      // Health must stay reachable during maintenance.
      await request(app).get('/api/health').expect(200);

      await agent
        .patch('/api/admin/settings')
        .set('X-CSRF-Token', token)
        .send({ maintenanceMode: false })
        .expect(200);
      await request(app).get('/api/admin/users').expect(401);
    });
  });
});

describe.skipIf(mongoAvailable)('AuthSec API (integration) — skipped', () => {
  it('requires a reachable MongoDB (set MONGO_URI_TEST or run one locally)', () => {
    expect(mongoAvailable).toBe(false);
  });
});

// OpenAPI 3.0 description of the AuthSec API. Served at GET /api/docs/openapi.json
// and rendered by the lightweight Swagger UI at GET /api/docs.
const bearer = [{ bearerAuth: [] }, { cookieAuth: [] }];

const successEnvelope = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    data: { type: 'object' },
  },
};

const errorEnvelope = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    code: { type: 'string' },
    errors: {
      type: 'array',
      items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } },
    },
  },
};

const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const ok = (description = 'Success') => ({
  description,
  content: { 'application/json': { schema: successEnvelope } },
});
const err = (description) => ({
  description,
  content: { 'application/json': { schema: errorEnvelope } },
});
const authErrors = {
  401: err('Authentication required or token invalid/expired'),
  403: err('Insufficient role or permission'),
  429: err('Rate limit exceeded'),
};

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'AuthSec API',
    version: '1.0.0',
    description:
      'Hyper-modern MERN authentication & authorization API. JWT access tokens (15m) are ' +
      'delivered as httpOnly cookies with rotate-on-use refresh tokens (7d), email verification, ' +
      'password reset, TOTP 2FA, WebAuthn passkeys, device/session management, audit logging and ' +
      'a fully editable role/permission (RBAC) layer.',
    license: { name: 'MIT' },
  },
  servers: [{ url: '/api', description: 'Same origin' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, tokens, email, password and 2FA' },
    { name: 'Passkeys', description: 'WebAuthn passwordless sign-in and management' },
    { name: 'Users', description: 'Current user profile' },
    { name: 'Security', description: 'Security score, quests and login alerts' },
    { name: 'Admin', description: 'User administration, audit, threat feed, RBAC and settings' },
    { name: 'Meta', description: 'Health and RBAC metadata' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'moderator', 'admin'] },
          avatar: { type: 'string' },
          bio: { type: 'string' },
          isEmailVerified: { type: 'boolean' },
          twoFactorEnabled: { type: 'boolean' },
          isActive: { type: 'boolean' },
          isBanned: { type: 'boolean' },
          permissions: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Register: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 60 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      Login: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          totp: { type: 'string', minLength: 6, maxLength: 6 },
          recoveryCode: { type: 'string' },
        },
      },
    },
  },
  security: bearer,
  paths: {
    '/health': {
      get: {
        tags: ['Meta'],
        summary: 'Liveness / readiness probe',
        security: [],
        responses: { 200: ok('API and database are healthy'), 503: err('Database unavailable') },
      },
    },
    '/meta/rbac': {
      get: {
        tags: ['Meta'],
        summary: 'RBAC roles, permission labels and the effective matrix',
        security: [],
        responses: { 200: ok() },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account (sends a verification email)',
        security: [],
        requestBody: jsonBody({ $ref: '#/components/schemas/Register' }),
        responses: { 201: ok('Registered'), 409: err('Email already registered'), 429: authErrors[429] },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive httpOnly access + refresh cookies',
        security: [],
        requestBody: jsonBody({ $ref: '#/components/schemas/Login' }),
        responses: {
          200: ok('Logged in (or `twoFactorRequired: true`)'),
          401: err('Invalid credentials'),
          423: err('Account locked'),
          ...authErrors,
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate the refresh token and issue a new access token',
        security: [],
        responses: { 200: ok('Token refreshed'), 401: authErrors[401] },
      },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Revoke the current session', security: [], responses: { 200: ok() } },
    },
    '/auth/logout-all': {
      post: { tags: ['Auth'], summary: 'Revoke all sessions', responses: { 200: ok(), 401: authErrors[401] } },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user + permissions', responses: { 200: ok(), 401: authErrors[401] } },
    },
    '/auth/verify-email': {
      get: {
        tags: ['Auth'],
        summary: 'Verify an email address with a token',
        security: [],
        parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(), 400: err('Invalid or expired token') },
      },
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Resend the verification email',
        security: [],
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
        responses: { 200: ok(), 429: authErrors[429] },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Email a password reset link',
        security: [],
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
        responses: { 200: ok(), 429: authErrors[429] },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Set a new password using a reset token',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          required: ['token', 'password'],
          properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } },
        }),
        responses: { 200: ok(), 400: err('Invalid/expired token or password reused') },
      },
    },
    '/auth/change-password': {
      patch: {
        tags: ['Auth'],
        summary: 'Change the current password (revokes all sessions)',
        requestBody: jsonBody({
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } },
        }),
        responses: { 200: ok(), 400: err('Current password incorrect'), 401: authErrors[401] },
      },
    },
    '/auth/2fa/setup': {
      post: { tags: ['Auth'], summary: 'Generate a TOTP secret + QR code', responses: { 200: ok(), 401: authErrors[401] } },
    },
    '/auth/2fa/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Enable 2FA and return recovery codes',
        requestBody: jsonBody({ type: 'object', required: ['totp'], properties: { totp: { type: 'string', minLength: 6, maxLength: 6 } } }),
        responses: { 200: ok(), 400: err('Invalid code'), 401: authErrors[401] },
      },
    },
    '/auth/2fa/disable': {
      post: {
        tags: ['Auth'],
        summary: 'Disable 2FA (requires password)',
        requestBody: jsonBody({ type: 'object', required: ['password'], properties: { password: { type: 'string' } } }),
        responses: { 200: ok(), 400: err('Password incorrect'), 401: authErrors[401] },
      },
    },
    '/auth/sessions': {
      get: { tags: ['Auth'], summary: 'List active device sessions', responses: { 200: ok(), 401: authErrors[401] } },
    },
    '/auth/sessions/{id}': {
      delete: {
        tags: ['Auth'],
        summary: 'Revoke one session',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(), 401: authErrors[401], 404: err('Session not found') },
      },
    },
    '/auth/passkeys': {
      get: { tags: ['Passkeys'], summary: 'List registered passkeys', responses: { 200: ok(), 401: authErrors[401] } },
    },
    '/auth/passkeys/register/options': {
      post: { tags: ['Passkeys'], summary: 'Begin passkey registration', responses: { 200: ok(), 401: authErrors[401] } },
    },
    '/auth/passkeys/register/verify': {
      post: {
        tags: ['Passkeys'],
        summary: 'Complete passkey registration',
        requestBody: jsonBody({ type: 'object', required: ['response'], properties: { response: { type: 'object' }, name: { type: 'string' } } }),
        responses: { 201: ok(), 400: err('Verification failed'), 401: authErrors[401] },
      },
    },
    '/auth/passkeys/{id}': {
      delete: {
        tags: ['Passkeys'],
        summary: 'Delete a passkey',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(), 401: authErrors[401], 404: err('Passkey not found') },
      },
    },
    '/auth/passkey/login/options': {
      post: {
        tags: ['Passkeys'],
        summary: 'Begin passwordless sign-in',
        security: [],
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } }),
        responses: { 200: ok(), 429: authErrors[429] },
      },
    },
    '/auth/passkey/login/verify': {
      post: {
        tags: ['Passkeys'],
        summary: 'Complete passwordless sign-in',
        security: [],
        requestBody: jsonBody({ type: 'object', required: ['email', 'response'], properties: { email: { type: 'string' }, response: { type: 'object' } } }),
        responses: { 200: ok(), 401: authErrors[401], 429: authErrors[429] },
      },
    },
    '/users/profile': {
      get: { tags: ['Users'], summary: 'Get the current profile', responses: { 200: ok(), 401: authErrors[401] } },
      patch: {
        tags: ['Users'],
        summary: 'Update the current profile',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: { type: 'string' },
            bio: { type: 'string', maxLength: 280 },
            avatar: { type: 'string', format: 'uri' },
            preferences: { type: 'object' },
          },
        }),
        responses: { 200: ok(), 401: authErrors[401] },
      },
      delete: {
        tags: ['Users'],
        summary: 'Deactivate the current account (requires password)',
        requestBody: jsonBody({ type: 'object', required: ['password'], properties: { password: { type: 'string' } } }),
        responses: { 200: ok(), 400: err('Password incorrect'), 401: authErrors[401] },
      },
    },
    '/security': {
      get: { tags: ['Security'], summary: 'Security score, quests, level and badges', responses: { 200: ok(), 401: authErrors[401] } },
    },
    '/security/quests/{key}/claim': {
      post: {
        tags: ['Security'],
        summary: 'Claim a manual security quest',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(), 400: err('Quest not claimable'), 401: authErrors[401], 404: err('Quest not found') },
      },
    },
    '/security/login-alerts': {
      patch: {
        tags: ['Security'],
        summary: 'Toggle login-alert emails',
        requestBody: jsonBody({ type: 'object', required: ['enabled'], properties: { enabled: { type: 'boolean' } } }),
        responses: { 200: ok(), 401: authErrors[401] },
      },
    },
    '/security/recovery-codes/regenerate': {
      post: { tags: ['Security'], summary: 'Regenerate 2FA recovery codes', responses: { 200: ok(), 400: err('2FA not enabled'), 401: authErrors[401] } },
    },
    '/admin/stats': {
      get: { tags: ['Admin'], summary: 'Platform statistics', responses: { 200: ok(), ...authErrors } },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users (search / filter / sort / paginate)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['user', 'moderator', 'admin'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'banned', 'verified'] } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: { 200: ok(), ...authErrors },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create a user (admin)',
        requestBody: jsonBody({
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['user', 'moderator', 'admin'] },
          },
        }),
        responses: { 201: ok(), 409: err('Email already registered'), ...authErrors },
      },
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get one user + active session count',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(), 404: err('User not found'), ...authErrors },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(), 403: err('Cannot delete an admin'), 404: err('User not found'), ...authErrors },
      },
    },
    '/admin/users/{id}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Update a user role (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: jsonBody({ type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['user', 'moderator', 'admin'] } } }),
        responses: { 200: ok(), 400: err('You cannot change your own role'), ...authErrors },
      },
    },
    '/admin/users/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Activate / deactivate / ban a user (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: jsonBody({
          type: 'object',
          properties: { isActive: { type: 'boolean' }, isBanned: { type: 'boolean' }, bannedReason: { type: 'string' } },
        }),
        responses: { 200: ok(), 400: err('Invalid request'), ...authErrors },
      },
    },
    '/admin/audit-logs': {
      get: {
        tags: ['Admin'],
        summary: 'Paginated audit log',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: ok(), ...authErrors },
      },
    },
    '/admin/threats': {
      get: { tags: ['Admin'], summary: 'Threat feed (security events, risky sessions, failed IPs)', responses: { 200: ok(), ...authErrors } },
    },
    '/admin/rbac': {
      get: { tags: ['Admin'], summary: 'Full RBAC matrix, defaults and overrides', responses: { 200: ok(), ...authErrors } },
    },
    '/admin/rbac/{role}': {
      patch: {
        tags: ['Admin'],
        summary: 'Override a role permission set (admin)',
        parameters: [{ name: 'role', in: 'path', required: true, schema: { type: 'string', enum: ['user', 'moderator', 'admin'] } }],
        requestBody: jsonBody({ type: 'object', required: ['permissions'], properties: { permissions: { type: 'array', items: { type: 'string' } } } }),
        responses: { 200: ok(), ...authErrors },
      },
    },
    '/admin/rbac/{role}/reset': {
      post: {
        tags: ['Admin'],
        summary: 'Reset a role to its default permissions (admin)',
        parameters: [{ name: 'role', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: ok(), ...authErrors },
      },
    },
    '/admin/settings': {
      get: { tags: ['Admin'], summary: 'Read system settings (admin)', responses: { 200: ok(), ...authErrors } },
      patch: {
        tags: ['Admin'],
        summary: 'Update system settings (admin)',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            registrationOpen: { type: 'boolean' },
            requireEmailVerification: { type: 'boolean' },
            require2FAForAdmins: { type: 'boolean' },
            anomalyHighRiskRequires2FA: { type: 'boolean' },
            banAfterMaxAttempts: { type: 'boolean' },
            sessionIdleTimeoutMinutes: { type: 'integer', minimum: 0, maximum: 1440 },
            maintenanceMode: { type: 'boolean' },
            threatFeedSize: { type: 'integer', minimum: 5, maximum: 100 },
          },
        }),
        responses: { 200: ok(), ...authErrors },
      },
    },
  },
};

export default openapi;

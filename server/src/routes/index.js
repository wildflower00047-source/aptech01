import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import securityRoutes from './security.routes.js';
import docsRoutes from './docs.routes.js';
import { csrfProtection } from '../middleware/csrf.js';
import maintenanceMode from '../middleware/maintenance.js';
import { ROLES, PERMISSION_LABELS, getEffectiveMatrix } from '../utils/roles.js';

const router = Router();

// Deep health check: also reports the database connection state.
router.get('/health', (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';
  const healthy = mongoose.connection.readyState === 1;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'API is healthy' : 'API is running but the database is unavailable',
    db: dbState,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Expose the RBAC matrix so the frontend can render permissions dynamically.
router.get('/meta/rbac', (_req, res) => {
  res.json({
    success: true,
    data: { roles: ROLES, permissions: PERMISSION_LABELS, matrix: getEffectiveMatrix() },
  });
});

// Machine-readable API description + Swagger UI (no external dependencies).
router.use('/docs', docsRoutes);
router.get('/openapi.json', (_req, res) => res.redirect('/api/docs/openapi.json'));

// Block normal traffic while maintenance mode is enabled.
router.use(maintenanceMode);

// CSRF double-submit protection for state-changing requests (paths here are
// relative to the /api mount so exemptions match '/auth/login', etc.).
router.use(csrfProtection);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/security', securityRoutes);
router.use('/admin', adminRoutes);

export default router;

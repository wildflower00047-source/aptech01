import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

const deviceString = (req) => (req?.headers?.['user-agent'] || 'unknown').slice(0, 250);

export const record = async (req, { user, action, category = 'system', status = 'success', description, metadata } = {}) => {
  try {
    await AuditLog.create({
      user: user?._id || user || req?.user?._id || undefined,
      actorEmail: user?.email || req?.user?.email,
      action,
      category,
      status,
      description,
      ip: req?.ip || req?.socket?.remoteAddress,
      userAgent: deviceString(req),
      metadata: metadata || {},
    });
  } catch (error) {
    logger.warn(`Audit log failed: ${error.message}`);
  }
};

export default { record };

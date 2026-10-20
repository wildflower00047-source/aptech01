import app from './app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import settingsService from './services/settings.service.js';
import rbacService from './services/rbac.service.js';

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  process.exit(1);
});

const start = async () => {
  await connectDB();
  await Promise.all([settingsService.loadSettings(), rbacService.loadOverrides()]);

  const server = app.listen(env.port, () => {
    logger.success(`Server running in ${env.nodeEnv} mode on ${env.apiUrl}`);
    logger.info(`Health check: ${env.apiUrl}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `Port ${env.port} is already in use. Close the app using it (e.g. another MERN backend) ` +
          `or change PORT in server/.env and the proxy target in client/vite.config.js.`,
      );
    } else {
      logger.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  const shutdown = (signal) => {
    logger.warn(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

start();

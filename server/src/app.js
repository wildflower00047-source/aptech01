import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { issueCsrfToken } from './middleware/csrf.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/error.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: env.isProd ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: env.isProd,
    xFrameOptions: { action: 'deny' },
  }),
);
app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(issueCsrfToken);
app.use('/api', globalLimiter);

if (!env.isProd) {
  app.use(morgan('dev'));
}

app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'AuthSec API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;

import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const handleCastError = (err) => ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return ApiError.conflict(`${field} already in use`);
};
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  return ApiError.badRequest('Validation failed', errors);
};
const handleJWT = () => ApiError.unauthorized('Invalid or expired token');

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err.name === 'CastError') error = handleCastError(err);
  else if (err.code === 11000) error = handleDuplicateKey(err);
  else if (err.name === 'ValidationError') error = handleValidationError(err);
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') error = handleJWT();
  else if (!(err instanceof ApiError)) {
    error = ApiError.internal(env.isProd ? 'Internal server error' : err.message);
  }

  if (error.statusCode >= 500) logger.error(error.stack || error.message);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    code: error.code,
    errors: error.errors?.length ? error.errors : undefined,
    ...(env.isProd ? {} : { stack: error.stack }),
  });
};

export default errorHandler;

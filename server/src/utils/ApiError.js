export default class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.isOperational = true;
    this.errors = options.errors || [];
    this.code = options.code;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, { errors, code: 'BAD_REQUEST' });
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message, { code: 'CONFLICT' });
  }

  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message, { code: 'TOO_MANY_REQUESTS' });
  }

  static locked(message = 'Account locked') {
    return new ApiError(423, message, { code: 'ACCOUNT_LOCKED' });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(503, message, { code: 'SERVICE_UNAVAILABLE' });
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, { code: 'INTERNAL_ERROR' });
  }
}

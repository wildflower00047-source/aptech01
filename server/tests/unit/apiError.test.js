import { describe, it, expect } from 'vitest';
import ApiError from '../../src/utils/ApiError.js';

describe('ApiError', () => {
  it('carries status code, message, code and success=false', () => {
    const err = new ApiError(400, 'nope', { code: 'X', errors: [{ field: 'a', message: 'b' }] });
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('nope');
    expect(err.code).toBe('X');
    expect(err.success).toBe(false);
    expect(err.isOperational).toBe(true);
    expect(err.errors).toHaveLength(1);
    expect(err).toBeInstanceOf(Error);
  });

  it('exposes the expected factory status codes', () => {
    const cases = [
      [ApiError.badRequest(), 400],
      [ApiError.unauthorized(), 401],
      [ApiError.forbidden(), 403],
      [ApiError.notFound(), 404],
      [ApiError.conflict(), 409],
      [ApiError.locked(), 423],
      [ApiError.tooMany(), 429],
      [ApiError.internal(), 500],
      [ApiError.serviceUnavailable(), 503],
    ];
    for (const [err, code] of cases) {
      expect(err.statusCode).toBe(code);
      expect(typeof err.code).toBe('string');
    }
  });

  it('uses default messages when none are supplied', () => {
    expect(ApiError.forbidden().message).toBe('Forbidden');
    expect(ApiError.serviceUnavailable().message).toBe('Service temporarily unavailable');
  });
});

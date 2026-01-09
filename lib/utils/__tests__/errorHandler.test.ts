import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiError, parseError, safeAsync, createError } from '../errorHandler';

describe('errorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('parseError', () => {
    it('should return ErrorResponse from Error object', () => {
      const error = new Error('Test error message');
      const result = parseError(error);
      expect(result.message).toBe('Test error message');
      expect(result.code).toBe('Error');
    });

    it('should return message from string', () => {
      const result = parseError('Direct string error');
      expect(result.message).toBe('Direct string error');
    });

    it('should return message from object with message property', () => {
      const error = { message: 'Object error message' };
      const result = parseError(error);
      expect(result.message).toBe('Object error message');
    });

    it('should return default message for unknown types', () => {
      expect(parseError(null).message).toBe('An unexpected error occurred');
      expect(parseError(undefined).message).toBe('An unexpected error occurred');
      expect(parseError(123).message).toBe('An unexpected error occurred');
    });
  });

  describe('handleApiError', () => {
    it('should return user-friendly message for network errors', () => {
      const error = new Error('network error occurred');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('Network error. Please check your connection.');
    });

    it('should handle 401 errors', () => {
      const error = new Error('401 Unauthorized');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('Session expired. Please login again.');
    });

    it('should handle 403 errors', () => {
      const error = new Error('403 Forbidden');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('You do not have permission to perform this action.');
    });

    it('should handle 404 errors', () => {
      const error = new Error('404 Not found');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('The requested resource was not found.');
    });

    it('should handle 500 errors', () => {
      const error = new Error('500 Internal Server Error');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('A server error occurred. Please try again later.');
    });

    it('should return original message for generic errors', () => {
      const error = new Error('Custom error message');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('Custom error message');
    });

    it('should handle string errors', () => {
      const result = handleApiError('String error', 'TestContext');
      expect(result).toBe('String error');
    });

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('Request timed out. Please try again.');
    });

    it('should sanitize errors containing sensitive information', () => {
      const error = new Error('Failed to validate password hash');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('An error occurred. Please try again or contact support.');
    });

    it('should sanitize errors containing SQL information', () => {
      const error = new Error('SQL syntax error near SELECT');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('An error occurred. Please try again or contact support.');
    });

    it('should sanitize errors containing stack traces', () => {
      const error = new Error('Error at UserService.login (user.js:42)');
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('An error occurred. Please try again or contact support.');
    });

    it('should truncate very long error messages', () => {
      const longMessage = 'A'.repeat(250);
      const error = new Error(longMessage);
      const result = handleApiError(error, 'TestContext');
      expect(result).toBe('An error occurred. Please try again.');
    });

    it('should return default message for unknown error types', () => {
      const result = handleApiError(123, 'TestContext');
      expect(result).toBe('An unexpected error occurred');
    });
  });

  describe('safeAsync', () => {
    it('should return data on success', async () => {
      const successFn = async () => ({ data: 'test' });
      const [data, error] = await safeAsync(successFn, 'TestContext');

      expect(data).toEqual({ data: 'test' });
      expect(error).toBeNull();
    });

    it('should return error on failure', async () => {
      const failFn = async () => {
        throw new Error('Async error');
      };
      const [data, error] = await safeAsync(failFn, 'TestContext');

      expect(data).toBeNull();
      expect(error).toBe('Async error');
    });
  });

  describe('createError', () => {
    it('should create an error with message', () => {
      const error = createError('Test message');
      expect(error.message).toBe('Test message');
    });

    it('should create an error with code and details', () => {
      const error = createError('Test message', 'TEST_CODE', { extra: 'data' });
      expect(error.message).toBe('Test message');
      expect((error as Error & { code?: string }).code).toBe('TEST_CODE');
      expect((error as Error & { details?: unknown }).details).toEqual({ extra: 'data' });
    });
  });
});

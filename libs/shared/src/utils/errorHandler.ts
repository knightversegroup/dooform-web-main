/**
 * Centralized error handling utility for Dooform Web
 *
 * Provides consistent error handling, formatting, and logging
 * across the application.
 */

import { logger } from './logger';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Handle API errors with consistent logging and formatting
 *
 * @param error - The caught error
 * @param context - Context string for logging (e.g., component or function name)
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await apiClient.getData();
 * } catch (error) {
 *   const message = handleApiError(error, 'DataFetcher');
 *   setError(message);
 * }
 * ```
 */
/**
 * List of patterns that indicate sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /credential/i,
  /auth/i,
  /bearer/i,
  /sql/i,
  /database/i,
  /connection string/i,
  /stack trace/i,
  /internal server/i,
  /exception/i,
  /at\s+\w+\.\w+\s*\(/i, // Stack trace pattern
];

/**
 * Sanitize error message to prevent information leakage
 */
function sanitizeErrorMessage(message: string): string {
  // Check if message contains sensitive information
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return 'An error occurred. Please try again or contact support.';
    }
  }

  // Limit message length to prevent verbose error exposure
  if (message.length > 200) {
    return 'An error occurred. Please try again.';
  }

  return message;
}

export function handleApiError(error: unknown, context: string): string {
  logger.error(context, 'API error occurred:', error);

  if (error instanceof Error) {
    // Handle common API error patterns with user-friendly messages
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Session expired. Please login again.';
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('404') || error.message.includes('Not found')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'A server error occurred. Please try again later.';
    }
    if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return 'Request timed out. Please try again.';
    }

    // Sanitize the error message before returning
    return sanitizeErrorMessage(error.message);
  }

  if (typeof error === 'string') {
    return sanitizeErrorMessage(error);
  }

  return 'An unexpected error occurred';
}

/**
 * Parse error from various sources into a consistent format
 *
 * @param error - The caught error
 * @returns Parsed error response
 */
export function parseError(error: unknown): ErrorResponse {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name,
      details: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    return {
      message: (errorObj.message as string) || (errorObj.error as string) || 'Unknown error',
      code: errorObj.code as string,
      details: errorObj,
    };
  }

  return { message: 'An unexpected error occurred' };
}

/**
 * Safely execute an async function with error handling
 *
 * @param fn - Async function to execute
 * @param context - Context for error logging
 * @returns Result tuple [data, error]
 *
 * @example
 * ```typescript
 * const [data, error] = await safeAsync(
 *   () => apiClient.getData(),
 *   'DataFetcher'
 * );
 * if (error) {
 *   setError(error);
 *   return;
 * }
 * setData(data);
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string
): Promise<[T | null, string | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const message = handleApiError(error, context);
    return [null, message];
  }
}

/**
 * Create an error with additional context
 */
export function createError(message: string, code?: string, details?: unknown): Error {
  const error = new Error(message);
  (error as Error & { code?: string; details?: unknown }).code = code;
  (error as Error & { code?: string; details?: unknown }).details = details;
  return error;
}

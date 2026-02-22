/**
 * Centralized logging utility for Dooform Web
 *
 * Provides structured logging with log levels that can be controlled
 * based on the environment (development vs production).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDev = process.env.NODE_ENV === 'development';

const config: LoggerConfig = {
  enabled: true,
  minLevel: isDev ? 'debug' : 'warn',
};

function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

function formatMessage(context: string, ...args: unknown[]): unknown[] {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${context}]`, ...args];
}

/**
 * Logger utility with structured logging support
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/utils/logger';
 *
 * logger.debug('MyComponent', 'Debug message', { data: 123 });
 * logger.info('MyComponent', 'Info message');
 * logger.warn('MyComponent', 'Warning message');
 * logger.error('MyComponent', 'Error message', error);
 * ```
 */
export const logger = {
  /**
   * Debug level logging - only shown in development
   */
  debug: (context: string, ...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.log(...formatMessage(context, ...args));
    }
  },

  /**
   * Info level logging - only shown in development
   */
  info: (context: string, ...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.info(...formatMessage(context, ...args));
    }
  },

  /**
   * Warning level logging - shown in all environments
   */
  warn: (context: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(...formatMessage(context, ...args));
    }
  },

  /**
   * Error level logging - shown in all environments
   */
  error: (context: string, ...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(...formatMessage(context, ...args));
    }
  },

  /**
   * Configure the logger at runtime
   */
  configure: (newConfig: Partial<LoggerConfig>): void => {
    Object.assign(config, newConfig);
  },

  /**
   * Create a scoped logger with a fixed context
   */
  scope: (context: string) => ({
    debug: (...args: unknown[]) => logger.debug(context, ...args),
    info: (...args: unknown[]) => logger.info(context, ...args),
    warn: (...args: unknown[]) => logger.warn(context, ...args),
    error: (...args: unknown[]) => logger.error(context, ...args),
  }),
};

export type { LogLevel, LoggerConfig };

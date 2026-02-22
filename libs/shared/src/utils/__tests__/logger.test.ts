import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('in development mode (configured)', () => {
    beforeEach(() => {
      // Configure logger to behave like development mode
      logger.configure({ minLevel: 'debug' });
    });

    afterEach(() => {
      // Reset to default (warn level for test environment)
      logger.configure({ minLevel: 'warn' });
    });

    it('should log debug messages when minLevel is debug', () => {
      logger.debug('TestContext', 'debug message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log info messages when minLevel is debug', () => {
      logger.info('TestContext', 'info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('TestContext', 'warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('TestContext', 'error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('in production mode (default test behavior)', () => {
    beforeEach(() => {
      // Configure logger to behave like production mode
      logger.configure({ minLevel: 'warn' });
    });

    it('should NOT log debug messages', () => {
      logger.debug('TestContext', 'debug message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should NOT log info messages', () => {
      logger.info('TestContext', 'info message');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('TestContext', 'warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('TestContext', 'error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('disabled logger', () => {
    beforeEach(() => {
      logger.configure({ enabled: false });
    });

    afterEach(() => {
      logger.configure({ enabled: true, minLevel: 'warn' });
    });

    it('should not log anything when disabled', () => {
      logger.debug('TestContext', 'debug');
      logger.info('TestContext', 'info');
      logger.warn('TestContext', 'warn');
      logger.error('TestContext', 'error');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('scope', () => {
    beforeEach(() => {
      logger.configure({ minLevel: 'debug' });
    });

    afterEach(() => {
      logger.configure({ minLevel: 'warn' });
    });

    it('should create a scoped logger with preset context', () => {
      const scopedLogger = logger.scope('MyComponent');

      scopedLogger.debug('scoped debug');
      expect(consoleSpy.log).toHaveBeenCalled();

      scopedLogger.error('scoped error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    beforeEach(() => {
      logger.configure({ minLevel: 'debug' });
    });

    afterEach(() => {
      logger.configure({ minLevel: 'warn' });
    });

    it('should include context in log messages', () => {
      logger.debug('TestContext', 'test message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0];
      expect(logCall[0]).toMatch(/\[TestContext\]/);
    });

    it('should include timestamp in log messages', () => {
      logger.debug('TestContext', 'test message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0];
      // ISO timestamp pattern
      expect(logCall[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\]/);
    });
  });
});

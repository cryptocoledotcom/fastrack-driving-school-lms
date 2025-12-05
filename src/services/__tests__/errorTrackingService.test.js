import { describe, it, expect, vi } from 'vitest';

describe('Error Tracking Service', () => {
  describe('errorTrackingService exports', () => {
    it('should export all required functions', async () => {
      const module = await import('../errorTrackingService');

      expect(module.captureError).toBeDefined();
      expect(module.captureMessage).toBeDefined();
      expect(module.setUserContext).toBeDefined();
      expect(module.clearUserContext).toBeDefined();
      expect(module.addBreadcrumb).toBeDefined();
      expect(typeof module.captureError).toBe('function');
      expect(typeof module.captureMessage).toBe('function');
      expect(typeof module.setUserContext).toBe('function');
      expect(typeof module.clearUserContext).toBe('function');
      expect(typeof module.addBreadcrumb).toBe('function');
    });

    it('should accept error objects with context', async () => {
      const { captureError } = await import('../errorTrackingService');
      const error = new Error('Test error');

      expect(() => captureError(error, { component: 'Test' })).not.toThrow();
    });

    it('should accept messages with different levels', async () => {
      const { captureMessage } = await import('../errorTrackingService');

      expect(() => captureMessage('Test', 'info')).not.toThrow();
      expect(() => captureMessage('Test', 'warning')).not.toThrow();
      expect(() => captureMessage('Test', 'error')).not.toThrow();
    });

    it('should accept user context information', async () => {
      const { setUserContext } = await import('../errorTrackingService');

      expect(() => setUserContext('123', 'user@test.com', 'Test User')).not.toThrow();
    });

    it('should clear user context', async () => {
      const { clearUserContext } = await import('../errorTrackingService');

      expect(() => clearUserContext()).not.toThrow();
    });

    it('should accept breadcrumb data', async () => {
      const { addBreadcrumb } = await import('../errorTrackingService');

      expect(() => addBreadcrumb('Action', 'category', 'info', { data: 'value' })).not.toThrow();
    });
  });
});

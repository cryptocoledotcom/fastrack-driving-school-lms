import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { httpsCallable, _getFunctions } from 'firebase/functions';

import { useComplianceHeartbeat } from './useComplianceHeartbeat';



vi.mock('firebase/functions', () => ({
  _getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApp: vi.fn(),
}));

describe('useComplianceHeartbeat', () => {
  let mockHeartbeatFn;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeartbeatFn = vi.fn();
    httpsCallable.mockReturnValue(mockHeartbeatFn);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should call heartbeat function every 60 seconds', async () => {
    const userId = 'test-user-123';
    const courseId = 'course-456';
    const sessionId = 'session-789';

    mockHeartbeatFn.mockResolvedValue({
      data: {
        success: true,
        minutesCompleted: 5,
        remainingMinutes: 235
      }
    });

    renderHook(() =>
      useComplianceHeartbeat({
        userId,
        courseId,
        sessionId,
        enabled: true
      })
    );

    vi.advanceTimersByTime(60 * 1000);

    await waitFor(() => {
      expect(mockHeartbeatFn).toHaveBeenCalledWith({
        userId,
        courseId,
        sessionId
      });
    });
  });

  it('should call onHeartbeatSuccess callback on successful heartbeat', async () => {
    const onHeartbeatSuccess = vi.fn();
    const userId = 'test-user-123';
    const courseId = 'course-456';
    const sessionId = 'session-789';

    const mockResponse = {
      success: true,
      minutesCompleted: 5,
      remainingMinutes: 235
    };

    mockHeartbeatFn.mockResolvedValue({
      data: mockResponse
    });

    renderHook(() =>
      useComplianceHeartbeat({
        userId,
        courseId,
        sessionId,
        enabled: true,
        onHeartbeatSuccess
      })
    );

    await vi.advanceTimersByTimeAsync(60 * 1000);

    await waitFor(() => {
      expect(onHeartbeatSuccess).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('should call onLimitReached when daily limit is exceeded', async () => {
    const onLimitReached = vi.fn();
    const userId = 'test-user-123';
    const courseId = 'course-456';
    const sessionId = 'session-789';

    mockHeartbeatFn.mockRejectedValue({
      code: 'functions/resource-exhausted',
      message: 'DAILY_LIMIT_REACHED: You have reached the 4-hour daily training limit'
    });

    renderHook(() =>
      useComplianceHeartbeat({
        userId,
        courseId,
        sessionId,
        enabled: true,
        onLimitReached
      })
    );

    await vi.advanceTimersByTimeAsync(60 * 1000);

    await waitFor(() => {
      expect(onLimitReached).toHaveBeenCalledWith({
        message: 'You have reached the 4-hour daily training limit',
        minutesCompleted: 240
      });
    });
  });

  it('should not send heartbeat when disabled', () => {
    mockHeartbeatFn.mockResolvedValue({
      data: {
        success: true,
        minutesCompleted: 5,
        remainingMinutes: 235
      }
    });

    renderHook(() =>
      useComplianceHeartbeat({
        userId: 'test-user-123',
        courseId: 'course-456',
        sessionId: 'session-789',
        enabled: false
      })
    );

    vi.advanceTimersByTime(60 * 1000);

    expect(mockHeartbeatFn).not.toHaveBeenCalled();
  });

  it('should not send heartbeat without required parameters', () => {
    mockHeartbeatFn.mockResolvedValue({
      data: {
        success: true,
        minutesCompleted: 5,
        remainingMinutes: 235
      }
    });

    renderHook(() =>
      useComplianceHeartbeat({
        userId: 'test-user-123',
        courseId: null,
        sessionId: 'session-789',
        enabled: true
      })
    );

    vi.advanceTimersByTime(60 * 1000);

    expect(mockHeartbeatFn).not.toHaveBeenCalled();
  });

  it('should call onHeartbeatError callback on error', async () => {
    const onHeartbeatError = vi.fn();
    const userId = 'test-user-123';
    const courseId = 'course-456';
    const sessionId = 'session-789';
    const error = new Error('Network error');

    mockHeartbeatFn.mockRejectedValue(error);

    renderHook(() =>
      useComplianceHeartbeat({
        userId,
        courseId,
        sessionId,
        enabled: true,
        onHeartbeatError
      })
    );

    await vi.advanceTimersByTimeAsync(60 * 1000);

    await waitFor(() => {
      expect(onHeartbeatError).toHaveBeenCalledWith(error);
    });
  });
});

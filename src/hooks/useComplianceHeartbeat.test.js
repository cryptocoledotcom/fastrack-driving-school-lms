import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useComplianceHeartbeat } from './useComplianceHeartbeat';
import { httpsCallable } from 'firebase/functions';

vi.mock('firebase/functions');

describe('useComplianceHeartbeat', () => {
  let mockHeartbeatFn;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeartbeatFn = vi.fn();
    httpsCallable.mockReturnValue(mockHeartbeatFn);
    vi.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
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

    await waitFor(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(mockHeartbeatFn).toHaveBeenCalledWith({
      userId,
      courseId,
      sessionId
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

    await waitFor(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(onHeartbeatSuccess).toHaveBeenCalledWith(mockResponse);
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

    await waitFor(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(onLimitReached).toHaveBeenCalledWith({
      message: 'You have reached the 4-hour daily training limit',
      minutesCompleted: 240
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

    jest.advanceTimersByTime(60 * 1000);

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

    jest.advanceTimersByTime(60 * 1000);

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

    await waitFor(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(onHeartbeatError).toHaveBeenCalledWith(error);
  });
});

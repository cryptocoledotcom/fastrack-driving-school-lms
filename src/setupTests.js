import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('./config/firebase', () => ({
  default: {},
  auth: {},
  db: {},
  storage: {},
}), { esmock: true });

// ... (intermediate lines skipped for brevity in replace, doing multi-replace)

vi.mock('./services/loggingService', () => {
  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  };
  return {
    default: mockLogger,
    ...mockLogger,
  };
}, { esmock: true });

const noop = () => { };

global.jest = {
  mock: vi.mock,
  unmock: vi.unmock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  fn: vi.fn,
  spyOn: vi.spyOn,
  mocked: vi.mocked,
  clearAllTimers: vi.clearAllTimers,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: vi.advanceTimersByTime,
  runAllTimers: vi.runAllTimers,
  advanceTimersByTimeAsync: noop,
  runOnlyPendingTimers: noop,
  runOnlyPendingTimersAsync: noop,
  runAllTimersAsync: noop,
  setSystemTime: vi.setSystemTime,
  getRealSystemTime: vi.getRealSystemTime,
};

if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

if (typeof global.ReadableStream === 'undefined') {
  const { Readable } = require('stream');
  global.ReadableStream = Readable;
}

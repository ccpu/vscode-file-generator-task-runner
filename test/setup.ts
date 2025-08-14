import { vi } from 'vitest';

// Global mkdirp mock to prevent file system operations
vi.mock('mkdirp', () => {
  const mockSync = vi.fn(() => undefined);
  const mkdirp = vi.fn(() => undefined);

  // Ensure sync property is available
  Object.defineProperty(mkdirp, 'sync', {
    value: mockSync,
    writable: true,
    configurable: true,
  });

  return {
    default: mkdirp,
    sync: mockSync,
    __esModule: true,
  };
});

// Setup global test environment
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock console methods to avoid noise in test output
// eslint-disable-next-line no-restricted-globals
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

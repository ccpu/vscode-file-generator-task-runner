import { vi } from 'vitest';

// Global mocks for file system operations to prevent CI errors
vi.mock('mkdirp', () => ({
  sync: vi.fn(),
}));

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

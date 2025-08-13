import process from 'node:process';
// Mock for is-windows module
import { vi } from 'vitest';

const isWindows = vi.fn(() => process.platform === 'win32');

export default isWindows;

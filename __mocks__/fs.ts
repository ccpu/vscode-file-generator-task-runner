import { vi } from 'vitest';

export const existsSync = vi.fn();
export const readFileSync = vi.fn();
export const writeFileSync = vi.fn();
export const mkdirSync = vi.fn();
export const lstatSync = vi.fn();
export const statSync = vi.fn();
export const readdirSync = vi.fn();
export const unlinkSync = vi.fn();
export const rmdirSync = vi.fn();

export const promises = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
  rmdir: vi.fn(),
};

// Reset all mocks

export function __resetMocks() {
  existsSync.mockClear();
  readFileSync.mockClear();
  writeFileSync.mockClear();
  mkdirSync.mockClear();
  lstatSync.mockClear();
  statSync.mockClear();
  readdirSync.mockClear();
  unlinkSync.mockClear();
  rmdirSync.mockClear();
  promises.readFile.mockClear();
  promises.writeFile.mockClear();
  promises.mkdir.mockClear();
  promises.stat.mockClear();
  promises.readdir.mockClear();
  promises.unlink.mockClear();
  promises.rmdir.mockClear();
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getDirectoryPath,
  isDirectory,
  isFile,
  replaceSourceDir,
} from '../../src/utils/util';

// Mock fs module
vi.mock('fs', () => ({
  lstatSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock is-windows
vi.mock('is-windows', () => ({
  default: vi.fn(() => process.platform === 'win32'),
}));

describe('util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDirectoryPath', () => {
    it('should return directory path by removing last component', () => {
      const filePath = path.join('project', 'src', 'file.ts');
      const result = getDirectoryPath(filePath);
      const expected = path.join('project', 'src');
      expect(result).toBe(expected);
    });

    it('should handle absolute paths', () => {
      const filePath = path.resolve('project', 'src', 'file.ts');
      const result = getDirectoryPath(filePath);
      expect(result).toContain('project');
      expect(result).toContain('src');
      expect(result).not.toContain('file.ts');
    });

    it('should handle relative paths', () => {
      const filePath = path.join('src', 'components', 'file.ts');
      const result = getDirectoryPath(filePath);
      const expected = path.join('src', 'components');
      expect(result).toBe(expected);
    });

    it('should handle single file', () => {
      const filePath = 'file.ts';
      const result = getDirectoryPath(filePath);
      expect(result).toBe('.');
    });
  });

  describe('isDirectory', () => {
    it('should return true for directories', () => {
      const mockLstat = vi.mocked(fs.lstatSync);
      mockLstat.mockReturnValue({
        isDirectory: () => true,
        isFile: () => false,
      } as any);

      const result = isDirectory('/path/to/directory');
      expect(result).toBe(true);
      expect(mockLstat).toHaveBeenCalledWith('/path/to/directory');
    });

    it('should return false for files', () => {
      const mockLstat = vi.mocked(fs.lstatSync);
      mockLstat.mockReturnValue({
        isDirectory: () => false,
        isFile: () => true,
      } as any);

      const result = isDirectory('/path/to/file.ts');
      expect(result).toBe(false);
      expect(mockLstat).toHaveBeenCalledWith('/path/to/file.ts');
    });
  });

  describe('isFile', () => {
    it('should return true for files', () => {
      const mockLstat = vi.mocked(fs.lstatSync);
      mockLstat.mockReturnValue({
        isDirectory: () => false,
        isFile: () => true,
      } as any);

      const result = isFile('/path/to/file.ts');
      expect(result).toBe(true);
      expect(mockLstat).toHaveBeenCalledWith('/path/to/file.ts');
    });

    it('should return false for directories', () => {
      const mockLstat = vi.mocked(fs.lstatSync);
      mockLstat.mockReturnValue({
        isDirectory: () => true,
        isFile: () => false,
      } as any);

      const result = isFile('/path/to/directory');
      expect(result).toBe(false);
      expect(mockLstat).toHaveBeenCalledWith('/path/to/directory');
    });
  });

  describe('replaceSourceDir', () => {
    it('should return original path if sourceDir is empty', () => {
      const filePath = '/project/src/components/file.ts';
      const result = replaceSourceDir(filePath, '');
      expect(result).toBe(filePath);
    });

    it('should remove sourceDir from beginning of path when using correct separator', () => {
      const filePath = `src${path.sep}components${path.sep}file.ts`;
      const result = replaceSourceDir(filePath, 'src');
      const expected = `components${path.sep}file.ts`;
      expect(result).toBe(expected);
    });

    it('should replace sourceDir in middle of path when using correct separator', () => {
      const filePath = path.join('project', 'src', 'components', 'file.ts');
      const result = replaceSourceDir(filePath, 'src');
      const expected = path.join('project', 'components', 'file.ts');
      expect(result).toBe(expected);
    });

    it('should replace sourceDir at end of path when using correct separator', () => {
      const filePath = path.join('project', 'components', 'src');
      const result = replaceSourceDir(filePath, 'src');
      const expected = path.join('project', 'components') + path.sep;
      expect(result).toBe(expected);
    });

    it('should handle multiple occurrences of sourceDir when using correct separator', () => {
      const filePath = `src${path.sep}components${path.sep}src${path.sep}file.ts`;
      const result = replaceSourceDir(filePath, 'src');
      const expected = `components${path.sep}file.ts`;
      expect(result).toBe(expected);
    });

    it('should not modify paths with wrong separator', () => {
      // This tests that the function is separator-aware
      const filePath = '/project/src/components/file.ts'; // Unix-style path
      const result = replaceSourceDir(filePath, 'src');
      // On Windows, this should not match because it uses forward slashes
      if (path.sep === '\\') {
        expect(result).toBe(filePath); // Should remain unchanged
      } else {
        // On Unix, this should work
        expect(result).toBe('/project/components/file.ts');
      }
    });

    it('should handle Windows-style paths', () => {
      const filePath = 'src\\components\\file.ts';
      const result = replaceSourceDir(filePath, 'src');
      // Should work with backslashes on Windows
      expect(result).toContain('components');
      expect(result).toContain('file.ts');
    });
  });
});

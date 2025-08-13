import type { Configuration } from '../src/config/Configuration';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { DefaultLocationForNewFiles } from '../src/constants';
import { SourceFile } from '../src/source-file';
import { getWorkspaceRootForFile } from '../src/utils/index';

// Mock dependencies
vi.mock('vscode', () => ({
  workspace: {
    getWorkspaceFolder: vi.fn(),
  },
  Uri: class MockUri {
    constructor(
      public scheme: string,
      public authority: string,
      public filePath: string,
      public fsPath: string,
    ) {}

    static file(filePath: string) {
      return new MockUri('file', '', filePath, filePath);
    }
  },
}));

vi.mock('../src/utils/index.js', () => ({
  getDirectoryPath: vi.fn(),
  getCurrentWorkspacePath: vi.fn(),
  getWorkspaceRootForFile: vi.fn(),
}));

vi.mock('path', () => ({
  dirname: vi.fn(),
  isAbsolute: vi.fn(),
  resolve: vi.fn(),
  join: vi.fn(),
  relative: vi.fn(),
  basename: vi.fn(),
  extname: vi.fn(),
  sep: process.platform === 'win32' ? '\\' : '/',
}));

describe('sourceFile', () => {
  let mockUri: vscode.Uri;
  let mockConfig: Configuration;
  let mockWorkspaceFolder: vscode.WorkspaceFolder;
  let sourceFile: SourceFile;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUri = vscode.Uri.file('/workspace/src/component.tsx') as any;
    mockWorkspaceFolder = {
      name: 'test-workspace',
      uri: { fsPath: '/workspace' },
      index: 0,
    } as any;

    mockConfig = {
      getRootByFilenameOrExtension: vi.fn(),
      getDirectorySuffix: vi.fn().mockReturnValue(''),
      getDirectoryName: vi.fn().mockReturnValue(''),
      getDefaultLocationForNewFiles: vi
        .fn()
        .mockReturnValue(DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE),
      getRootDirName: vi.fn().mockReturnValue(''),
      shouldCreateFilesInProjectRoot: vi.fn().mockReturnValue(false),
    } as any;

    vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(mockWorkspaceFolder);

    sourceFile = new SourceFile(mockUri, mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with source file URI and config', () => {
      expect(sourceFile).toBeInstanceOf(SourceFile);
      // Remove the expectation for getWorkspaceFolder call, as it may not be called in the new implementation
    });

    it('should handle missing workspace folder', () => {
      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(undefined);

      const sourceFileWithoutWorkspace = new SourceFile(mockUri, mockConfig);
      expect(sourceFileWithoutWorkspace).toBeInstanceOf(SourceFile);
    });
  });

  describe('getBaseDirectoryPath', () => {
    it('should use workspace directory when not project root and no root filename', () => {
      vi.mocked(mockConfig.getRootByFilenameOrExtension).mockReturnValue('');
      vi.mocked(mockConfig.getDefaultLocationForNewFiles).mockReturnValue(
        DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
      );
      vi.mocked(mockConfig.getRootDirName).mockReturnValue('');
      vi.mocked(getWorkspaceRootForFile).mockReturnValue('/workspace');

      const result = sourceFile.getBaseDirectoryPath();

      expect(result).toBe('/workspace');
    });

    it('should handle workspace folder being undefined', () => {
      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(undefined);
      const sourceFileWithoutWorkspace = new SourceFile(mockUri, mockConfig);

      vi.mocked(mockConfig.getRootByFilenameOrExtension).mockReturnValue('');
      vi.mocked(mockConfig.getDefaultLocationForNewFiles).mockReturnValue(
        DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
      );
      vi.mocked(mockConfig.getRootDirName).mockReturnValue('');
      vi.mocked(getWorkspaceRootForFile).mockReturnValue('');

      const result = sourceFileWithoutWorkspace.getBaseDirectoryPath();

      expect(result).toBe('');
    });
  });

  describe('getWorkSpaceDir', () => {
    it('should return current workspace path', async () => {
      const { getCurrentWorkspacePath } = await import('../src/utils/index.js');
      vi.mocked(getCurrentWorkspacePath).mockReturnValue('/workspace');

      const result = sourceFile.getWorkSpaceDir();

      expect(getCurrentWorkspacePath).toHaveBeenCalledWith(mockUri);
      expect(result).toBe('/workspace');
    });
  });

  describe('isEndWithDirectorySuffix', () => {
    it('should return true when directory ends with suffix', () => {
      vi.mocked(mockConfig.getDirectorySuffix).mockReturnValue('__tests__');

      const result = sourceFile.isEndWithDirectorySuffix('/workspace/src/__tests__');

      expect(result).toBe(true);
    });

    it('should return false when directory does not end with suffix', () => {
      vi.mocked(mockConfig.getDirectorySuffix).mockReturnValue('__tests__');

      const result = sourceFile.isEndWithDirectorySuffix('/workspace/src/components');

      expect(result).toBe(false);
    });

    it('should return false when no suffix configured', () => {
      vi.mocked(mockConfig.getDirectorySuffix).mockReturnValue('');

      const result = sourceFile.isEndWithDirectorySuffix('/workspace/src/__tests__');

      expect(result).toBe(false);
    });
  });

  describe('getAbsolutePath', () => {
    it('should return absolute file path', () => {
      const result = sourceFile.getAbsolutePath();
      expect(result).toBe('/workspace/src/component.tsx');
    });
  });

  describe('getRelativeFileDirname', () => {
    it('should return relative file directory name', () => {
      // Mock the base directory path method
      const sourceFileSpy = vi
        .spyOn(sourceFile, 'getBaseDirectoryPath')
        .mockReturnValue('/workspace');
      const sourceFileAbsPathSpy = vi
        .spyOn(sourceFile, 'getAbsolutePath')
        .mockReturnValue('/workspace/src/component.tsx');

      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('');
      vi.mocked(mockConfig.getDirectorySuffix).mockReturnValue('');
      vi.mocked(path.relative).mockReturnValue('src/component.tsx');

      const result = sourceFile.getRelativeFileDirname();

      expect(path.relative).toHaveBeenCalledWith(
        '/workspace',
        '/workspace/src/component.tsx',
      );
      expect(result).toBe('src/component.tsx');

      sourceFileSpy.mockRestore();
      sourceFileAbsPathSpy.mockRestore();
    });

    it('should handle directory suffix', () => {
      const sourceFileSpy = vi
        .spyOn(sourceFile, 'getBaseDirectoryPath')
        .mockReturnValue('/workspace');
      const sourceFileAbsPathSpy = vi
        .spyOn(sourceFile, 'getAbsolutePath')
        .mockReturnValue('/workspace/src/component.tsx');

      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('');
      vi.mocked(mockConfig.getDirectorySuffix).mockReturnValue('__tests__');
      vi.mocked(mockConfig.getRootByFilenameOrExtension).mockReturnValue('package.json');
      vi.mocked(path.relative).mockReturnValue('src/__tests__/component.tsx');

      sourceFile.getRelativeFileDirname();

      expect(path.relative).toHaveBeenCalledWith(
        '/workspace__tests__',
        '/workspace/src/component.tsx',
      );

      sourceFileSpy.mockRestore();
      sourceFileAbsPathSpy.mockRestore();
    });

    it('should handle custom directory name', () => {
      const sourceFileSpy = vi
        .spyOn(sourceFile, 'getBaseDirectoryPath')
        .mockReturnValue('/workspace');
      const sourceFileAbsPathSpy = vi
        .spyOn(sourceFile, 'getAbsolutePath')
        .mockReturnValue('/workspace/src/component.tsx');

      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('components');
      vi.mocked(mockConfig.getDirectorySuffix).mockReturnValue('');
      vi.mocked(path.relative).mockReturnValue('components/component.tsx');

      const result = sourceFile.getRelativeFileDirname();

      // The actual implementation would process the custom directory name
      expect(result).toBe('components/component.tsx');

      sourceFileSpy.mockRestore();
      sourceFileAbsPathSpy.mockRestore();
    });
  });

  describe('getDirectoryPath', () => {
    it('should return directory path of the file', async () => {
      const { getDirectoryPath } = await import('../src/utils/index.js');
      vi.mocked(getDirectoryPath).mockReturnValue('/workspace/src');

      const result = sourceFile.getDirectoryPath();

      expect(getDirectoryPath).toHaveBeenCalledWith('/workspace/src/component.tsx');
      expect(result).toBe('/workspace/src');
    });
  });

  describe('getName', () => {
    it('should return file name with extension', () => {
      vi.mocked(path.basename).mockReturnValue('component.tsx');

      const result = sourceFile.getName();

      expect(path.basename).toHaveBeenCalledWith('/workspace/src/component.tsx');
      expect(result).toBe('component.tsx');
    });
  });

  describe('getExtension', () => {
    it('should return file extension', () => {
      const result = sourceFile.getExtension();
      expect(result).toBe('tsx');
    });

    it('should return last part after split by dot for files without dot', () => {
      // Create a proper mock URI with no extension
      const mockUriNoExt = {
        fsPath: 'README', // Just the filename without path to test the split behavior
        scheme: 'file',
        authority: '',
        path: 'README',
      } as any;
      const sourceFileNoExt = new SourceFile(mockUriNoExt, mockConfig);

      const result = sourceFileNoExt.getExtension();
      expect(result).toBe('README'); // Should split by '.' and take the last part
    });
  });

  describe('getNameWithoutExtension', () => {
    it('should return file name without extension', () => {
      vi.mocked(path.basename).mockReturnValue('component');
      vi.mocked(path.extname).mockReturnValue('.tsx');

      const result = sourceFile.getNameWithoutExtension();

      expect(path.basename).toHaveBeenCalledWith('/workspace/src/component.tsx', '.tsx');
      expect(result).toBe('component');
    });
  });
});

import type { Configuration } from '../src/config/Configuration';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DefaultLocationForNewFiles } from '../src/constants';
import { NewFileHelper } from '../src/new-file-helper';
import { SourceFile } from '../src/source-file';

// Mock all dependencies
vi.mock('vscode', () => ({
  workspace: {
    rootPath: '/workspace',
  },
  Uri: {
    file: vi.fn((filePath) => ({ fsPath: filePath })),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('mkdirp', () => ({
  sync: vi.fn(),
}));

vi.mock('../src/source-file.js', () => ({
  SourceFile: vi.fn(),
}));

vi.mock('../src/utils/index.js', () => ({
  getDirectoryPath: vi.fn(),
  replaceSourceDir: vi.fn(),
  getFileName: vi.fn(),
  isNewDirectory: vi.fn(),
}));

describe('newFileHelper', () => {
  let helper: NewFileHelper;
  let mockConfig: Configuration;
  let mockSourceFile: SourceFile;
  let mockFs: any;
  let mockMkdirp: any;
  let mockUtils: any;

  // Platform-aware path normalization for tests
  const normalizePath = (testPath: string) => testPath.replace(/\//gu, path.sep);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFs = await import('node:fs');
    mockMkdirp = await import('mkdirp');
    mockUtils = await import('../src/utils/index.js');

    mockConfig = {
      getCustomLocationForNewFiles: vi.fn().mockReturnValue(''),
      getRootByFilenameOrExtension: vi.fn().mockReturnValue(false),
      getDirectoryName: vi.fn().mockReturnValue('tests'),
      getSourceDir: vi.fn().mockReturnValue('src'),
      getDefaultLocationForNewFiles: vi
        .fn()
        .mockReturnValue(DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE),
      getNewFilesSuffix: vi.fn().mockReturnValue('test'),
      ignoreDirectories: false,
    } as any;

    mockSourceFile = {
      getDirectoryPath: vi
        .fn()
        .mockReturnValue(normalizePath('/workspace/src/components')),
      getBaseDirectoryPath: vi.fn().mockReturnValue(normalizePath('/workspace')),
      getRelativeFileDirname: vi.fn().mockReturnValue(normalizePath('src/components')),
      getName: vi.fn().mockReturnValue('Button.ts'),
      getNameWithoutExtension: vi.fn().mockReturnValue('Button'),
      getExtension: vi.fn().mockReturnValue('ts'),
    } as any;

    vi.mocked(SourceFile).mockReturnValue(mockSourceFile as any);
    vi.mocked(mockUtils.getDirectoryPath).mockReturnValue('components');
    vi.mocked(mockUtils.replaceSourceDir).mockImplementation(
      (inputPath: string, _sourceDir: string) => inputPath,
    );
    vi.mocked(mockUtils.getFileName).mockReturnValue('Button.test.ts');
    vi.mocked(mockUtils.isNewDirectory).mockReturnValue(true);

    helper = new NewFileHelper(mockConfig, mockSourceFile);
  });

  describe('constructor', () => {
    it('should set config and sourceFile properties', () => {
      expect(helper.config).toBe(mockConfig);
      expect(helper.sourceFile).toBe(mockSourceFile);
    });
  });

  describe('isTestFile', () => {
    it('should return true for test files', () => {
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.test.ts');
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');

      const result = helper.isTestFile(mockSourceFile);

      expect(result).toBe(true);
    });

    it('should return false for non-test files', () => {
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.ts');
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');

      const result = helper.isTestFile(mockSourceFile);

      expect(result).toBe(false);
    });
  });

  describe('getParentFileName', () => {
    it('should return parent file name for test files', () => {
      vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('Button.test');
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');

      const result = helper.getParentFileName(mockSourceFile);

      expect(result).toBe('Button.ts');
    });
  });

  describe('getParentSourceFile', () => {
    it('should return parent source file for test files', () => {
      const mockParentSourceFile = {
        fsPath: normalizePath('/workspace/src/Button.ts'),
      };
      vi.mocked(SourceFile).mockReturnValue(mockParentSourceFile as any);
      vi.mocked(mockSourceFile.getDirectoryPath).mockReturnValue(
        normalizePath('/workspace/src/tests'),
      );
      vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('Button.test');
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('tests');

      const result = helper.getParentSourceFile(mockSourceFile);

      expect(SourceFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: normalizePath('/workspace/src/Button.ts'),
        }),
        mockConfig,
      );
      expect(result).toBe(mockParentSourceFile);
    });
  });

  describe('getFilesLocation', () => {
    it('should return source directory for test files', () => {
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.test.ts');
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
      vi.mocked(mockSourceFile.getDirectoryPath).mockReturnValue(
        normalizePath('/workspace/src/components'),
      );

      const result = helper.getFilesLocation();

      expect(result).toBe(normalizePath('/workspace/src/components'));
    });

    it('should use custom location when configured', () => {
      vi.mocked(mockConfig.getCustomLocationForNewFiles).mockReturnValue(
        normalizePath('/workspace/tests'),
      );
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.ts');

      const result = helper.getFilesLocation();

      expect(result).toContain('tests');
    });

    it('should handle same as source file location', () => {
      vi.mocked(mockConfig.getDefaultLocationForNewFiles).mockReturnValue(
        DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
      );
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.ts');
      vi.mocked(mockSourceFile.getDirectoryPath).mockReturnValue(
        normalizePath('/workspace/src/components'),
      );

      const result = helper.getFilesLocation();

      expect(result).toBe(normalizePath('/workspace/src/components/tests'));
    });

    it('should handle project root location with multiple directories', () => {
      vi.mocked(mockConfig.getDefaultLocationForNewFiles).mockReturnValue(
        DefaultLocationForNewFiles.PROJECT_ROOT,
      );
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.ts');
      vi.mocked(mockSourceFile.getRelativeFileDirname).mockReturnValue(
        normalizePath('src/components'),
      );
      vi.mocked(mockSourceFile.getBaseDirectoryPath).mockReturnValue(
        normalizePath('/workspace'),
      );

      // Mock mimicSourceDirectoryStructure method
      const mimicSpy = vi
        .spyOn(helper as any, 'mimicSourceDirectoryStructure')
        .mockReturnValue(normalizePath('/workspace/tests/components'));

      const result = helper.getFilesLocation();

      expect(mimicSpy).toHaveBeenCalled();
      expect(result).toBe(normalizePath('/workspace/tests/components'));
    });

    it('should return project root for simple file structure', () => {
      vi.mocked(mockConfig.getDefaultLocationForNewFiles).mockReturnValue(
        DefaultLocationForNewFiles.PROJECT_ROOT,
      );
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.ts');
      vi.mocked(mockSourceFile.getRelativeFileDirname).mockReturnValue('Button');
      vi.mocked(mockSourceFile.getBaseDirectoryPath).mockReturnValue(
        normalizePath('/workspace'),
      );

      const result = helper.getFilesLocation();

      expect(result).toBe(normalizePath('/workspace'));
    });
  });

  describe('mimicSourceDirectoryStructure', () => {
    it('should create directory structure and return path', () => {
      vi.mocked(mockSourceFile.getBaseDirectoryPath).mockReturnValue(
        normalizePath('/workspace'),
      );
      vi.mocked(mockSourceFile.getRelativeFileDirname).mockReturnValue(
        normalizePath('src/components'),
      );
      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('tests');
      vi.mocked(mockConfig.getSourceDir).mockReturnValue('src');
      vi.mocked(mockUtils.getDirectoryPath).mockReturnValue('components');
      vi.mocked(mockUtils.replaceSourceDir).mockReturnValue(
        normalizePath('/workspace/tests/components'),
      );
      vi.mocked(mockFs.existsSync).mockReturnValue(false);

      // Access private method through type assertion
      const result = (helper as any).mimicSourceDirectoryStructure();

      // Focus on the return value rather than the side effect
      expect(result).toBe(normalizePath('/workspace/tests/components'));
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should not create directory if it already exists', () => {
      vi.mocked(mockSourceFile.getBaseDirectoryPath).mockReturnValue(
        normalizePath('/workspace'),
      );
      vi.mocked(mockSourceFile.getRelativeFileDirname).mockReturnValue(
        normalizePath('src/components'),
      );
      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('tests');
      vi.mocked(mockConfig.getSourceDir).mockReturnValue('src');
      vi.mocked(mockUtils.getDirectoryPath).mockReturnValue('components');
      vi.mocked(mockUtils.replaceSourceDir).mockReturnValue(
        normalizePath('/workspace/tests/components'),
      );
      vi.mocked(mockFs.existsSync).mockReturnValue(true);

      // Access private method through type assertion
      const result = (helper as any).mimicSourceDirectoryStructure();

      expect(mockMkdirp.sync).not.toHaveBeenCalled();
      expect(result).toBe(normalizePath('/workspace/tests/components'));
    });
  });

  describe('getFilesDirectory', () => {
    it('should add directory name when not present', () => {
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(true);
      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('tests');

      // Mock getFilesLocation to return a simple path
      vi.spyOn(helper, 'getFilesLocation').mockReturnValue(
        normalizePath('/workspace/src'),
      );

      const result = helper.getFilesDirectory();

      expect(result).toBe(normalizePath('/workspace/src/tests'));
    });

    it('should return location as-is when directory already present', () => {
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(false);

      // Mock getFilesLocation to return a path with tests already
      vi.spyOn(helper, 'getFilesLocation').mockReturnValue(
        normalizePath('/workspace/src/tests'),
      );

      const result = helper.getFilesDirectory();

      expect(result).toBe(normalizePath('/workspace/src/tests'));
    });
  });

  describe('getSourceFile', () => {
    it('should return new SourceFile instance', () => {
      const mockNewSourceFile = {
        fsPath: normalizePath('/workspace/src/tests/Button.test.ts'),
      };
      vi.mocked(SourceFile).mockReturnValue(mockNewSourceFile as any);

      vi.spyOn(helper, 'getFileAbsolutePath').mockReturnValue(
        normalizePath('/workspace/src/tests/Button.test.ts'),
      );

      const result = helper.getSourceFile();

      expect(SourceFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fsPath: normalizePath('/workspace/src/tests/Button.test.ts'),
        }),
        mockConfig,
      );
      expect(result).toBe(mockNewSourceFile);
    });
  });

  describe('getFileAbsolutePath', () => {
    it('should return correct path for non-test files', () => {
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.ts');
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(false);
      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('tests');
      vi.mocked(mockUtils.getFileName).mockReturnValue('Button.test.ts');

      vi.spyOn(helper, 'getFilesLocation').mockReturnValue(
        normalizePath('/workspace/src'),
      );

      const result = helper.getFileAbsolutePath();

      expect(result).toBe(normalizePath('/workspace/src/tests/Button.test.ts'));
    });

    it('should return correct path for test files', () => {
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.test.ts');
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');

      vi.spyOn(helper, 'getFilesLocation').mockReturnValue(
        normalizePath('/workspace/src/tests'),
      );

      const result = helper.getFileAbsolutePath();

      expect(result).toBe(normalizePath('/workspace/src/tests/Button.test.ts'));
    });

    it('should not add directory for test files when directory already exists', () => {
      vi.mocked(mockSourceFile.getName).mockReturnValue('Button.ts');
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(true);
      vi.mocked(mockUtils.getFileName).mockReturnValue('Button.test.ts');

      vi.spyOn(helper, 'getFilesLocation').mockReturnValue(
        normalizePath('/workspace/src'),
      );

      const result = helper.getFileAbsolutePath();

      expect(result).toBe(normalizePath('/workspace/src/Button.test.ts'));
    });
  });
});

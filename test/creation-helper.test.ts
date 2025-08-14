import type { Configuration } from '../src/config/Configuration';
import type { NewFileHelper } from '../src/new-file-helper';
import type { SourceFile } from '../src/source-file';
import type { Template } from '../src/types';
import * as os from 'node:os';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreationHelper } from '../src/creation-helper';

// Mock all dependencies
vi.mock('vscode', () => ({
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('../src/source-file.js', () => ({
  SourceFile: vi.fn(),
}));

vi.mock('../src/new-file-helper.js', () => ({
  NewFileHelper: vi.fn(),
}));

vi.mock('../src/templates/index.js', () => ({
  TemplateManager: {
    replacePlaceHolders: vi.fn(),
  },
}));

vi.mock('../src/utils/index.js', () => ({
  createDirectory: vi.fn(),
  getFileName: vi.fn(),
  isNewDirectory: vi.fn(),
  switchToFile: vi.fn(),
}));

vi.mock('../src/utils/variable-resolver.js', () => ({
  resolveVariables: vi.fn(),
}));

describe('creationHelper', () => {
  let helper: CreationHelper;
  let mockConfig: Configuration;
  let mockSourceFile: SourceFile;
  let mockNewFileHelper: NewFileHelper;
  let mockFs: any;
  let mockUtils: any;
  let mockTemplateManager: any;
  let mockVariableResolver: any;

  // Platform-aware path normalization for tests
  const tempBaseDir = path.join(os.tmpdir(), 'vscode-file-generator-test');
  const tempSrcDir = path.join(tempBaseDir, 'src');
  const normalizePath = (testPath: string) => testPath.split(/[/\\]/u).join(path.sep);

  beforeEach(async () => {
    vi.clearAllMocks();

    mockFs = await import('node:fs');
    mockUtils = await import('../src/utils/index.js');
    mockTemplateManager = await import('../src/templates/index.js');
    mockVariableResolver = await import('../src/utils/variable-resolver.js');

    mockConfig = {
      getDirectoryName: vi.fn().mockReturnValue('tests'),
      shouldSwitchToFile: vi.fn().mockReturnValue(true),
    } as any;

    mockSourceFile = {
      getAbsolutePath: vi.fn().mockReturnValue(path.join(tempSrcDir, 'Button.ts')),
      getBaseDirectoryPath: vi.fn().mockReturnValue(tempBaseDir),
    } as any;

    mockNewFileHelper = {
      getFilesLocation: vi.fn().mockReturnValue(tempSrcDir),
    } as any;

    vi.mocked(mockUtils.getFileName).mockReturnValue('Button.test.ts');
    vi.mocked(mockUtils.isNewDirectory).mockReturnValue(false);
    vi.mocked(mockUtils.switchToFile).mockImplementation(() => {});
    vi.mocked(mockTemplateManager.TemplateManager.replacePlaceHolders).mockReturnValue(
      'test content',
    );
    vi.mocked(mockVariableResolver.resolveVariables).mockReturnValue('resolved content');
    vi.mocked(mockFs.existsSync).mockReturnValue(false);
    vi.mocked(mockFs.writeFile).mockImplementation(
      (filePath: string, content: string, callback: any) => {
        if (typeof callback === 'function') {
          callback(null);
        }
      },
    );

    helper = new CreationHelper(mockSourceFile, mockConfig, mockNewFileHelper);
  });

  describe('constructor', () => {
    it('should set all properties correctly', () => {
      // @ts-ignore
      expect(helper.sourceFile).toBe(mockSourceFile);
      // @ts-ignore
      expect(helper.configuration).toBe(mockConfig);
      expect(helper.newFileHelper).toBe(mockNewFileHelper);
    });
  });

  describe('createFile', () => {
    it('should create file successfully when it does not exist', () => {
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(true);
      vi.mocked(mockFs.existsSync).mockReturnValue(false);

      // Mock getTemplate to return a promise
      vi.spyOn(helper, 'getTemplate').mockResolvedValue(['template `content']);

      // Mock writeContentToFile to return a resolved promise
      vi.spyOn(helper, 'writeContentToFile').mockResolvedValue(true);

      helper.createFile();

      expect(mockNewFileHelper.getFilesLocation).toHaveBeenCalled();
      expect(mockUtils.getFileName).toHaveBeenCalledWith(mockSourceFile, mockConfig);
    });

    it('should throw error when file already exists', () => {
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(true);
      vi.mocked(mockFs.existsSync).mockReturnValue(true);

      expect(() => helper.createFile()).toThrow('File already exists at');
      expect(mockUtils.switchToFile).toHaveBeenCalled();
    });

    it('should create directory when new directory is needed', () => {
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(false);
      vi.mocked(mockFs.existsSync).mockReturnValue(false);

      const createDirectorySpy = vi
        .spyOn(helper, 'createDirectoryIfNotExists')
        .mockReturnValue(normalizePath('/workspace/src/tests'));
      vi.spyOn(helper, 'writeContentToFile').mockResolvedValue(true);

      // Mock the getTemplate method to avoid template processing
      vi.spyOn(helper, 'getTemplate').mockResolvedValue(['test content']);

      helper.createFile();

      expect(createDirectorySpy).toHaveBeenCalledWith(tempSrcDir);
    });

    it('should create directory with mkdirp when directory does not exist', () => {
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(true);
      vi.mocked(mockFs.existsSync).mockReturnValueOnce(false).mockReturnValueOnce(false); // directory doesn't exist, file doesn't exist

      vi.spyOn(helper, 'writeContentToFile').mockResolvedValue(true);

      helper.createFile();

      // Verify that existsSync was called to check directory existence
      expect(mockFs.existsSync).toHaveBeenCalled();
    });

    it('should handle template parameter', () => {
      vi.mocked(mockUtils.isNewDirectory).mockReturnValue(true);
      vi.mocked(mockFs.existsSync).mockReturnValue(false);

      const template: Template = ['custom template'];
      const writeContentSpy = vi
        .spyOn(helper, 'writeContentToFile')
        .mockResolvedValue(true);

      helper.createFile(template);

      expect(writeContentSpy).toHaveBeenCalledWith(
        expect.stringContaining('Button.test.ts'),
        template,
      );
    });
  });

  describe('createDirectoryIfNotExists', () => {
    it('should create directory and return path', () => {
      const inputPath = normalizePath('/workspace/src');
      vi.mocked(mockConfig.getDirectoryName).mockReturnValue('tests');

      const result = helper.createDirectoryIfNotExists(inputPath);

      expect(result).toBe(normalizePath('/workspace/src/tests'));
      expect(mockConfig.getDirectoryName).toHaveBeenCalled();
      // Don't test mkdirp directly since it's mocked - just ensure the method returns the correct path
    });
  });

  describe('getRelativePath', () => {
    it('should return relative path from base directory', () => {
      vi.mocked(mockSourceFile.getBaseDirectoryPath).mockReturnValue(
        normalizePath('/workspace'),
      );
      const filePath = normalizePath('/workspace/src/tests/Button.test.ts');

      const result = helper.getRelativePath(filePath);

      expect(result).toBe(path.join('src', 'tests', 'Button.test.ts'));
    });
  });

  describe('writeContentToFile', () => {
    it('should write content to file with template processing', async () => {
      const filePath = normalizePath('/workspace/src/tests/Button.test.ts');
      const template: Template = ['test template content'];

      vi.spyOn(helper, 'getTemplate').mockResolvedValue(template);

      const result = await helper.writeContentToFile(filePath, template);

      expect(helper.getTemplate).toHaveBeenCalledWith(template);
      expect(
        mockTemplateManager.TemplateManager.replacePlaceHolders,
      ).toHaveBeenCalledWith(mockSourceFile, filePath, template);
      expect(mockVariableResolver.resolveVariables).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        filePath,
        'resolved content',
        expect.any(Function),
      );
      expect(result).toBe(true);
    });

    it('should handle empty template', async () => {
      const filePath = normalizePath('/workspace/src/tests/Button.test.ts');

      vi.spyOn(helper, 'getTemplate').mockResolvedValue(['']);

      const result = await helper.writeContentToFile(filePath);

      expect(
        mockTemplateManager.TemplateManager.replacePlaceHolders,
      ).toHaveBeenCalledWith(mockSourceFile, filePath, ['']);
      expect(result).toBe(true);
    });

    it('should handle no template content', async () => {
      const filePath = normalizePath('/workspace/src/tests/Button.test.ts');

      vi.spyOn(helper, 'getTemplate').mockResolvedValue([]);

      const result = await helper.writeContentToFile(filePath);

      expect(
        mockTemplateManager.TemplateManager.replacePlaceHolders,
      ).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('should return empty string for empty array template', async () => {
      const template: Template = [];

      const result = await helper.getTemplate(template);

      expect(result).toEqual(['']);
    });

    it('should return template array when provided', async () => {
      const template: Template = ['line1', 'line2', 'line3'];

      const result = await helper.getTemplate(template);

      expect(result).toEqual(template);
    });

    it('should return empty string when no template provided', async () => {
      const result = await helper.getTemplate();

      expect(result).toEqual(['']);
    });

    it('should return empty string for non-array template', async () => {
      const template = 'string template' as any;

      const result = await helper.getTemplate(template);

      expect(result).toEqual(['']);
    });
  });
});

/* eslint-disable no-template-curly-in-string */
import type { SourceFile } from '../../src/source-file';
import type { IConfiguration, NewFileTask } from '../../src/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Configuration } from '../../src/config/Configuration';
import { DefaultLocationForNewFiles } from '../../src/constants';

// Mock dependencies
vi.mock('../../src/utils/variable-resolver.js', () => ({
  resolveVariables: vi.fn((config, rootDir, dirName) =>
    dirName.replace('${rootDir}', rootDir),
  ),
}));

vi.mock('path', () => ({
  default: {
    sep: process.platform === 'win32' ? '\\' : '/',
  },
}));

describe('configuration', () => {
  let mockConfig: IConfiguration;
  let mockTask: NewFileTask;
  let mockSourceFile: SourceFile;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = {
      defaultLocationForFiles: DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
      directoryName: 'test-dir',
      customFilesLocation: '/custom/location',
      shouldSwitchToFile: true,
      sourceDir: 'src',
      supportedExtension: ['.ts', '.js'],
      tasks: [],
      configs: [],
      directorySuffix: '__tests__',
      ignoreDirectories: false,
      filesSuffix: '.test',
      fileSuffixType: 'extend extension',
      template: ['template1', 'template2'],
      rootFilenameOrExtension: 'index.ts',
      rootDirName: 'components',
    };

    mockTask = {
      label: 'test-task',
      command: 'test',
      args: [],
      useForwardSlash: true,
      default: true,
      shouldSwitchToFile: true,
      terminalInstanceType: 'new',
      runTaskOnFileCreation: true,
      description: 'Test task',
      userInputPrompt: [],
    };

    mockSourceFile = {
      getExtension: vi.fn().mockReturnValue('.ts'),
    } as any;
  });

  describe('constructor', () => {
    it('should create configuration with default values', () => {
      const config = new Configuration(mockConfig);

      expect(config.getDirectoryName()).toBe('test-dir');
      expect(config.getSourceDir()).toBe('src');
      expect(config.shouldSwitchToFile()).toBe(true);
    });

    it('should create configuration with task', () => {
      const config = new Configuration(mockConfig, mockTask);

      expect(config.getTask()).toEqual(
        expect.objectContaining({
          label: 'test-task',
          command: 'test',
        }),
      );
    });

    it('should merge default configuration with provided config', () => {
      const partialConfig: Partial<IConfiguration> = {
        directoryName: 'partial-dir',
        shouldSwitchToFile: false,
      };

      const config = new Configuration(partialConfig as IConfiguration);

      expect(config.getDirectoryName()).toBe('partial-dir');
      expect(config.shouldSwitchToFile()).toBe(false);
      expect(config.getSourceDir()).toBe('src'); // Default value
    });
  });

  describe('getter methods', () => {
    let config: Configuration;

    beforeEach(() => {
      config = new Configuration(mockConfig);
    });

    it('should return ignore directories setting', () => {
      expect(config.ignoreDirectories).toBe(false);
    });

    it('should return template', () => {
      expect(config.getTemplate()).toEqual(['template1', 'template2']);
    });

    it('should return tasks', () => {
      mockConfig.tasks = [mockTask];
      config = new Configuration(mockConfig);

      expect(config.getTasks()).toEqual([mockTask]);
    });

    it('should return root filename or extension', () => {
      expect(config.getRootByFilenameOrExtension()).toBe('index.ts');
    });

    it('should return default location for new files', () => {
      expect(config.getDefaultLocationForNewFiles()).toBe(
        DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
      );
    });

    it('should return custom location for new files', () => {
      expect(config.getCustomLocationForNewFiles()).toBe('/custom/location');
    });

    it('should return directory name', () => {
      expect(config.getDirectoryName()).toBe('test-dir');
    });

    it('should return configs', () => {
      expect(config.getConfigs()).toEqual([]);
    });

    it('should return new files suffix', () => {
      expect(config.getNewFilesSuffix()).toBe('.test');
    });

    it('should return directory suffix', () => {
      expect(config.getDirectorySuffix()).toBe('__tests__');
    });

    it('should return file suffix type', () => {
      expect(config.getFileSuffixType()).toBe('extend extension');
    });

    it('should return source directory', () => {
      expect(config.getSourceDir()).toBe('src');
    });

    it('should return supported extensions', () => {
      expect(config.getSupportedExtension()).toEqual(['.ts', '.js']);
    });
  });

  describe('getRootDirName', () => {
    let config: Configuration;

    beforeEach(() => {
      config = new Configuration(mockConfig);
    });

    it('should return root dir when it already ends with suffix', () => {
      const result = config.getRootDirName('/workspace/test__tests__');
      expect(result).toBe('/workspace/test__tests__');
    });

    it('should use rootDirName when specified', async () => {
      const { resolveVariables } = await import('../../src/utils/variable-resolver.js');
      vi.mocked(resolveVariables).mockReturnValue('resolved-dir');

      const result = config.getRootDirName('/workspace/test');
      expect(result).toBe('resolved-dir__tests__');
    });

    it('should use last directory name when no rootDirName specified', () => {
      mockConfig.rootDirName = undefined;
      config = new Configuration(mockConfig);

      const result = config.getRootDirName('/workspace/project/test');
      // On Windows, it may return the full path if path.sep handling differs
      expect(result.endsWith('test__tests__')).toBe(true);
    });
  });

  describe('isValidExtension', () => {
    let config: Configuration;

    beforeEach(() => {
      config = new Configuration(mockConfig);
    });

    it('should return true for supported extension', () => {
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('.ts');

      expect(config.isValidExtension(mockSourceFile)).toBe(true);
    });

    it('should return false for unsupported extension', () => {
      vi.mocked(mockSourceFile.getExtension).mockReturnValue('.py');

      expect(config.isValidExtension(mockSourceFile)).toBe(false);
    });
  });

  describe('getTask', () => {
    it('should return task when provided in constructor', () => {
      const config = new Configuration(mockConfig, mockTask);

      const result = config.getTask();
      expect(result).toEqual(
        expect.objectContaining({
          label: 'test-task',
          useForwardSlash: true,
          shouldSwitchToFile: true,
          runTaskOnFileCreation: true,
          terminalInstanceType: 'new',
        }),
      );
    });

    it('should return default task when no task provided', () => {
      const defaultTask = { ...mockTask, default: true };
      mockConfig.tasks = [defaultTask];
      const config = new Configuration(mockConfig);

      const result = config.getTask();
      expect(result).toEqual(
        expect.objectContaining({
          label: 'test-task',
          default: true,
        }),
      );
    });

    it('should return undefined when no task and no default task', () => {
      const config = new Configuration(mockConfig);

      expect(config.getTask()).toBeUndefined();
    });

    it('should set default values for undefined task properties', () => {
      const incompleteTask: Partial<NewFileTask> = {
        label: 'incomplete',
        command: 'test',
        description: 'test',
        default: true,
      };
      mockConfig.tasks = [incompleteTask as NewFileTask];
      const config = new Configuration(mockConfig);

      const result = config.getTask();
      expect(result).toEqual(
        expect.objectContaining({
          useForwardSlash: true,
          shouldSwitchToFile: true,
          runTaskOnFileCreation: true,
          terminalInstanceType: 'label',
        }),
      );
    });

    it('should not override explicitly set task properties', () => {
      const explicitTask: NewFileTask = {
        ...mockTask,
        useForwardSlash: false,
        shouldSwitchToFile: false,
        runTaskOnFileCreation: false,
        terminalInstanceType: 'command',
        default: true,
      };
      mockConfig.tasks = [explicitTask];
      const config = new Configuration(mockConfig);

      const result = config.getTask();
      expect(result).toEqual(
        expect.objectContaining({
          useForwardSlash: false,
          shouldSwitchToFile: false,
          runTaskOnFileCreation: false,
          terminalInstanceType: 'command',
        }),
      );
    });
  });
});

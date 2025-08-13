/* eslint-disable no-template-curly-in-string */
import type { Configuration } from '../../src/config/Configuration';
import type { SourceFile } from '../../src/source-file';
import type { NewFileTask } from '../../src/types';
import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { createCommand } from '../../src/utils/create-command';

// Mock dependencies
vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [
      {
        name: 'test-workspace',
        uri: { fsPath: '/workspace' },
      },
    ],
    getWorkspaceFolder: vi.fn(),
    rootPath: '/workspace',
  },
  Uri: {
    file: vi.fn((path) => ({ fsPath: path })),
  },
  window: {
    showQuickPick: vi.fn(),
    showErrorMessage: vi.fn(),
  },
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('../../src/utils/variable-resolver.js', () => ({
  VariableResolverService: class {
    constructor(workspaceFolders: any, sourceFilePath: string) {
      this.sourceFilePath = sourceFilePath;
    }

    resolve(workspaceFolder: any, command: string) {
      // Mock variable resolution
      return command
        .replace('${workspaceFolder}', '/workspace')
        .replace('${file}', this.sourceFilePath)
        .replace('${fileBasename}', 'test.ts');
    }

    private sourceFilePath: string;
  },
  resolveVariables: vi.fn((configs, filePath, command) =>
    command.replace('${outputFilePath}', filePath),
  ),
}));

describe('create-command', () => {
  let mockSourceFile: SourceFile;
  let mockNewSourceFile: SourceFile;
  let mockConfig: Configuration;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSourceFile = {
      getAbsolutePath: vi.fn().mockReturnValue('/workspace/src/component.ts'),
      getBaseDirectoryPath: vi.fn().mockReturnValue('/workspace/src'),
    } as any;

    mockNewSourceFile = {
      getAbsolutePath: vi.fn().mockReturnValue('/workspace/src/component.test.ts'),
    } as any;

    mockConfig = {
      getTask: vi.fn(),
    } as any;

    vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
      name: 'test-workspace',
      uri: { fsPath: '/workspace' },
    } as any);
  });

  const createMockTask = (overrides: Partial<NewFileTask> = {}): NewFileTask => ({
    label: 'test',
    command: 'echo',
    args: [],
    useForwardSlash: false,
    default: false,
    shouldSwitchToFile: false,
    terminalInstanceType: 'new',
    runTaskOnFileCreation: true,
    description: 'Test task',
    userInputPrompt: [],
    ...overrides,
  });

  describe('createCommand', () => {
    it('should return undefined when no task is provided', async () => {
      vi.mocked(mockConfig.getTask).mockReturnValue(undefined);

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toBeUndefined();
    });

    it('should create simple command without args', async () => {
      const task = createMockTask({
        command: 'echo',
        args: undefined,
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toContain('echo');
    });

    it('should create command with static args', async () => {
      const task = createMockTask({
        command: 'test',
        args: ['--verbose', '--watch'],
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toContain('test --verbose --watch');
    });

    it('should handle user input prompts with array of arrays', async () => {
      const task = createMockTask({
        command: 'test',
        args: [],
        userInputPrompt: [
          [
            { label: 'option1', description: 'First option' },
            { label: 'option2', description: 'Second option' },
          ],
        ],
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);
      vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
        label: 'option1',
        description: 'First option',
      });

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toContain('option1');
    });

    it('should handle user input prompts with single array', async () => {
      const task = createMockTask({
        command: 'test',
        args: [],
        userInputPrompt: [{ label: 'single-option', description: 'Single option' }],
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);
      vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
        label: 'single-option',
        description: 'Single option',
      });

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toContain('single-option');
    });

    it('should skip args when user selects "none" option', async () => {
      const task = createMockTask({
        command: 'test',
        args: [],
        userInputPrompt: [[{ label: 'option1', description: 'First option' }]],
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);
      vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
        label: 'none',
        description: '- no option will be passed to the arguments',
      });

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toBe('test');
    });

    it('should filter args based on path existence', async () => {
      const task = createMockTask({
        command: 'test',
        args: ['--config=./jest.config.js', '--normal-arg'],
        checkIfArgPathExist: ['--config'],
        showMessageIfPathNotExist: false,
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);
      vi.mocked(fs.existsSync).mockImplementation((path) =>
        path.toString().includes('jest.config.js'),
      );

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toContain('--config=./jest.config.js');
      expect(result).toContain('--normal-arg');
    });

    it('should show error message when path does not exist and showMessageIfPathNotExist is true', async () => {
      const task = createMockTask({
        command: 'test',
        args: ['--config=./missing.config.js'],
        checkIfArgPathExist: ['--config'],
        showMessageIfPathNotExist: true,
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Unable to locate --config=./missing.config.js',
      );
    });

    it('should convert backslashes to forward slashes when useForwardSlash is true', async () => {
      const task = createMockTask({
        command: 'test',
        args: ['C:\\Windows\\path\\file.txt'],
        useForwardSlash: true,
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);

      // Mock variable resolver to return path with backslashes
      const { resolveVariables } = await import('../../src/utils/variable-resolver.js');
      vi.mocked(resolveVariables).mockReturnValue('test C:\\Windows\\path\\file.txt');

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toContain('C:/Windows/path/file.txt');
    });

    it('should handle user cancelling quick pick', async () => {
      const task = createMockTask({
        command: 'test',
        args: [],
        userInputPrompt: [{ label: 'option1', description: 'First option' }],
      });
      vi.mocked(mockConfig.getTask).mockReturnValue(task);
      vi.mocked(vscode.window.showQuickPick).mockResolvedValue(undefined);

      // Clear the mock to avoid interference from previous test
      const { resolveVariables } = await import('../../src/utils/variable-resolver.js');
      vi.mocked(resolveVariables).mockReturnValue('test');

      const result = await createCommand(mockSourceFile, mockNewSourceFile, mockConfig);
      expect(result).toBe('test');
    });
  });
});

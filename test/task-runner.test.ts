import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskRunner } from '../src/task-runner';

// Mock all dependencies
vi.mock('vscode', () => ({
  workspace: {
    rootPath: '/workspace',
  },
  window: {
    activeTextEditor: {
      document: {
        fileName: '/workspace/src/component.ts',
      },
    },
    showErrorMessage: vi.fn(),
    createTerminal: vi.fn(),
    onDidCloseTerminal: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  },
  commands: {
    executeCommand: vi.fn(),
  },
  Uri: {
    file: vi.fn((path) => ({ fsPath: path })),
  },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
  },
}));

vi.mock('../src/config/configuration-manager.js', () => ({
  ConfigurationManager: {
    getConfiguration: vi.fn(),
  },
}));

vi.mock('../src/creation-helper.js', () => ({
  CreationHelper: vi.fn().mockImplementation(() => ({
    createFile: vi.fn(),
  })),
}));

vi.mock('../src/source-file.js', () => ({
  SourceFile: vi.fn().mockImplementation(() => ({
    getAbsolutePath: vi.fn().mockReturnValue('/workspace/src/component.ts'),
    getDirectoryPath: vi.fn().mockReturnValue('/workspace/src'),
  })),
}));

vi.mock('../src/new-file-helper.js', () => ({
  NewFileHelper: vi.fn().mockImplementation(() => ({
    getFileAbsolutePath: vi.fn().mockReturnValue('/workspace/src/component.test.ts'),
    getSourceFile: vi.fn().mockReturnValue({
      getAbsolutePath: vi.fn().mockReturnValue('/workspace/src/component.test.ts'),
      getDirectoryPath: vi.fn().mockReturnValue('/workspace/src'),
    }),
    getParentSourceFile: vi.fn().mockReturnValue({
      getAbsolutePath: vi.fn().mockReturnValue('/workspace/src/component.ts'),
      getDirectoryPath: vi.fn().mockReturnValue('/workspace/src'),
    }),
  })),
}));

vi.mock('../src/utils/index.js', () => ({
  createCommand: vi.fn().mockResolvedValue('npm test'),
  switchToFile: vi.fn(),
  isSupportExtension: vi.fn().mockReturnValue(true),
}));

describe('taskRunner', () => {
  let taskRunner: TaskRunner;
  let mockTerminal: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockTerminal = {
      show: vi.fn(),
      sendText: vi.fn(),
      name: 'test-terminal',
      processId: Promise.resolve(123),
      hide: vi.fn(),
      dispose: vi.fn(),
    };

    const vscode = await import('vscode');
    vi.mocked(vscode.window.createTerminal).mockReturnValue(mockTerminal);

    taskRunner = new TaskRunner();
  });

  describe('constructor', () => {
    it('should set up terminal close listener', async () => {
      const vscode = await import('vscode');
      expect(vscode.window.onDidCloseTerminal).toHaveBeenCalled();
    });
  });

  describe('runTerminalCommand', () => {
    it('should create and show terminal with command', async () => {
      const vscode = await import('vscode');

      await taskRunner.runTerminalCommand('npm test', 'new', 'args', 'Test Terminal');

      expect(vscode.window.createTerminal).toHaveBeenCalledWith({
        name: 'Test Terminal',
        cwd: undefined,
      });
      expect(mockTerminal.show).toHaveBeenCalledWith(true);
      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'workbench.action.terminal.clear',
      );
      expect(mockTerminal.sendText).toHaveBeenCalledWith('npm test');
    });

    it('should create terminal with cwd when provided', async () => {
      const vscode = await import('vscode');

      await taskRunner.runTerminalCommand(
        'npm test',
        'new',
        'args',
        'Test Terminal',
        '/workspace/src',
      );

      expect(vscode.window.createTerminal).toHaveBeenCalledWith({
        name: 'Test Terminal',
        cwd: '/workspace/src',
      });
    });
  });

  describe('clean', () => {
    it('should clear all terminals', () => {
      expect(() => taskRunner.clean()).not.toThrow();
    });
  });

  describe('run', () => {
    it('should return early if no workspace path', async () => {
      const vscode = await import('vscode');
      const { ConfigurationManager } = await import(
        '../src/config/configuration-manager.js'
      );
      // @ts-ignore
      vscode.workspace.rootPath = undefined;

      await taskRunner.run({ fsPath: '/test' } as any);

      expect(ConfigurationManager.getConfiguration).not.toHaveBeenCalled();
    });

    it('should return early if no configuration', async () => {
      const vscode = await import('vscode');
      const { ConfigurationManager } = await import(
        '../src/config/configuration-manager.js'
      );
      const { SourceFile } = await import('../src/source-file.js');
      // @ts-ignore
      vscode.workspace.rootPath = '/workspace';
      vi.mocked(ConfigurationManager.getConfiguration).mockResolvedValue(undefined);

      await taskRunner.run({ fsPath: '/test' } as any);

      expect(SourceFile).not.toHaveBeenCalled();
    });

    it('should show error for unsupported extension', async () => {
      const vscode = await import('vscode');
      const { ConfigurationManager } = await import(
        '../src/config/configuration-manager.js'
      );
      const { isSupportExtension } = await import('../src/utils/index.js');

      const mockConfig = {
        isValidExtension: vi.fn().mockReturnValue(true),
      };
      // @ts-ignore
      vscode.workspace.rootPath = '/workspace';
      vi.mocked(ConfigurationManager.getConfiguration).mockResolvedValue(
        mockConfig as any,
      );
      vi.mocked(isSupportExtension).mockReturnValue(false);

      await taskRunner.run({ fsPath: '/test' } as any);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        "File extension not supported, to support the extension add an entry to 'fileGenTaskRunner.configs' and set 'supportedExtension' property.",
      );
    });

    it('should show error for invalid extension', async () => {
      const vscode = await import('vscode');
      const { ConfigurationManager } = await import(
        '../src/config/configuration-manager.js'
      );
      const { isSupportExtension } = await import('../src/utils/index.js');

      const mockConfig = {
        isValidExtension: vi.fn().mockReturnValue(false),
      };
      // @ts-ignore
      vscode.workspace.rootPath = '/workspace';
      vi.mocked(ConfigurationManager.getConfiguration).mockResolvedValue(
        mockConfig as any,
      );
      vi.mocked(isSupportExtension).mockReturnValue(true);

      await taskRunner.run({ fsPath: '/test' } as any);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Invalid file extension!',
      );
    });
  });
});

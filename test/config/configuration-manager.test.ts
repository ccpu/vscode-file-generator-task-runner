import type { IConfiguration, NewFileTask } from '../../src/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { Configuration } from '../../src/config/Configuration';
import { ConfigurationManager } from '../../src/config/configuration-manager';
import { DefaultLocationForNewFiles } from '../../src/constants';

// Mock vscode
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(),
  },
  window: {
    showErrorMessage: vi.fn(),
    showQuickPick: vi.fn(),
  },
  Uri: class MockUri {
    constructor(
      public scheme: string,
      public authority: string,
      public path: string,
    ) {}

    static file(path: string) {
      return new MockUri('file', '', path);
    }
  },
}));

// Mock Configuration class
vi.mock('../../src/config/Configuration.js', () => ({
  Configuration: vi.fn(),
}));

describe('configurationManager', () => {
  let mockWorkspaceConfiguration: any;
  let mockConfigs: IConfiguration[];
  let mockTask: NewFileTask;
  let mockUri: vscode.Uri;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTask = {
      label: 'test-task',
      command: 'npm test',
      args: [],
      useForwardSlash: true,
      default: false,
      shouldSwitchToFile: true,
      terminalInstanceType: 'new',
      runTaskOnFileCreation: true,
      description: 'Test task',
      userInputPrompt: [],
    };

    mockConfigs = [
      {
        label: 'React Component',
        description: 'Create React component',
        defaultLocationForFiles: DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
        directoryName: 'components',
        customFilesLocation: '',
        shouldSwitchToFile: true,
        sourceDir: 'src',
        supportedExtension: ['.tsx', '.ts'],
        tasks: [mockTask],
        configs: [],
        directorySuffix: '',
        ignoreDirectories: false,
      },
      {
        label: 'Test File',
        description: 'Create test file',
        defaultLocationForFiles: DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
        directoryName: '__tests__',
        customFilesLocation: '',
        shouldSwitchToFile: true,
        sourceDir: 'src',
        supportedExtension: ['.test.ts'],
        tasks: [
          {
            ...mockTask,
            label: 'jest-test',
            command: 'npm run test',
          },
        ],
        configs: [],
        directorySuffix: '',
        ignoreDirectories: false,
      },
    ];

    mockWorkspaceConfiguration = {
      get: vi.fn().mockReturnValue(mockConfigs),
    };

    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(
      mockWorkspaceConfiguration,
    );
    vi.mocked(Configuration).mockImplementation(
      () => ({ mockConfiguration: true }) as any,
    );

    mockUri = vscode.Uri.file('/workspace/src/component.tsx') as any;
  });

  describe('getConfiguration', () => {
    it('should return undefined when no configs found', async () => {
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue(undefined);

      await ConfigurationManager.getConfiguration(mockUri);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        "Unable to get configurations, make sure to have an entry in 'fileGenTaskRunner.configs'.",
      );
    });

    it('should return undefined when empty configs array', async () => {
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue([]);

      const result = await ConfigurationManager.getConfiguration(mockUri);

      expect(result).toBeUndefined();
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        "Unable to get configurations, make sure to have an entry in 'fileGenTaskRunner.configs'.",
      );
    });

    it('should show config quick pick when Uri instance provided', async () => {
      // Create config with multiple tasks to ensure task pick shows
      const multiTaskConfig = [
        {
          ...mockConfigs[0],
          tasks: [mockTask, { ...mockTask, label: 'second-task' }],
        },
      ];
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue(multiTaskConfig);
      vi.mocked(vscode.window.showQuickPick)
        .mockResolvedValueOnce({
          label: 'React Component',
          description: 'Create React component',
        })
        .mockResolvedValueOnce({
          label: 'test-task',
          description: 'Test task',
        });

      await ConfigurationManager.getConfiguration(mockUri);

      expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(2);
      expect(vscode.window.showQuickPick).toHaveBeenCalledWith([
        { label: 'React Component', description: 'Create React component' },
      ]);
      expect(Configuration).toHaveBeenCalledWith(multiTaskConfig[0], mockTask);
    });

    it('should handle user cancelling config quick pick', async () => {
      vi.mocked(vscode.window.showQuickPick).mockResolvedValue(undefined);

      const result = await ConfigurationManager.getConfiguration(mockUri);

      expect(result).toBeUndefined();
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        "Unable to find configurations, make sure to have a valid 'fileGenTaskRunner.configs' settings.",
      );
    });

    it('should find config by task label when string provided', async () => {
      await ConfigurationManager.getConfiguration('test-task' as any);

      expect(Configuration).toHaveBeenCalledWith(mockConfigs[0], mockTask);
    });

    it('should find config by config label when string provided', async () => {
      await ConfigurationManager.getConfiguration('React Component' as any);

      expect(Configuration).toHaveBeenCalledWith(mockConfigs[0], undefined);
    });

    it('should handle non-string non-Uri args by converting to string', async () => {
      const numberArg = 123;
      await ConfigurationManager.getConfiguration(numberArg as any);

      // Should try to find by label "123" which won't exist, so config should be undefined
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        "Unable to find configurations, make sure to have a valid 'fileGenTaskRunner.configs' settings.",
      );
    });

    it('should return config without task when task label not found', async () => {
      await ConfigurationManager.getConfiguration('nonexistent-task' as any);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        "Unable to find configurations, make sure to have a valid 'fileGenTaskRunner.configs' settings.",
      );
    });

    it('should handle single task config without showing task quick pick', async () => {
      const singleTaskConfig = [
        {
          ...mockConfigs[0],
          tasks: [mockTask],
        },
      ];
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue(singleTaskConfig);
      vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
        label: 'React Component',
        description: 'Create React component',
      });

      await ConfigurationManager.getConfiguration(mockUri);

      expect(vscode.window.showQuickPick).toHaveBeenCalledTimes(1); // Only config pick, not task pick
      expect(Configuration).toHaveBeenCalledWith(singleTaskConfig[0], mockTask);
    });

    it('should handle config with no tasks', async () => {
      const noTaskConfig = [
        {
          ...mockConfigs[0],
          tasks: [],
        },
      ];
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue(noTaskConfig);
      vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
        label: 'React Component',
        description: 'Create React component',
      });

      await ConfigurationManager.getConfiguration(mockUri);

      expect(Configuration).toHaveBeenCalledWith(noTaskConfig[0], undefined);
    });

    it('should handle user cancelling task quick pick', async () => {
      // Create config with multiple tasks so task pick is shown
      const multiTaskConfig = [
        {
          ...mockConfigs[0],
          tasks: [mockTask, { ...mockTask, label: 'second-task' }],
        },
      ];
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue(multiTaskConfig);
      vi.mocked(vscode.window.showQuickPick)
        .mockResolvedValueOnce({
          label: 'React Component',
          description: 'Create React component',
        })
        .mockResolvedValueOnce(undefined); // User cancels task selection

      await ConfigurationManager.getConfiguration(mockUri);

      expect(Configuration).toHaveBeenCalledWith(multiTaskConfig[0], undefined);
    });

    it('should get workspace configuration with correct key', async () => {
      await ConfigurationManager.getConfiguration(mockUri);

      expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('fileGenTaskRunner');
      expect(mockWorkspaceConfiguration.get).toHaveBeenCalledWith('configs');
    });
  });
});

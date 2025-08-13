/* eslint-disable no-template-curly-in-string */
import type { Configuration } from '../../src/config/Configuration';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
  resolveVariables,
  VariableResolverService,
} from '../../src/utils/variable-resolver';

// Mock vscode
vi.mock('vscode', () => ({
  workspace: {
    getWorkspaceFolder: vi.fn(),
    workspaceFolders: [
      {
        name: 'test-workspace',
        uri: { fsPath: '/workspace' },
      },
    ],
    rootPath: '/workspace',
  },
  Uri: {
    file: vi.fn((path) => ({ fsPath: path })),
  },
}));

// Mock the abstract variable resolver
vi.mock('../../src/vs/variableResolver', () => ({
  AbstractVariableResolverService: class {
    constructor(context: any) {
      this.context = context;
    }

    resolve(workspaceFolder: any, command: string) {
      // Mock resolve implementation - just return the command with some basic variable resolution
      return command
        .replace('${file}', this.context.getFilePath?.() || '')
        .replace('${workspaceFolder}', workspaceFolder?.uri?.fsPath || '')
        .replace('${fileBasename}', 'test-file.ts')
        .replace('${fileBasenameNoExtension}', 'test-file')
        .replace('${fileDirname}', '/workspace/src')
        .replace('${fileExtname}', '.ts')
        .replace('${relativeFile}', 'src/test-file.ts')
        .replace('${relativeFileDirname}', 'src');
    }

    private context: any;
  },
}));

describe('variable-resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('variableResolverService', () => {
    it('should create service with workspace folders and source file path', () => {
      const folders = [
        { name: 'workspace1', uri: { fsPath: '/workspace1' } },
        { name: 'workspace2', uri: { fsPath: '/workspace2' } },
      ] as vscode.WorkspaceFolder[];

      const service = new VariableResolverService(folders, '/workspace1/src/file.ts');
      expect(service).toBeDefined();
    });

    it('should resolve variables using provided context', () => {
      const folders = [
        { name: 'test-workspace', uri: { fsPath: '/workspace' } },
      ] as vscode.WorkspaceFolder[];

      const service = new VariableResolverService(folders, '/workspace/src/test.ts');
      const result = service.resolve(undefined, '${file}');
      expect(result).toBe('/workspace/src/test.ts');
    });
  });

  describe('resolveVariables', () => {
    let mockConfig: Configuration;

    beforeEach(() => {
      mockConfig = {
        getDirectorySuffix: vi.fn().mockReturnValue(''),
      } as any;

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue({
        name: 'test-workspace',
        uri: { fsPath: '/workspace' },
      } as any);
    });

    const variableTestCases = [
      {
        description: 'should replace outputFilePath variable',
        command: '${outputFilePath}',
        expected: '/workspace/src/test.ts',
        mockSetup: () => {},
      },
      {
        description: 'should replace relativeFilePath variable',
        command: '${relativeFilePath}',
        expected: 'src/test-file.ts',
        mockSetup: () => {},
      },
      {
        description: 'should replace fileDirPath variable',
        command: '${fileDirPath}',
        expected: '/workspace/src',
        mockSetup: () => {},
      },
      {
        description: 'should replace fileExtension variable',
        command: '${fileExtension}',
        expected: '.ts',
        mockSetup: () => {},
      },
      {
        description: 'should replace fileNameWithExt variable',
        command: '${fileNameWithExt}',
        expected: 'test-file.ts',
        mockSetup: () => {},
      },
      {
        description: 'should replace fileNameWithoutExt variable',
        command: '${fileNameWithoutExt}',
        expected: 'test-file',
        mockSetup: () => {},
      },
      {
        description: 'should replace relativeFileDir variable',
        command: '${relativeFileDir}',
        expected: 'src',
        mockSetup: () => {},
      },
      {
        description: 'should replace workspaceToFileDir variable',
        command: '${workspaceToFileDir}',
        expected: 'src',
        mockSetup: () => {},
      },
      {
        description: 'should replace rootDirNam variable',
        command: '${rootDirNam}',
        expected: 'project',
        mockSetup: () => {},
      },
      {
        description: 'should replace rootDirPath variable',
        command: '${rootDirPath}',
        expected: '/workspace/project',
        mockSetup: () => {},
      },
      {
        description: 'should replace filePathFromRoot variable',
        command: '${filePathFromRoot}',
        expected: 'src/test.ts',
        mockSetup: () => {},
      },
      {
        description: 'should replace fileDirPathFromRoot variable',
        command: '${fileDirPathFromRoot}',
        expected: 'src',
        mockSetup: () => {},
      },
      {
        description: 'should replace relativeRootDirPath variable',
        command: '${relativeRootDirPath}',
        expected: 'project',
        mockSetup: () => {},
      },
    ];

    describe.each(variableTestCases)(
      '$description',
      ({ command, expected, mockSetup }) => {
        it('resolves correctly', () => {
          mockSetup();

          const result = resolveVariables(
            mockConfig,
            '/workspace/src/test.ts',
            command,
            '/workspace/project',
          );

          // Normalize path separators for cross-platform compatibility
          const normalize = (str: string) => str.replace(/\\/gu, '/');
          expect(normalize(result)).toContain(normalize(expected));
        });
      },
    );

    it('should handle command without variables', () => {
      const command = 'echo hello world';

      const result = resolveVariables(
        mockConfig,
        '/workspace/src/test.ts',
        command,
        '/workspace',
      );

      expect(result).toBe('echo hello world');
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { getCurrentWorkspacePath, toIWorkspaceFolder } from '../../src/utils/workspace';

// Mock vscode module
vi.mock('vscode', () => ({
  workspace: {
    getWorkspaceFolder: vi.fn(),
  },
  window: {
    activeTextEditor: {
      document: {
        uri: {
          fsPath: '/workspace/active-file.ts',
        },
      },
    },
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
}));

describe('workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentWorkspacePath', () => {
    it('should return workspace path for provided URI', () => {
      const mockUri = { fsPath: '/project/src/file.ts' };
      const mockWorkspaceFolder = {
        uri: {
          fsPath: '/project',
        },
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(
        mockWorkspaceFolder as any,
      );

      const result = getCurrentWorkspacePath(mockUri as any);
      expect(result).toBe('/project');
      expect(vscode.workspace.getWorkspaceFolder).toHaveBeenCalledWith(mockUri);
    });

    it('should return workspace path from active editor when no URI provided', () => {
      const mockWorkspaceFolder = {
        uri: {
          fsPath: '/workspace',
        },
      };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(
        mockWorkspaceFolder as any,
      );

      const result = getCurrentWorkspacePath();
      expect(result).toBe('/workspace');
      expect(vscode.workspace.getWorkspaceFolder).toHaveBeenCalledWith(
        vscode.window.activeTextEditor?.document.uri,
      );
    });

    it('should return undefined when no URI and no active editor', () => {
      // Mock no active editor
      const originalActiveTextEditor = vscode.window.activeTextEditor;
      vi.mocked(vscode.window).activeTextEditor = undefined;

      const result = getCurrentWorkspacePath();
      expect(result).toBeUndefined();

      // Restore active editor
      vi.mocked(vscode.window).activeTextEditor = originalActiveTextEditor;
    });

    it('should return undefined when no workspace folder found', () => {
      const mockUri = { fsPath: '/project/src/file.ts' };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(undefined);

      const result = getCurrentWorkspacePath(mockUri as any);
      expect(result).toBeUndefined();
      expect(vscode.workspace.getWorkspaceFolder).toHaveBeenCalledWith(mockUri);
    });

    it('should handle null workspace folder', () => {
      const mockUri = { fsPath: '/project/src/file.ts' };

      vi.mocked(vscode.workspace.getWorkspaceFolder).mockReturnValue(null as any);

      const result = getCurrentWorkspacePath(mockUri as any);
      expect(result).toBeUndefined();
    });
  });

  describe('toIWorkspaceFolder', () => {
    it('returns undefined if input is undefined', () => {
      expect(toIWorkspaceFolder(undefined)).toBeUndefined();
    });

    it('converts VSCode WorkspaceFolder to IWorkspaceFolder', () => {
      const mockWorkspaceFolder = {
        uri: {
          path: '/root/project',
          fsPath: '/root/project',
          with(opts: { path: string }) {
            return { ...this, path: opts.path };
          },
        },
        name: 'project',
        index: 0,
      };
      const result = toIWorkspaceFolder(mockWorkspaceFolder as any);
      expect(result).toBeDefined();
      expect(result?.uri).toEqual(mockWorkspaceFolder.uri);
      expect(result?.name).toBe('project');
      expect(result?.index).toBe(0);
      expect(typeof result?.toResource).toBe('function');
      // toResource should append relativePath
      expect(result?.toResource('src').path).toBe('/root/project/src');
    });
  });
});

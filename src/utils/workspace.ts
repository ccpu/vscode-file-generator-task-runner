import type { Uri } from 'vscode';
import type * as vscode from 'vscode';
import type { IWorkspaceFolder } from '../vs/platform/workspace/common/workspace';
import { window, workspace } from 'vscode';

/**
 * Converts a VS Code WorkspaceFolder to an IWorkspaceFolder compatible object.
 */
export function toIWorkspaceFolder(
  vsWorkspaceFolder: vscode.WorkspaceFolder | undefined,
): IWorkspaceFolder | undefined {
  if (!vsWorkspaceFolder) return undefined;
  return {
    uri: vsWorkspaceFolder.uri,
    name: vsWorkspaceFolder.name,
    index: vsWorkspaceFolder.index,
    toResource: (relativePath: string) =>
      vsWorkspaceFolder.uri.with({
        path: `${vsWorkspaceFolder.uri.path}/${relativePath}`,
      }),
  };
}

export function getCurrentWorkspacePath(sourceFileUri?: Uri): string | undefined {
  const uri =
    sourceFileUri || (window.activeTextEditor && window.activeTextEditor.document.uri);

  if (!uri) return undefined;

  const workspaceFolder = workspace.getWorkspaceFolder(uri);
  if (workspaceFolder) {
    return workspaceFolder.uri.fsPath;
  }

  return undefined;
}

import { Uri, workspace } from 'vscode';

/**
 * Returns the workspace root path for the given workspaceUri, or the first workspace folder if not provided.
 * @param workspaceUri Optional Uri for multi-root workspace support.
 * @returns The workspace root path as a string, or undefined if not found.
 */
export function getWorkspaceRoot(workspaceUri?: Uri): string | undefined {
  if (workspaceUri) {
    const folder = workspace.getWorkspaceFolder(workspaceUri);
    if (folder) {
      return folder.uri.fsPath;
    }
    if (typeof workspaceUri.fsPath === 'string' && workspaceUri.fsPath) {
      return workspaceUri.fsPath;
    }
    return undefined;
  }
  if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
    return workspace.workspaceFolders[0].uri.fsPath;
  }
  return undefined;
}

/**
 * Returns the workspace root path for the given file path, or undefined if not found.
 * @param filePath The absolute path to the file.
 * @returns The workspace root path as a string, or undefined if not found.
 */
export function getWorkspaceRootForFile(filePath: string): string | undefined {
  const folder = workspace.getWorkspaceFolder(Uri.file(filePath));
  return folder?.uri.fsPath;
}

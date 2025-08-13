import type { Uri } from 'vscode';
import fs from 'node:fs';
import path from 'node:path';
import { getWorkspaceRoot } from './get-workspace-root';

/**
 * Recursively searches upwards from a starting directory for a file, stopping at the workspace root if specified.
 * @param startDir The directory to start searching from.
 * @param fileName The file name to search for (e.g., 'package.json').
 * @param options Optional settings.
 *   @param options.breakOnWorkspace If true, do not traverse above the workspace root.
 *   @param options.workspaceUri Optionally provide the workspace Uri for multi-root support.
 * @returns The directory path containing the file, or the workspace root if not found.
 */
export function findFileDirUpwards(
  startDir: string,
  fileName: string,
  options?: { breakOnWorkspace?: boolean; workspaceUri?: Uri },
): string | undefined {
  let currentDir = path.resolve(startDir);
  let workspaceRoot: string | undefined;

  if (options?.breakOnWorkspace) {
    workspaceRoot = getWorkspaceRoot(options.workspaceUri);
  }

  while (true) {
    const candidate = path.join(currentDir, fileName);
    if (fs.existsSync(candidate)) {
      return currentDir;
    }
    if (
      options?.breakOnWorkspace &&
      workspaceRoot != null &&
      currentDir === workspaceRoot
    ) {
      // Reached workspace root, file not found
      return workspaceRoot;
    }
    if (currentDir === path.dirname(currentDir)) {
      // Reached filesystem root
      return options?.breakOnWorkspace && workspaceRoot != null
        ? workspaceRoot
        : currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
}

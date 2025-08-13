/* eslint-disable no-template-curly-in-string */
import type { Configuration } from '../config/Configuration';
import path from 'node:path';
import * as vscode from 'vscode';
import { AbstractVariableResolverService } from '../vs/variableResolver';
import { getWorkspaceRootForFile } from './get-workspace-root';
import { toIWorkspaceFolder } from './workspace';

export class VariableResolverService extends AbstractVariableResolverService {
  constructor(
    folders: vscode.WorkspaceFolder[],
    sourceFilePath: string,
    env?: Record<string, string>,
  ) {
    super(
      {
        getFolderUri: (folderName: string): vscode.Uri | undefined => {
          const found = folders.filter((f) => f.name === folderName);
          if (found.length > 0) {
            return found[0].uri;
          }
          return undefined;
        },
        getWorkspaceFolderCount: (): number => folders.length,
        getConfigurationValue: (): string | undefined => undefined,
        getExecPath: (): string | undefined => undefined,
        getFilePath: (): string | undefined => sourceFilePath,
        getSelectedText: (): string | undefined => undefined,
        getLineNumber: (): string | undefined => undefined,
      },
      env,
    );
  }
}

export function resolveVariables(
  _configs: Configuration,
  filePath: string,
  command: string,
  rootDir: string,
): string {
  const vsWorkspaceFolder = vscode.workspace.getWorkspaceFolder(
    vscode.Uri.file(vscode.workspace.rootPath!),
  );
  const workSpaceFolder = toIWorkspaceFolder(vsWorkspaceFolder);

  let resolvedCommand = command.split('${outputFilePath}').join('${file}');
  resolvedCommand = resolvedCommand.split('${relativeFilePath}').join('${relativeFile}');
  resolvedCommand = resolvedCommand
    .split('${relativeFileDir}')
    .join('${relativeFileDirname}');
  resolvedCommand = resolvedCommand.split('${fileDirPath}').join('${fileDirname}');
  resolvedCommand = resolvedCommand.split('${fileExtension}').join('${fileExtname}');
  resolvedCommand = resolvedCommand.split('${fileNameWithExt}').join('${fileBasename}');
  resolvedCommand = resolvedCommand
    .split('${fileNameWithoutExt}')
    .join('${fileBasenameNoExtension}');

  const newFileVariableResolver = new VariableResolverService(
    vscode.workspace.workspaceFolders!,
    filePath,
  );

  if (resolvedCommand.includes('${rootDirNam}')) {
    const dirName = rootDir.split(path.sep).pop();
    resolvedCommand = resolvedCommand.split('${rootDirNam}').join(dirName);
  }

  if (resolvedCommand.includes('${rootDirPath}')) {
    resolvedCommand = resolvedCommand.split('${rootDirPath}').join(rootDir);
  }

  // Handle ${filePathFromRoot}
  if (resolvedCommand.includes('${filePathFromRoot}')) {
    const relativePath = path.relative(rootDir, filePath);
    resolvedCommand = resolvedCommand.split('${filePathFromRoot}').join(relativePath);
  }

  // Handle ${fileDirPathFromRoot}
  if (resolvedCommand.includes('${fileDirPathFromRoot}')) {
    const fileDir = path.dirname(filePath);
    const relativeDir = path.relative(rootDir, fileDir);
    resolvedCommand = resolvedCommand.split('${fileDirPathFromRoot}').join(relativeDir);
  }

  if (resolvedCommand.includes('${relativeRootDirPath}')) {
    // Get workspace root directory
    const workspaceRootFolder = getWorkspaceRootForFile(filePath);

    let relativePackageDirRoot = rootDir;
    if (workspaceRootFolder != null) {
      relativePackageDirRoot = path.relative(workspaceRootFolder, rootDir);
    }
    resolvedCommand = resolvedCommand
      .split('${relativeRootDirPath}')
      .join(relativePackageDirRoot);
  }

  if (resolvedCommand.includes('${workspaceToFileDir}')) {
    const workspaceRootFolder = getWorkspaceRootForFile(filePath);
    const fileDir = path.dirname(filePath);
    let workspaceToFileDir = fileDir;
    if (workspaceRootFolder != null) {
      workspaceToFileDir = path.relative(workspaceRootFolder, fileDir);
    }
    resolvedCommand = resolvedCommand
      .split('${workspaceToFileDir}')
      .join(workspaceToFileDir);
  }

  return newFileVariableResolver.resolve(workSpaceFolder, resolvedCommand);
}

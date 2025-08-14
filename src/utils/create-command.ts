import type { Configuration } from '../config/Configuration';
import type { SourceFile } from '../source-file';
import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { resolveVariables, VariableResolverService } from './variable-resolver';
import { toIWorkspaceFolder } from './workspace';

const NONE_MESSAGE = '- no option will be passed to the arguments';

async function getQuickPromptPick(
  items: vscode.QuickPickItem[],
): Promise<vscode.QuickPickItem | undefined> {
  return vscode.window.showQuickPick(items);
}

export async function createCommand(
  sourceFile: SourceFile,
  newSourceFile: SourceFile,
  configs: Configuration,
): Promise<string | undefined> {
  let stringBuilder: string[] = [];

  const task = configs.getTask();
  if (!task) return undefined;

  const args = task.args ? [...task.args] : [];
  stringBuilder.push(task.command);

  const sourceFileVariableResolver = new VariableResolverService(
    vscode.workspace.workspaceFolders!.slice(),
    sourceFile.getAbsolutePath(),
  );

  // Convert VS Code WorkspaceFolder to expected IWorkspaceFolder
  const vsWorkspaceFolder = vscode.workspace.getWorkspaceFolder(
    vscode.Uri.file(vscode.workspace.rootPath!),
  );
  const workSpaceFolder = toIWorkspaceFolder(vsWorkspaceFolder);

  // Handle userInputPrompt logic
  if (Array.isArray(task.userInputPrompt) && task.userInputPrompt.length > 0) {
    if (Array.isArray(task.userInputPrompt[0])) {
      for (let i = 0; i < task.userInputPrompt.length; i++) {
        const items = task.userInputPrompt[i];
        const newItems = [
          {
            label: 'none',
            picked: true,
            description: NONE_MESSAGE,
          },
          ...(items as vscode.QuickPickItem[]),
        ];
        // eslint-disable-next-line no-await-in-loop
        const opt = await getQuickPromptPick(newItems);
        if (opt && opt.description !== NONE_MESSAGE) {
          args.push(opt.label);
        }
      }
    } else {
      const opt = await getQuickPromptPick(
        task.userInputPrompt as vscode.QuickPickItem[],
      );
      if (opt) {
        args.push(opt.label);
      }
    }
  }

  const filteredArgs = args.reduce((arr, arg) => {
    if (task.checkIfArgPathExist) {
      task.checkIfArgPathExist.forEach((argToCheck) => {
        if (arg.trim().startsWith(argToCheck)) {
          const keyVal = arg.split('=')[1];
          const path = sourceFileVariableResolver.resolve(workSpaceFolder, keyVal);
          if (fs.existsSync(path)) {
            arr.push(arg);
          } else if (task.showMessageIfPathNotExist) {
            vscode.window.showErrorMessage(`Unable to locate ${arg}`);
          }
        } else {
          arr.push(arg);
        }
      });
    } else {
      arr.push(arg);
    }
    return arr;
  }, [] as string[]);
  stringBuilder = [...stringBuilder, ...filteredArgs];

  let command = stringBuilder.join(' ');
  command = sourceFileVariableResolver.resolve(workSpaceFolder, command);
  command = resolveVariables(
    configs,
    newSourceFile.getAbsolutePath(),
    command,
    sourceFile.getBaseDirectoryPath(),
  );
  if (task.useForwardSlash) {
    command = command.split('\\').join('/');
  }
  return command;
}

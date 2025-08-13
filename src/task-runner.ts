import type { TerminalInstanceType } from './types';
import fs from 'node:fs';
import * as vscode from 'vscode';
import { ConfigurationManager } from './config';
import { CreationHelper } from './creation-helper';
import { NewFileHelper } from './new-file-helper';
import { SourceFile } from './source-file';
import { createCommand, isSupportExtension, switchToFile } from './utils';

export class TaskRunner {
  private terminals: { [key: string]: vscode.Terminal } = {};

  constructor() {
    this.setup();
  }

  async run(args: vscode.Uri): Promise<void> {
    const workspacePath = vscode.workspace.rootPath;

    const fileName = args.fsPath
      ? args.fsPath
      : vscode.window.activeTextEditor &&
        vscode.window.activeTextEditor.document.fileName;

    if (workspacePath == null || workspacePath === '') return;

    const configs = await ConfigurationManager.getConfiguration(args);

    if (!configs) return;

    const sourceFile = new SourceFile(
      fileName != null && fileName !== ''
        ? vscode.Uri.file(fileName)
        : vscode.Uri.file(workspacePath),
      configs,
    );

    if (!isSupportExtension(sourceFile, configs)) {
      vscode.window.showErrorMessage(
        "File extension not supported, to support the extension add an entry to 'fileGenTaskRunner.configs' and set 'supportedExtension' property.",
      );
      return;
    }

    if (!configs.isValidExtension(sourceFile)) {
      vscode.window.showErrorMessage('Invalid file extension!');
      return;
    }

    let newCreated = false;

    const newFileHelper = new NewFileHelper(configs, sourceFile);

    const targetFileLocation = newFileHelper.getFileAbsolutePath();

    if (!fs.existsSync(targetFileLocation)) {
      try {
        const helper = new CreationHelper(sourceFile, configs, newFileHelper);
        helper.createFile(configs.getTemplate());
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(error.message);
        } else {
          vscode.window.showErrorMessage(String(error));
        }
      }

      newCreated = true;
    }

    const newFileSource = newFileHelper.getSourceFile();

    const task = configs.getTask();
    if (!task) {
      if (configs.shouldSwitchToFile()) {
        await switchToFile(newFileSource.getAbsolutePath());
      }
      return;
    }

    const parentSourceFile = newFileHelper.getParentSourceFile(sourceFile);

    const command = await createCommand(parentSourceFile, newFileSource, configs);

    if (newCreated && !task.runTaskOnFileCreation) {
      return;
    }

    let cwd: string | undefined;
    if (task.shouldSwitchTerminalToCwd) {
      if (task.shouldSwitchToFile) {
        cwd = newFileSource.getDirectoryPath();
      } else {
        cwd = parentSourceFile.getDirectoryPath();
      }
    }

    if (task.shouldSwitchToFile) {
      await switchToFile(newFileSource.getAbsolutePath());
    }

    await this.runTerminalCommand(
      command!,
      task.terminalInstanceType,
      args.toString(),
      task.label,
      cwd,
    );
  }

  runTerminalCommand = async (
    command: string,
    terminalType: TerminalInstanceType,
    args: string,
    terminalLabel: string,
    cwd?: string,
  ): Promise<void> => {
    let terminalInstanceId: string;
    if (terminalType === 'new') {
      terminalInstanceId = '';
    } else if (terminalType === 'command') {
      terminalInstanceId = command;
    } else {
      terminalInstanceId = args;
    }

    let terminal = this.terminals[terminalInstanceId];

    if (terminalType === 'new') {
      terminal = vscode.window.createTerminal({ name: terminalLabel, cwd });
    } else if (typeof terminal === 'undefined') {
      terminal = vscode.window.createTerminal({ name: terminalLabel, cwd });
      this.terminals[terminalInstanceId] = terminal;
    }

    terminal.show(true);
    await vscode.commands.executeCommand('workbench.action.terminal.clear');
    terminal.sendText(command);
  };

  private setup() {
    vscode.window.onDidCloseTerminal(() => {
      this.terminals = {};
    });
  }

  clean(): void {
    this.terminals = {};
  }
}

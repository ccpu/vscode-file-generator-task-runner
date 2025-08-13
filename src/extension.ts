'use strict';
import * as vscode from 'vscode';
import { TaskRunner } from './task-runner';

const taskRunnerInstance = new TaskRunner();

export function activate(context: vscode.ExtensionContext): void {
  const fileGenTaskRunner = vscode.commands.registerCommand(
    'fileGenTaskRunner.run',
    async (sourceFile: vscode.Uri) => {
      await taskRunnerInstance.run(sourceFile);
    },
  );

  context.subscriptions.push(fileGenTaskRunner);
}

export function deactivate(): void {
  taskRunnerInstance.clean();
}

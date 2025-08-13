import type { QuickPickItem, WorkspaceConfiguration } from 'vscode';
import type { IConfiguration } from '../types';
import { Uri, window, workspace } from 'vscode';
import { Configuration } from './Configuration';

export class ConfigurationManager {
  static async getConfiguration(args: Uri): Promise<Configuration | undefined> {
    const workspaceConfiguration: WorkspaceConfiguration =
      workspace.getConfiguration('fileGenTaskRunner');

    const configs = workspaceConfiguration.get<IConfiguration[]>('configs');

    if (!configs || !configs.length) {
      window.showErrorMessage(
        "Unable to get configurations, make sure to have an entry in 'fileGenTaskRunner.configs'.",
      );
      return undefined;
    }

    const isUriInstance = args instanceof Uri;

    let taskLabel: string | undefined = '';
    let config: IConfiguration | undefined;

    if (isUriInstance) {
      config = await getConfigQuickPick(configs);
      if (config) {
        taskLabel = await getTaskQuickPick(config);
      }
    } else {
      // Fix: ensure args is stringable and not never
      taskLabel = typeof args === 'string' ? args : String(args);
      const configByLabel = configs.find((x) => x.label === taskLabel);
      if (configByLabel) {
        config = configByLabel;
      } else {
        config = configs.find((x) => x.tasks.find((t) => t.label === taskLabel));
      }
    }

    if (!config) {
      window.showErrorMessage(
        "Unable to find configurations, make sure to have a valid 'fileGenTaskRunner.configs' settings.",
      );
      return undefined;
    }

    const task =
      Array.isArray(config.tasks) && Boolean(taskLabel)
        ? config.tasks.find((x) => x.label === taskLabel)
        : undefined;

    const configuration = new Configuration(config, task);

    return configuration;
  }
}

async function getConfigQuickPick(configs: IConfiguration[]) {
  const configsPickItemItems: QuickPickItem[] = configs.map(
    (conf) =>
      ({
        label: conf.label,
        description: conf.description,
      }) as QuickPickItem,
  );

  const configPicked = await window.showQuickPick(configsPickItemItems);
  if (configPicked) {
    return configs.find((x) => x.label === configPicked.label);
  }
  return undefined;
}

async function getTaskQuickPick(config: IConfiguration): Promise<string | undefined> {
  if (typeof config === 'undefined') return undefined;
  if (!Array.isArray(config.tasks)) return undefined;
  if (config.tasks.length === 0) return undefined;

  if (config.tasks.length === 1) return config.tasks[0].label;

  const taskPickItems = config.tasks.map(
    (conf) =>
      ({
        label: conf.label,
        description: conf.description,
      }) as QuickPickItem,
  );

  const taskPicked = await window.showQuickPick(taskPickItems);

  if (taskPicked) {
    return taskPicked.label;
  }
  return undefined;
}

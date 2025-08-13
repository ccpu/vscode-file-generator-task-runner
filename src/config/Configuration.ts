import type { SourceFile } from '../source-file';
import type { IConfiguration, NewFileTask, Template } from '../types';
import path from 'node:path';
import { DefaultLocationForNewFiles } from '../constants';
import { resolveVariables } from '../utils/variable-resolver';
/**
 * A class used to hold the extension configurations. It also defines the getters to read the configuration.
 */
export class Configuration {
  private defaultConfiguration: IConfiguration = {
    defaultLocationForFiles: DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
    directoryName: '',
    customFilesLocation: '',
    shouldSwitchToFile: true,
    sourceDir: 'src',
    supportedExtension: [],
    tasks: [],
    configs: [],
    directorySuffix: '',
    ignoreDirectories: false,
  };

  task?: NewFileTask;

  constructor(config: IConfiguration, task?: NewFileTask) {
    this.defaultConfiguration = {
      ...this.defaultConfiguration,
      ...config,
    };
    this.task = task;
  }

  get ignoreDirectories(): boolean {
    return this.defaultConfiguration.ignoreDirectories;
  }

  getRootDirName(rootDir: string): string {
    const { rootDirName } = this.defaultConfiguration;

    const dirSuffix = this.getDirectorySuffix();

    if (rootDir.endsWith(dirSuffix)) return rootDir;

    if (rootDirName != null) {
      const dirName = resolveVariables(this, rootDir, rootDirName, rootDir);

      return dirName + dirSuffix;
    }

    return (rootDir.split(path.sep).pop() ?? '') + this.getDirectorySuffix();
  }

  getTemplate(): Template | undefined {
    return this.defaultConfiguration.template;
  }

  getTasks(): NewFileTask[] {
    return this.defaultConfiguration.tasks;
  }

  getRootByFilenameOrExtension(): string {
    const { rootFilenameOrExtension } = this.defaultConfiguration;
    if (rootFilenameOrExtension == null || rootFilenameOrExtension === '') {
      return '';
    }
    return rootFilenameOrExtension;
  }

  getDefaultLocationForNewFiles(): string {
    return this.defaultConfiguration.defaultLocationForFiles;
  }

  shouldCreateFilesInProjectRoot(): boolean {
    return (
      this.getDefaultLocationForNewFiles() === DefaultLocationForNewFiles.PROJECT_ROOT
    );
  }

  getCustomLocationForNewFiles(): string {
    return this.defaultConfiguration.customFilesLocation;
  }

  getDirectoryName(): string {
    return this.defaultConfiguration.directoryName;
  }

  getConfigs(): unknown[] {
    return this.defaultConfiguration.configs;
  }

  getNewFilesSuffix(): string | undefined {
    return this.defaultConfiguration.filesSuffix;
  }

  getDirectorySuffix(): string {
    return this.defaultConfiguration.directorySuffix;
  }

  getFileSuffixType(): string | undefined {
    return this.defaultConfiguration.fileSuffixType;
  }

  shouldSwitchToFile(): boolean {
    return this.defaultConfiguration.shouldSwitchToFile;
  }

  getSourceDir(): string {
    return this.defaultConfiguration.sourceDir;
  }

  getSupportedExtension(): string[] {
    return this.defaultConfiguration.supportedExtension;
  }

  isValidExtension(sourceFile: SourceFile): boolean {
    const ext = sourceFile.getExtension();
    const extensions = this.getSupportedExtension();
    return extensions.includes(ext);
  }

  getTask(): NewFileTask | undefined {
    const tasks = this.getTasks();
    let { task } = this;

    if (!task) {
      task = tasks.find((x) => x.default);
    }

    if (!task) {
      return;
    }

    // set defaults
    if (task.useForwardSlash === undefined) task.useForwardSlash = true;
    if (task.shouldSwitchToFile === undefined) task.shouldSwitchToFile = true;
    if (task.runTaskOnFileCreation === undefined) {
      task.runTaskOnFileCreation = true;
    }
    if (task.terminalInstanceType === undefined) {
      task.terminalInstanceType = 'label';
    }

    // eslint-disable-next-line consistent-return
    return task;
  }
}

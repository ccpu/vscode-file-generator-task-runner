import type { Configuration } from './config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sync as mkdirpSync } from 'mkdirp';
import * as vscode from 'vscode';
import { DefaultLocationForNewFiles } from './constants';
import { SourceFile } from './source-file';
import { getDirectoryPath, getFileName, isNewDirectory, replaceSourceDir } from './utils';

class NewFileHelper {
  sourceFile!: SourceFile;
  config!: Configuration;
  constructor(config: Configuration, sourceFile: SourceFile) {
    this.config = config;
    this.sourceFile = sourceFile;
  }

  /**
   * This method reads the configuration and based on that returns the path of directory inside which file
   * should be created. First it checks whether the `customLocationForFiles` is set or not. If the configuration
   * is absent then it reads the `defaultLocationForFiles` and based on that returns the directory path.
   */
  getFilesLocation(): string {
    let filesLocation: string = this.config.getCustomLocationForNewFiles();

    if (this.isTestFile(this.sourceFile)) {
      return this.sourceFile.getDirectoryPath();
    }

    if (filesLocation) {
      // If the path given by user is not absolute then first make it absolute
      if (!path.isAbsolute(filesLocation)) {
        filesLocation = path.normalize(path.join(this.sourceFile.getBaseDirectoryPath()));
      }

      const sourceFilePath: string = this.sourceFile.getRelativeFileDirname();

      if (sourceFilePath.includes(path.sep) || this.config.getDirectoryName()) {
        filesLocation = path.join(
          filesLocation,
          this.config.getDirectoryName(),
          this.config.ignoreDirectories ? '' : getDirectoryPath(sourceFilePath),
        );
      }

      filesLocation = replaceSourceDir(filesLocation, this.config.getSourceDir());

      return filesLocation;
    }

    switch (this.config.getDefaultLocationForNewFiles()) {
      case DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE: {
        let localFilePath: string = this.sourceFile.getDirectoryPath();

        if (
          !this.isTestFile(this.sourceFile) &&
          isNewDirectory(this.config.getDirectoryName(), localFilePath)
        ) {
          localFilePath = path.join(localFilePath, this.config.getDirectoryName());
        }

        return localFilePath;
      }

      case DefaultLocationForNewFiles.PROJECT_ROOT: {
        const sourceFilePath: string = this.sourceFile.getRelativeFileDirname();

        // Check whether the SourceFile is present inside multiple directories
        return sourceFilePath.includes(path.sep)
          ? this.mimicSourceDirectoryStructure()
          : this.sourceFile.getBaseDirectoryPath();
      }
    }

    return '';
  }

  /**
   * This method is used to mimic the directory structure of the source file.
   */
  private mimicSourceDirectoryStructure(): string {
    let directoryPath: string = path.join(
      this.sourceFile.getBaseDirectoryPath(),
      this.config.getDirectoryName(),
      getDirectoryPath(this.sourceFile.getRelativeFileDirname()),
    );

    directoryPath = replaceSourceDir(directoryPath, this.config.getSourceDir());

    if (!fs.existsSync(directoryPath)) {
      mkdirpSync(directoryPath);
    }

    return directoryPath;
  }

  isTestFile(sourceFile: SourceFile): boolean {
    const ext = `${this.config.getNewFilesSuffix()}.${sourceFile.getExtension()}`;
    return sourceFile.getName().endsWith(ext);
  }

  getParentFileName(sourceFile: SourceFile): string {
    const fileName = sourceFile.getNameWithoutExtension();
    const originalFile = fileName.replace(`.${this.config.getNewFilesSuffix()}`, '');
    return `${originalFile}.${sourceFile.getExtension()}`;
    // const parentFile =  this.sourceFile.getName().;
  }

  getParentSourceFile(sourceFile: SourceFile): SourceFile {
    const parentDir = sourceFile
      .getDirectoryPath()
      .replace(this.config.getDirectoryName(), '');
    const filePath = path.join(parentDir, this.getParentFileName(sourceFile));
    return new SourceFile(vscode.Uri.file(filePath), this.config);
  }

  getFilesDirectory(): string {
    let newDirPath = this.getFilesLocation();

    if (isNewDirectory(this.config.getDirectoryName(), newDirPath)) {
      const newDirName = this.config.getDirectoryName();
      newDirPath = path.join(newDirPath, newDirName);
    }
    return newDirPath;
  }

  getSourceFile(): SourceFile {
    return new SourceFile(vscode.Uri.file(this.getFileAbsolutePath()), this.config);
  }

  getFileAbsolutePath(): string {
    let newDirPath = this.getFilesLocation();

    if (
      !this.isTestFile(this.sourceFile) &&
      !isNewDirectory(this.config.getDirectoryName(), newDirPath)
    ) {
      const newDirName = this.config.getDirectoryName();
      newDirPath = path.join(newDirPath, newDirName);
    }

    const fileName = this.isTestFile(this.sourceFile)
      ? this.sourceFile.getName()
      : getFileName(this.sourceFile, this.config);
    const newFilePath = path.join(newDirPath, fileName);

    return newFilePath;
  }
}
export { NewFileHelper };

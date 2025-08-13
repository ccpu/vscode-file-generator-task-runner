import type { Uri } from 'vscode';
import type { Configuration } from './config/Configuration';
import * as path from 'node:path';
import {
  findFileDirUpwards,
  getCurrentWorkspacePath,
  getDirectoryPath,
  getWorkspaceRootForFile,
} from './utils';

export class SourceFile {
  private sourceFileUri: Uri;
  private _configs: Configuration;

  constructor(sourceFileUri: Uri, configs: Configuration) {
    this.sourceFileUri = sourceFileUri;
    this._configs = configs;
  }

  getBaseDirectoryPath(): string {
    let baseDirPath = getWorkspaceRootForFile(this.sourceFileUri.fsPath);

    const shouldCreateFilesInProjectRoot = this._configs.shouldCreateFilesInProjectRoot();

    if (baseDirPath == null) {
      baseDirPath = '';
    }

    if (shouldCreateFilesInProjectRoot) {
      const rootFilenameOrExtension = this._configs.getRootByFilenameOrExtension();

      if (rootFilenameOrExtension) {
        const foundDir = findFileDirUpwards(
          path.dirname(this.sourceFileUri.fsPath),
          rootFilenameOrExtension,
        );
        if (foundDir != null) {
          baseDirPath = foundDir;
        }
      }
    }

    const rootDirName = this._configs.getRootDirName(baseDirPath);

    if (rootDirName && !path.isAbsolute(rootDirName)) {
      baseDirPath = path.resolve(baseDirPath, '..');
      baseDirPath = path.join(baseDirPath, rootDirName);
    }

    return baseDirPath;
  }

  getWorkSpaceDir(): string | undefined {
    return getCurrentWorkspacePath(this.sourceFileUri);
  }

  isEndWithDirectorySuffix(dir: string): boolean {
    const suffix = this._configs.getDirectorySuffix();
    if (!suffix) return false;
    return dir.endsWith(suffix);
  }

  getAbsolutePath(): string {
    return this.sourceFileUri.fsPath;
  }

  getRelativeFileDirname(): string {
    let baseDir = this.getBaseDirectoryPath();
    const customDirName = this._configs.getDirectoryName();
    const dirSuffix = this._configs.getDirectorySuffix();

    if (customDirName) {
      // Optionally handle customDirName logic here, or remove the block if not needed
    } else if (dirSuffix) {
      baseDir += dirSuffix;
    }

    let relativePath = path.relative(baseDir, this.getAbsolutePath());

    if (this._configs.getRootByFilenameOrExtension() && dirSuffix) {
      const arr = relativePath.split(path.sep);
      const ROOT_PATH_SEGMENTS_TO_SKIP = 2; // Number of segments to skip for root
      relativePath = arr.splice(ROOT_PATH_SEGMENTS_TO_SKIP, arr.length).join(path.sep);
    }

    if (customDirName && relativePath.split(path.sep)[0] === customDirName) {
      relativePath = relativePath.substring(customDirName.length, relativePath.length);
    }

    return relativePath;
  }

  getDirectoryPath(): string {
    return getDirectoryPath(this.getAbsolutePath());
  }

  getName(): string {
    return path.basename(this.sourceFileUri.fsPath);
  }

  getExtension(): string {
    return (this.sourceFileUri.fsPath.split('.').pop() ?? '') || '';
  }

  getNameWithoutExtension(): string {
    return path.basename(
      this.sourceFileUri.fsPath,
      path.extname(this.sourceFileUri.fsPath),
    );
  }
}

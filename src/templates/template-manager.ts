import type { SourceFile } from '../source-file';
import type { Template } from '../types';
import * as path from 'node:path';
import { workspace } from 'vscode';
import { getDirectoryPath } from '../utils';

/**
 * Class which defines methods to get file-template/code-snippets for the different type of files.
 */
export class TemplateManager {
  /**
   * This method reads the configuration and returns the template which matches with the extension
   * of the source file. e.g. If the file extension is ".ts" then the method returns the template
   * defined with configuration "fileGenTaskRunner.template.ts".
   *
   * @param file SourceFile instance
   */
  static getTemplateForFile(file: SourceFile, template?: Template): Template | undefined {
    return template;
  }

  /**
   * This method returns the default template by reading the configuration from the key
   * "fileGenTaskRunner.template.default".
   */
  static getDefaultTemplate(): string[] {
    const templates = workspace.getConfiguration('fileGenTaskRunner.template');

    return templates.get('default', []);
  }

  /**
   * This method replaces the "moduleName" and "modulePath" like placeholders in the template and
   * replaces them with the actual value of module name and path.
   */
  static replacePlaceHolders(
    sourceFile: SourceFile,
    newFilePath: string,
    template: string[],
  ): string {
    const newFilePathFromProjectRoot: string = path.relative(
      sourceFile.getBaseDirectoryPath(),
      newFilePath,
    );

    const sourceFileDir = getDirectoryPath(sourceFile.getRelativeFileDirname());
    const moduleName = sourceFile.getNameWithoutExtension();
    const newFileDir = getDirectoryPath(newFilePathFromProjectRoot);
    const relativePath = path.relative(newFileDir, sourceFileDir);
    const importPath = [relativePath, moduleName].join('/');

    return template
      .join('\n')
      .replace(/\$\{moduleName\}/gu, `${moduleName}`)
      .replace(/\$\{modulePath\}/gu, `${importPath}`);
  }
}

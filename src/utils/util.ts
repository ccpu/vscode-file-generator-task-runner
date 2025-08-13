import * as fs from 'node:fs';
import * as path from 'node:path';
import isWindows from 'is-windows';

export function getDirectoryPath(filePath: string): string {
  const splitPath: string[] = filePath.split(path.sep);
  splitPath.pop(); // Remove the file name

  return path.isAbsolute(filePath) && !isWindows()
    ? path.join(path.sep, ...splitPath)
    : path.join(...splitPath);
}

export function isDirectory(filePath: string): boolean {
  return fs.lstatSync(filePath).isDirectory();
}

export function isFile(filePath: string): boolean {
  return fs.lstatSync(filePath).isFile();
}

export function replaceSourceDir(filePath: string, sourceDir: string): string {
  if (!sourceDir) {
    return filePath;
  }

  // Create regex pattern to match sourceDir in different positions:
  // - At the beginning: sourceDir/
  // - In the middle: /sourceDir/
  // - At the end: /sourceDir
  const sepEscaped = path.sep === '\\' ? '\\\\' : path.sep;
  const pattern = new RegExp(
    `(^${sourceDir}${sepEscaped}|${sepEscaped}${sourceDir}${sepEscaped}|${sepEscaped}${sourceDir}$)`,
    'gu',
  );

  return filePath.replace(pattern, (match) => {
    // If it's at the beginning, replace with empty string
    if (match.startsWith(sourceDir)) {
      return '';
    }
    // If it's in the middle or at the end, replace with single separator
    return path.sep;
  });
}

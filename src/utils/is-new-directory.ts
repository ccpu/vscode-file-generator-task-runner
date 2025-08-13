import * as path from 'node:path';

export function isNewDirectory(dirName: string, dirPath: string): boolean {
  // const dir = dirPath.replace(/^[\\/]+|[\\/]+$/g, "");
  return dirPath.includes(path.sep + dirName);
}

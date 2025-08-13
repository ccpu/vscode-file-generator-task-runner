import type { Configuration } from '../config/Configuration';
import type { SourceFile } from '../source-file';

export function isSupportExtension(
  sourceFile: SourceFile,
  config: Configuration,
): boolean {
  const extension = sourceFile.getExtension();

  const configByExtension = config.getSupportedExtension().includes(extension);

  if (!configByExtension) {
    return false;
  }

  return true;
}

import type { Configuration } from '../config/Configuration';
import type { SourceFile } from '../source-file';
import { isNonEmptyString } from './validations';

/**
 * Returns the name of the new file to be created
 */

export function getFileName(sourceFile: SourceFile, config: Configuration): string {
  const suffix = config.getNewFilesSuffix();
  const fileSuffixType = config.getFileSuffixType();

  let fileName = sourceFile.getNameWithoutExtension();

  if (isNonEmptyString(suffix) && fileSuffixType === 'append to file name') {
    fileName += suffix;
  }

  const stringBuilder = [fileName];

  if (isNonEmptyString(suffix) && fileSuffixType === 'extend extension') {
    stringBuilder.push(suffix);
  }

  if (isNonEmptyString(suffix) && fileSuffixType === 'replace extension') {
    stringBuilder.push(suffix);
  } else {
    stringBuilder.push(sourceFile.getExtension());
  }

  return stringBuilder.join('.');
}

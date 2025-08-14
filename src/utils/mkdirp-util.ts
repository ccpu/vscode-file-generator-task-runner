// eslint-disable-next-line ts/no-require-imports
import mkdirp = require('mkdirp');

/**
 * Utility wrapper for mkdirp to make it easier to mock in tests
 */
export function createDirectory(dirPath: string): void {
  mkdirp.sync(dirPath);
}

/**
 * Get the mkdirp module - useful for testing
 */
export function getMkdirp(): typeof mkdirp {
  return mkdirp;
}

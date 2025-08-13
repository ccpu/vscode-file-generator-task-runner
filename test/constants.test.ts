import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DIR_NAME,
  DEFAULT_FILE_SUFFIX,
  DefaultLocationForNewFiles,
} from '../src/constants';

describe('constants', () => {
  describe('defaultLocationForNewFiles', () => {
    it('should have correct values for location options', () => {
      expect(DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE).toBe(
        'same location as source file',
      );
      expect(DefaultLocationForNewFiles.PROJECT_ROOT).toBe('project root');
      expect(DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE_WITH_NEW_DIRECTORY).toBe(
        'same location as source file with new directory',
      );
    });
  });

  describe('dEFAULT_FILE_SUFFIX', () => {
    it('should have default file suffix', () => {
      expect(DEFAULT_FILE_SUFFIX).toBe('test');
    });
  });

  describe('dEFAULT_DIR_NAME', () => {
    it('should have default directory name', () => {
      expect(DEFAULT_DIR_NAME).toBe('__tests__');
    });
  });
});

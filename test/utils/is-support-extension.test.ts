import type { Configuration } from '../../src/config/Configuration';
import type { SourceFile } from '../../src/source-file';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isSupportExtension } from '../../src/utils/is-support-extension';

describe('isSupportExtension', () => {
  let mockSourceFile: SourceFile;
  let mockConfig: Configuration;

  beforeEach(() => {
    // Create mock source file
    mockSourceFile = {
      getExtension: vi.fn(),
    } as any;

    // Create mock configuration
    mockConfig = {
      getSupportedExtension: vi.fn(),
    } as any;
  });

  it('should return true when extension is supported', () => {
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getSupportedExtension).mockReturnValue([
      'js',
      'ts',
      'jsx',
      'tsx',
    ]);

    const result = isSupportExtension(mockSourceFile, mockConfig);
    expect(result).toBe(true);
  });

  it('should return false when extension is not supported', () => {
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('py');
    vi.mocked(mockConfig.getSupportedExtension).mockReturnValue([
      'js',
      'ts',
      'jsx',
      'tsx',
    ]);

    const result = isSupportExtension(mockSourceFile, mockConfig);
    expect(result).toBe(false);
  });

  it('should return false when supported extensions list is empty', () => {
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getSupportedExtension).mockReturnValue([]);

    const result = isSupportExtension(mockSourceFile, mockConfig);
    expect(result).toBe(false);
  });

  it('should be case sensitive', () => {
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('TS');
    vi.mocked(mockConfig.getSupportedExtension).mockReturnValue(['ts']);

    const result = isSupportExtension(mockSourceFile, mockConfig);
    expect(result).toBe(false);
  });

  it('should handle empty extension', () => {
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('');
    vi.mocked(mockConfig.getSupportedExtension).mockReturnValue(['js', 'ts']);

    const result = isSupportExtension(mockSourceFile, mockConfig);
    expect(result).toBe(false);
  });

  it('should handle extension with dot', () => {
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('.ts');
    vi.mocked(mockConfig.getSupportedExtension).mockReturnValue(['.ts', '.js']);

    const result = isSupportExtension(mockSourceFile, mockConfig);
    expect(result).toBe(true);
  });
});

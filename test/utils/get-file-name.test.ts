import type { Configuration } from '../../src/config/Configuration';
import type { SourceFile } from '../../src/source-file';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFileName } from '../../src/utils/get-file-name';

// Mock the dependencies
vi.mock('vscode', () => ({
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
  workspace: {
    getWorkspaceFolder: vi.fn(),
  },
}));

describe('getFileName', () => {
  let mockSourceFile: SourceFile;
  let mockConfig: Configuration;

  beforeEach(() => {
    // Create mock source file
    mockSourceFile = {
      getNameWithoutExtension: vi.fn(),
      getExtension: vi.fn(),
    } as any;

    // Create mock configuration
    mockConfig = {
      getNewFilesSuffix: vi.fn(),
      getFileSuffixType: vi.fn(),
    } as any;
  });

  it('should return file name with extension when no suffix', () => {
    vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('component');
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getNewFilesSuffix).mockReturnValue(undefined);
    vi.mocked(mockConfig.getFileSuffixType).mockReturnValue(undefined);

    const result = getFileName(mockSourceFile, mockConfig);
    expect(result).toBe('component.ts');
  });

  it('should append suffix to file name when fileSuffixType is "append to file name"', () => {
    vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('component');
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getNewFilesSuffix).mockReturnValue('.test');
    vi.mocked(mockConfig.getFileSuffixType).mockReturnValue('append to file name');

    const result = getFileName(mockSourceFile, mockConfig);
    expect(result).toBe('component.test.ts');
  });

  it('should extend extension when fileSuffixType is "extend extension"', () => {
    vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('component');
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getNewFilesSuffix).mockReturnValue('test');
    vi.mocked(mockConfig.getFileSuffixType).mockReturnValue('extend extension');

    const result = getFileName(mockSourceFile, mockConfig);
    expect(result).toBe('component.test.ts');
  });

  it('should replace extension when fileSuffixType is "replace extension"', () => {
    vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('component');
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getNewFilesSuffix).mockReturnValue('spec.js');
    vi.mocked(mockConfig.getFileSuffixType).mockReturnValue('replace extension');

    const result = getFileName(mockSourceFile, mockConfig);
    expect(result).toBe('component.spec.js');
  });

  it('should handle empty suffix gracefully', () => {
    vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('component');
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getNewFilesSuffix).mockReturnValue('');
    vi.mocked(mockConfig.getFileSuffixType).mockReturnValue('append to file name');

    const result = getFileName(mockSourceFile, mockConfig);
    expect(result).toBe('component.ts');
  });

  it('should handle undefined suffix gracefully', () => {
    vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('component');
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('ts');
    vi.mocked(mockConfig.getNewFilesSuffix).mockReturnValue(undefined);
    vi.mocked(mockConfig.getFileSuffixType).mockReturnValue('extend extension');

    const result = getFileName(mockSourceFile, mockConfig);
    expect(result).toBe('component.ts');
  });

  it('should handle file without extension', () => {
    vi.mocked(mockSourceFile.getNameWithoutExtension).mockReturnValue('README');
    vi.mocked(mockSourceFile.getExtension).mockReturnValue('');
    vi.mocked(mockConfig.getNewFilesSuffix).mockReturnValue('.test');
    vi.mocked(mockConfig.getFileSuffixType).mockReturnValue('append to file name');

    const result = getFileName(mockSourceFile, mockConfig);
    expect(result).toBe('README.test.');
  });
});

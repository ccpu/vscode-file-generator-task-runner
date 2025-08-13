import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { switchToFile } from '../../src/utils/switch-to-file';

// Mock vscode
vi.mock('vscode', () => ({
  Uri: {
    file: vi.fn((path) => ({ fsPath: path, scheme: 'file' })),
  },
  window: {
    showTextDocument: vi.fn(),
  },
}));

describe('switch-to-file', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('switchToFile', () => {
    it('should call showTextDocument with file URI', async () => {
      const filePath = '/workspace/src/test.ts';
      const mockUri = { fsPath: filePath, scheme: 'file' };

      vi.mocked(vscode.Uri.file).mockReturnValue(mockUri as any);
      vi.mocked(vscode.window.showTextDocument).mockReturnValue(
        Promise.resolve({} as any),
      );

      await switchToFile(filePath);

      expect(vscode.Uri.file).toHaveBeenCalledWith(filePath);
      expect(vscode.window.showTextDocument).toHaveBeenCalledWith(mockUri);
    });

    it('should handle showTextDocument success without throwing', async () => {
      const filePath = '/workspace/src/test.ts';

      vi.mocked(vscode.window.showTextDocument).mockReturnValue(
        Promise.resolve({} as any),
      );

      await expect(switchToFile(filePath)).resolves.not.toThrow();
    });

    it('should handle different file paths', async () => {
      const filePaths = [
        '/workspace/src/component.ts',
        'C:\\Windows\\project\\file.js',
        'relative/path/file.txt',
      ];

      vi.mocked(vscode.window.showTextDocument).mockReturnValue(
        Promise.resolve({} as any),
      );

      for (const filePath of filePaths) {
        await switchToFile(filePath);
        expect(vscode.Uri.file).toHaveBeenCalledWith(filePath);
      }

      expect(vscode.window.showTextDocument).toHaveBeenCalledTimes(filePaths.length);
    });

    it('should call function without errors when mocked properly', async () => {
      const filePath = '/workspace/src/test.ts';

      vi.mocked(vscode.window.showTextDocument).mockReturnValue(
        Promise.resolve({} as any),
      );

      // Test basic functionality
      await expect(switchToFile(filePath)).resolves.not.toThrow();
      expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });

    it('should catch and rethrow errors from showTextDocument', async () => {
      const filePath = '/workspace/src/test.ts';
      const testError = new Error('showTextDocument failed');
      vi.mocked(vscode.window.showTextDocument).mockRejectedValue(testError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(switchToFile(filePath)).rejects.toThrow(testError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to switch to file:',
        testError,
      );
      consoleErrorSpy.mockRestore();
    });
  });
});

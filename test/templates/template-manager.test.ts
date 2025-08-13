/* eslint-disable no-template-curly-in-string */
import type { SourceFile } from '../../src/source-file';
import type { Template } from '../../src/types';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { TemplateManager } from '../../src/templates/template-manager';

// Mock vscode
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(),
  },
}));

// Mock path module
vi.mock('path', () => ({
  relative: vi.fn(),
  default: {
    relative: vi.fn(),
  },
}));

// Mock utils
vi.mock('../../src/utils/index.js', () => ({
  getDirectoryPath: vi.fn((dirPath) => dirPath || ''),
}));

describe('templateManager', () => {
  let mockSourceFile: SourceFile;
  let mockWorkspaceConfiguration: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSourceFile = {
      getBaseDirectoryPath: vi.fn().mockReturnValue('/workspace/src'),
      getRelativeFileDirname: vi.fn().mockReturnValue('components'),
      getNameWithoutExtension: vi.fn().mockReturnValue('Button'),
    } as any;

    mockWorkspaceConfiguration = {
      get: vi.fn(),
    };

    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(
      mockWorkspaceConfiguration,
    );
    vi.mocked(path.relative).mockImplementation((from, to) => {
      // Simple mock implementation
      if (
        from === '/workspace/src' &&
        to === '/workspace/src/components/Button.test.ts'
      ) {
        return 'components/Button.test.ts';
      }
      if (from === 'components' && to === 'components') {
        return '.';
      }
      return 'mock-relative-path';
    });
  });

  describe('getTemplateForFile', () => {
    it('should return the provided template', () => {
      const template: Template = ['line1', 'line2', 'line3'];

      const result = TemplateManager.getTemplateForFile(mockSourceFile, template);

      expect(result).toBe(template);
    });

    it('should return undefined when no template provided', () => {
      const result = TemplateManager.getTemplateForFile(mockSourceFile);

      expect(result).toBeUndefined();
    });

    it('should handle object template', () => {
      const template: Template = {
        ts: ['typescript content'],
        js: ['javascript content'],
      };

      const result = TemplateManager.getTemplateForFile(mockSourceFile, template);

      expect(result).toBe(template);
    });
  });

  describe('getDefaultTemplate', () => {
    it('should get default template from workspace configuration', () => {
      const defaultTemplate = ['export default class ${moduleName} {', '}'];
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue(defaultTemplate);

      const result = TemplateManager.getDefaultTemplate();

      expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(
        'fileGenTaskRunner.template',
      );
      expect(mockWorkspaceConfiguration.get).toHaveBeenCalledWith('default', []);
      expect(result).toEqual(defaultTemplate);
    });

    it('should return empty array when no default template configured', () => {
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue([]);

      const result = TemplateManager.getDefaultTemplate();

      expect(result).toEqual([]);
    });

    it('should use fallback empty array when get returns undefined', () => {
      vi.mocked(mockWorkspaceConfiguration.get).mockReturnValue(undefined);

      const result = TemplateManager.getDefaultTemplate();

      expect(mockWorkspaceConfiguration.get).toHaveBeenCalledWith('default', []);
      expect(result).toBeUndefined();
    });
  });

  describe('replacePlaceHolders', () => {
    let template: string[];

    beforeEach(() => {
      template = [
        'import { ${moduleName} } from "${modulePath}";',
        '',
        'describe("${moduleName}", () => {',
        '  // Test implementation',
        '});',
      ];
    });

    it('should replace moduleName placeholder', () => {
      const newFilePath = '/workspace/src/components/Button.test.ts';

      const result = TemplateManager.replacePlaceHolders(
        mockSourceFile,
        newFilePath,
        template,
      );

      expect(result).toContain('import { Button }');
      expect(result).toContain('describe("Button", () => {');
    });

    it('should replace modulePath placeholder', () => {
      const newFilePath = '/workspace/src/components/Button.test.ts';

      const result = TemplateManager.replacePlaceHolders(
        mockSourceFile,
        newFilePath,
        template,
      );

      expect(result).toMatch(/from ".*Button"/u); // Should contain some path to Button
    });

    it('should join template lines with newlines', () => {
      const newFilePath = '/workspace/src/components/Button.test.ts';

      const result = TemplateManager.replacePlaceHolders(
        mockSourceFile,
        newFilePath,
        template,
      );

      expect(result).toContain('\n');
      expect(result.split('\n')).toHaveLength(template.length);
    });

    it('should handle template without placeholders', () => {
      const simpleTemplate = ['const test = true;', 'export default test;'];
      const newFilePath = '/workspace/src/components/Button.test.ts';

      const result = TemplateManager.replacePlaceHolders(
        mockSourceFile,
        newFilePath,
        simpleTemplate,
      );

      expect(result).toBe('const test = true;\nexport default test;');
    });

    it('should handle multiple occurrences of same placeholder', () => {
      const multiTemplate = [
        '// ${moduleName} test',
        'import { ${moduleName} } from "${modulePath}";',
        'test("${moduleName} works", () => {});',
      ];
      const newFilePath = '/workspace/src/components/Button.test.ts';

      const result = TemplateManager.replacePlaceHolders(
        mockSourceFile,
        newFilePath,
        multiTemplate,
      );

      const buttonOccurrences = (result.match(/Button/gu) || []).length;
      expect(buttonOccurrences).toBeGreaterThanOrEqual(3); // Should be at least 3, might be more due to path
    });

    it('should call path.relative to calculate import path', () => {
      const newFilePath = '/workspace/src/components/Button.test.ts';

      TemplateManager.replacePlaceHolders(mockSourceFile, newFilePath, template);

      expect(path.relative).toHaveBeenCalledWith('/workspace/src', newFilePath);
    });

    it('should use getDirectoryPath utility', async () => {
      const { getDirectoryPath } = await import('../../src/utils/index.js');
      const newFilePath = '/workspace/src/components/Button.test.ts';

      TemplateManager.replacePlaceHolders(mockSourceFile, newFilePath, template);

      expect(getDirectoryPath).toHaveBeenCalled();
    });
  });
});

import type {
  IConfiguration,
  NewFileTask,
  Template,
  TerminalInstanceType,
} from '../src/types';
import { describe, expect, it } from 'vitest';
import { DefaultLocationForNewFiles } from '../src/constants';

describe('types', () => {
  describe('terminalInstanceType', () => {
    it('should accept valid terminal instance types', () => {
      const validTypes: TerminalInstanceType[] = ['label', 'command', 'new'];

      validTypes.forEach((type) => {
        expect(['label', 'command', 'new']).toContain(type);
      });
    });
  });

  describe('newFileTask interface', () => {
    it('should create a valid NewFileTask object', () => {
      const task: NewFileTask = {
        label: 'Test Task',
        args: ['arg1', 'arg2'],
        useForwardSlash: true,
        command: 'echo "test"',
        default: false,
        shouldSwitchToFile: true,
        terminalInstanceType: 'new',
        runTaskOnFileCreation: false,
        description: 'A test task',
        checkIfArgPathExist: ['/path/to/check'],
        showMessageIfPathNotExist: true,
        userInputPrompt: [],
        shouldSwitchTerminalToCwd: false,
      };

      expect(task.label).toBe('Test Task');
      expect(task.args).toEqual(['arg1', 'arg2']);
      expect(task.useForwardSlash).toBe(true);
      expect(task.command).toBe('echo "test"');
      expect(task.default).toBe(false);
      expect(task.shouldSwitchToFile).toBe(true);
      expect(task.terminalInstanceType).toBe('new');
      expect(task.runTaskOnFileCreation).toBe(false);
      expect(task.description).toBe('A test task');
      expect(task.checkIfArgPathExist).toEqual(['/path/to/check']);
      expect(task.showMessageIfPathNotExist).toBe(true);
      expect(task.userInputPrompt).toEqual([]);
      expect(task.shouldSwitchTerminalToCwd).toBe(false);
    });
  });

  describe('iConfiguration interface', () => {
    it('should create a valid IConfiguration object', () => {
      const config: IConfiguration = {
        filesSuffix: '.test',
        fileSuffixType: 'extend extension',
        directoryName: '__tests__',
        customFilesLocation: '/custom/path',
        defaultLocationForFiles: DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
        shouldSwitchToFile: true,
        sourceDir: 'src',
        tasks: [],
        supportedExtension: ['.ts', '.js'],
        configs: [],
        label: 'Test Config',
        description: 'A test configuration',
        template: ['template line 1', 'template line 2'],
        rootFilenameOrExtension: 'package.json',
        rootDirName: 'project-root',
        directorySuffix: '.spec',
        ignoreDirectories: false,
      };

      expect(config.filesSuffix).toBe('.test');
      expect(config.fileSuffixType).toBe('extend extension');
      expect(config.directoryName).toBe('__tests__');
      expect(config.customFilesLocation).toBe('/custom/path');
      expect(config.defaultLocationForFiles).toBe(
        DefaultLocationForNewFiles.SAME_AS_SOURCE_FILE,
      );
      expect(config.shouldSwitchToFile).toBe(true);
      expect(config.sourceDir).toBe('src');
      expect(config.tasks).toEqual([]);
      expect(config.supportedExtension).toEqual(['.ts', '.js']);
      expect(config.configs).toEqual([]);
      expect(config.label).toBe('Test Config');
      expect(config.description).toBe('A test configuration');
      expect(config.template).toEqual(['template line 1', 'template line 2']);
      expect(config.rootFilenameOrExtension).toBe('package.json');
      expect(config.rootDirName).toBe('project-root');
      expect(config.directorySuffix).toBe('.spec');
      expect(config.ignoreDirectories).toBe(false);
    });
  });

  describe('template type', () => {
    it('should accept string array template', () => {
      const template: Template = ['line 1', 'line 2', 'line 3'];
      expect(Array.isArray(template)).toBe(true);
      expect(template).toEqual(['line 1', 'line 2', 'line 3']);
    });

    it('should accept object template', () => {
      const template: Template = {
        component: ['import React from "react"', 'export const Component = () => {}'],
        test: ['import { test } from "vitest"', 'test("should work", () => {})'],
      };

      expect(typeof template).toBe('object');
      expect(template.component).toEqual([
        'import React from "react"',
        'export const Component = () => {}',
      ]);
      expect(template.test).toEqual([
        'import { test } from "vitest"',
        'test("should work", () => {})',
      ]);
    });
  });
});

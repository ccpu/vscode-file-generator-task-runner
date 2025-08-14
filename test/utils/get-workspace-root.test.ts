import { afterEach, describe, expect, it } from 'vitest';
// @ts-ignore
import { __test as vscodeTestMock, workspace as vscodeWorkspace } from 'vscode';
import {
  getWorkspaceRoot,
  getWorkspaceRootForFile,
} from '../../src/utils/get-workspace-root';

describe('getWorkspaceRoot', () => {
  afterEach(() => {
    vscodeTestMock.mockGetWorkspaceFolder.mockReset();
    vscodeTestMock.mockWorkspaceFolders = undefined;
    // @ts-ignore
    vscodeWorkspace.workspaceFolders = undefined;
  });

  it('returns root path for given workspaceUri when folder exists', () => {
    const uri = { fsPath: '/root/project' };
    vscodeTestMock.mockGetWorkspaceFolder.mockReturnValue({ uri });
    expect(getWorkspaceRoot(uri as any)).toBe('/root/project');
  });

  it('returns fsPath from workspaceUri if folder not found', () => {
    const uri = { fsPath: '/root/project' };
    vscodeTestMock.mockGetWorkspaceFolder.mockReturnValue(undefined);
    expect(getWorkspaceRoot(uri as any)).toBe('/root/project');
  });

  it('returns root path of first workspace folder if no workspaceUri', () => {
    // @ts-ignore
    vscodeWorkspace.workspaceFolders = [{ uri: { fsPath: '/root/first' } }];
    expect(getWorkspaceRoot()).toBe('/root/first');
  });

  it('returns undefined if no workspace folders', () => {
    // @ts-ignore
    vscodeWorkspace.workspaceFolders = undefined;
    expect(getWorkspaceRoot()).toBeUndefined();
  });
});

describe('getWorkspaceRootForFile', () => {
  afterEach(() => {
    vscodeTestMock.mockGetWorkspaceFolder.mockReset();
  });

  it('returns root path for file in workspace folder', () => {
    vscodeTestMock.mockGetWorkspaceFolder.mockReturnValue({
      uri: { fsPath: '/root/project' },
    });
    expect(getWorkspaceRootForFile('/root/project/file.ts')).toBe('/root/project');
  });

  it('returns undefined if file not in any workspace folder', () => {
    vscodeTestMock.mockGetWorkspaceFolder.mockReturnValue(undefined);
    expect(getWorkspaceRootForFile('/not/in/workspace/file.ts')).toBeUndefined();
  });
});

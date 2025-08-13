import * as fs from 'node:fs';
import * as path from 'node:path';
import { findFileDirUpwards } from '../../src/utils/find-file-dir-upwards';

describe('findFileUpwards', () => {
  const tmpRoot = path.join(__dirname, 'tmp-find-file-upwards');
  const nestedDir = path.join(tmpRoot, 'a', 'b', 'c');
  const fileName = 'testfile.json';

  beforeAll(() => {
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, fileName), '{}');
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('should find the file upwards from a nested directory', () => {
    const found = findFileDirUpwards(nestedDir, fileName);
    expect(found).toBe(tmpRoot);
  });

  it('should return undefined if file is not found and breakOnWorkspace is false', () => {
    const found = findFileDirUpwards(nestedDir, 'notfound.json');
    expect(found).toBe(path.parse(nestedDir).root);
  });

  it('should stop at workspace root if breakOnWorkspace is true', () => {
    const found = findFileDirUpwards(nestedDir, 'notfound.json', {
      breakOnWorkspace: true,
      workspaceUri: { fsPath: tmpRoot } as any,
    });
    expect(found).toBe(tmpRoot);
  });
});

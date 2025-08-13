// Mock for vscode module
let mockWorkspaceFolders: { uri: { fsPath: string } }[] | undefined;
const mockGetWorkspaceFolder = (globalThis as any).vi
  ? (globalThis as any).vi.fn()
  : () => undefined;

export const Uri = {
  file: (path: string) => ({
    fsPath: path,
    path,
    scheme: 'file',
    toString: () => path,
  }),
  parse: (path: string) => ({
    fsPath: path,
    path,
    scheme: 'file',
    toString: () => path,
  }),
};

export const workspace = {
  getConfiguration: (_section?: string) => ({
    get: (_key: string, defaultValue?: any) => defaultValue,
    has: (_key: string) => false,
    inspect: (_key: string) => undefined,
    update: async (_key: string, _value: any) => Promise.resolve(),
  }),
  workspaceFolders: mockWorkspaceFolders,
  rootPath: undefined,
  name: undefined,
  getWorkspaceFolder: mockGetWorkspaceFolder,
  asRelativePath: (pathOrUri: string) => pathOrUri,
  findFiles: async () => Promise.resolve([]),
  openTextDocument: async () =>
    Promise.resolve({
      fileName: '',
      getText: () => '',
      lineAt: (_line: number) => ({ text: '' }),
      lineCount: 0,
    }),
};

export const window = {
  showErrorMessage: async (_message: string) => Promise.resolve(undefined),
  showWarningMessage: async (_message: string) => Promise.resolve(undefined),
  showInformationMessage: async (_message: string) => Promise.resolve(undefined),
  showQuickPick: async (_items: any[], _options?: any) => Promise.resolve(undefined),
  showInputBox: async (_options?: any) => Promise.resolve(undefined),
  createTerminal: (_options?: any) => ({
    sendText: (_text: string) => {},
    show: () => {},
    dispose: () => {},
  }),
  activeTextEditor: undefined,
  visibleTextEditors: [],
};

export const commands = {
  executeCommand: async (_command: string, ..._args: any[]) => Promise.resolve(undefined),
  registerCommand: (_command: string, _callback: (...args: any[]) => any) => ({
    dispose: () => {},
  }),
};

export class EventEmitter {
  private listeners: { [event: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(...args));
    }
  }

  get event() {
    return (listener: (...args: any[]) => void) => {
      this.on('event', listener);
      return { dispose: () => {} };
    };
  }
}

export const ProgressLocation = {
  Notification: 15,
  SourceControl: 1,
  Window: 10,
};

export const QuickPickItemKind = {
  Separator: -1,
  Default: 0,
};

export class CancellationTokenSource {
  token = {
    isCancellationRequested: false,
    onCancellationRequested: new EventEmitter().event,
  };

  cancel() {
    this.token.isCancellationRequested = true;
  }

  dispose() {
    // No resources to dispose in mock
  }
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

export const env = {
  machineId: 'test-machine-id',
  sessionId: 'test-session-id',
  language: 'en',
  appName: 'Visual Studio Code',
  appRoot: '/app/root',
  uriScheme: 'vscode',
};

export const __test = {
  get mockGetWorkspaceFolder() {
    return mockGetWorkspaceFolder;
  },
  get mockWorkspaceFolders() {
    return mockWorkspaceFolders;
  },
  set mockWorkspaceFolders(val) {
    mockWorkspaceFolders = val;
    workspace.workspaceFolders = val;
  },
};

export default { workspace, Uri, __test };

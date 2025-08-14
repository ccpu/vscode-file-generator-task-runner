import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'out', '.vscode', '.vscode-test'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      reportOnFailure: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      vscode: path.resolve(__dirname, './__mocks__/vscode.ts'),
    },
  },
  esbuild: {
    target: 'node14',
  },
});

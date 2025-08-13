import config from '@pixpilot/eslint-config';

const configs = config(
  {
    type: 'app',
    ignores: ['src/vs/**'],
  },
  {
    files: ['test/**/*.ts'],
    rules: {},
  },
);

export default configs;

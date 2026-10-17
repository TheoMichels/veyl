const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/**',
      '.agents/**',
      '.expo/**',
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'migrate-data.mjs',
    ],
  },
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);

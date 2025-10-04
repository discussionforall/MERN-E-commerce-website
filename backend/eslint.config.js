const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config([
  {
    ignores: ['dist', 'node_modules', '*.config.js', '*.config.ts'],
  },
  {
    files: ['**/*.{ts,js}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettier,
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off', // Allow console.log in backend
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-catch': 'error',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
  },
]);

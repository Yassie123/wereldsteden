import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
];
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: 'eslint:recommended',
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {},
};

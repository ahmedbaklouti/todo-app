// @ts-check
import eslint from '@eslint/js';
import { URL, fileURLToPath } from 'node:url';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default tseslint.config(
  {
    ignores: ['.nuxt/**', '.output/**', 'dist/**', 'node_modules/**', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        parser: tseslint.parser,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
        tsconfigRootDir,
      },
    },
    rules: {
      'no-undef': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
);

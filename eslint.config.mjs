/**
 * @file Центральный ESLint конфиг (тестовое BabelShark)
 *
 * Цели:
 * - строгий TypeScript ESLint (type-aware) без монорепо-ограничений
 * - безопасные игноры для Meteor артефактов (`.meteor/**`)
 * - базовая безопасность/гигиена импортов (no-secrets, security, import cycles, sort)
 * - точечные послабления только для тестов (чтобы не плодить шум)
 */
import js from '@eslint/js';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import importPlugin from 'eslint-plugin-import';
import noSecrets from 'eslint-plugin-no-secrets';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/**',
      '.meteor/**',
      '_build/**',
      'node_modules/**',
      'coverage/**',
      // This file is not part of TS project; keep lint simple.
      'eslint.config.mjs',
      // Rspack config at repo root; not in tsconfig.typecheck.json.
      'rspack.config.js',
      'rspack.config.cjs',
    ],
  },
  // TypeScript (строго, type-aware).
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
    plugins: {
      import: importPlugin,
      'no-secrets': noSecrets,
      security,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        // Type-aware линтинг через отдельный tsconfig, который понимает `/imports/*`.
        project: ['./tsconfig.typecheck.json'],
        tsconfigRootDir,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',

      // Строгость, которая повышает качество TS, не конфликтуя с Meteor.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',

      // Безопасность / потенциально опасный JS.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'warn',

      // Секреты.
      'no-secrets/no-secrets': 'error',

      // Гигиена импортов.
      'import/no-cycle': ['error', { maxDepth: 7, ignoreExternal: true }],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  // Тесты: сохраняем строгость, но избегаем лишнего шума.
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-secrets/no-secrets': 'off',
    },
  },
];

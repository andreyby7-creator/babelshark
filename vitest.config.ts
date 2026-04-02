/**
 * @file Конфиг Vitest (тестовое BabelShark)
 *
 * Цели:
 * - стабильные настройки для локальной разработки и CI (retry/isolate/allowOnly)
 * - `jsdom`, потому что тестируем DOM-код (MutationObserver)
 * - JSON-репорт для быстрых проверок в CI/отладке
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const isCI = process.env['CI'] === 'true';
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Разрешаем тестам использовать Meteor-стиль абсолютных импортов.
      '/imports': path.resolve(rootDir, 'imports'),
      // Делаем `meteor/meteor` резолвимым модулем для unit-тестов (рантайм Meteor не поднимаем).
      'meteor/meteor': path.resolve(rootDir, 'imports/test/stubs/meteor-meteor.ts'),
      // Делаем `meteor/vlasky:mysql` резолвимым модулем для unit-тестов.
      'meteor/vlasky:mysql': path.resolve(
        rootDir,
        'imports/test/stubs/meteor-vlasky-mysql.ts',
      ),
      'meteor/mongo': path.resolve(rootDir, 'imports/test/stubs/meteor-mongo.ts'),
      'meteor/tracker': path.resolve(rootDir, 'imports/test/stubs/meteor-tracker.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['imports/test/**/*.test.ts'],
    passWithNoTests: true,
    allowOnly: !isCI,
    retry: isCI ? 3 : 1,
    isolate: isCI ? false : true,
    reporters: ['verbose', ['json', { outputFile: './test-results/results.json' }]],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.cache/**',
      '**/.meteor/**',
    ],
  },
});

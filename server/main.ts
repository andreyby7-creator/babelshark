/**
 * @file Серверный entrypoint (Meteor).
 *
 * В рамках ТЗ:
 * - регистрируем публикации и методы
 * - инициализируем TypeORM singleton (только для `translations`)
 *
 * @remarks
 * - Lazy-loading bootstrap модулей не делаем: для тестового важнее простота и предсказуемый старт.
 */
import '/imports/api/methods';
import '/imports/api/publications';

import { Meteor } from 'meteor/meteor';

import { initTypeORM } from './typeorm';

/* ============================================================================
 * STARTUP
 * ========================================================================== */

Meteor.startup(async () => {
  try {
    await initTypeORM();
    console.log('[startup] TypeORM initialized');
  } catch (err) {
    console.error('[startup] TypeORM failed to initialize', err);
    throw err;
  }
});

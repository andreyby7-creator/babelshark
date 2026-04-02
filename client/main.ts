/**
 * @file Клиентский entrypoint (Meteor).
 *
 * В рамках ТЗ:
 * - рендерим таблицу
 * - запускаем MutationObserver для `.__t`
 *
 * @remarks
 * - Lazy-init и feature flags не добавляем: для тестового один экран и один observer.
 * - На старте логируем ошибки, чтобы быстро диагностировать проблемы в dev/CI.
 * - Bootstrap CSS — визуал таблицы/контейнера как в ТЗ (Фаза 6 docs/roadmap).
 */
import 'bootstrap/dist/css/bootstrap.min.css';

import { Meteor } from 'meteor/meteor';

import { initObserver } from '/imports/observer/mutationObserver';
import { renderTable } from '/imports/ui/table';

/* ============================================================================
 * STARTUP
 * ========================================================================== */

Meteor.startup(() => {
  // UI
  try {
    renderTable();
  } catch (err) {
    console.error('[startup] renderTable failed', err);
    throw err;
  }

  // Observer
  try {
    initObserver();
  } catch (err) {
    console.error('[startup] initObserver failed', err);
    throw err;
  }
});

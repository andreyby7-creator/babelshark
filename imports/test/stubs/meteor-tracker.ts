/**
 * @file Заглушка для `meteor/tracker` (unit-тесты).
 *
 * @remarks
 * - Нужна, чтобы Vitest/Vite резолвили `import { Tracker } from 'meteor/tracker'` без рантайма Meteor
 *   (например, `imports/ui/table.ts` вызывает `Tracker.autorun`).
 * - Маркер модуля и поле на handle возврата (см. экспорты ниже) — чтобы не путать стаб с рантаймом.
 * - Функции сброса и чтения журнала порядка вызовов `autorun` — для assert в сложных тестах
 *   (callback по-прежнему один синхронный вызов на каждый `autorun`).
 * - Реальный реактивный цикл здесь не моделируем.
 */

/* ============================================================================
 * МАРКЕР МОДУЛЯ (НЕ ПУТАТЬ С РЕАЛЬНЫМ meteor/tracker)
 * ========================================================================== */

/** Явный маркер модуля-стаба (импорт из `meteor/tracker` в Vitest). */
export const METEOR_TRACKER_VITEST_STUB = true as const;

/* ============================================================================
 * ОЧЕРЕДЬ ВЫЗОВОВ autorun (ДЛЯ СЛОЖНЫХ ТЕСТОВ)
 * ========================================================================== */

const autorunInvocationOrder: number[] = [];
let autorunSeq = 0;

/** Сбрасывает журнал порядка вызовов `Tracker.autorun`. */
export function resetTrackerStubAutorunQueue(): void {
  autorunInvocationOrder.length = 0;
  autorunSeq = 0;
}

/**
 * Монотонные id вызовов `Tracker.autorun` в порядке исполнения (для assert порядка в тестах).
 *
 * @returns Копия массива id (например, `[1, 2]` после двух подряд `autorun`).
 */
export function getTrackerStubAutorunInvocationOrder(): readonly number[] {
  return [...autorunInvocationOrder];
}

/* ============================================================================
 * TRACKER (ЗАГЛУШКА ДЛЯ VITEST)
 * ========================================================================== */

export const Tracker = {
  autorun: (fn: () => void) => {
    const id = ++autorunSeq;
    autorunInvocationOrder.push(id);
    fn();
    return {
      stop: () => {
        void 0;
      },
      __VITEST_TRACKER_STUB: true as const,
    };
  },
};

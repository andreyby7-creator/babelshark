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

/** Колбэки, зарегистрированные через `Tracker.autorun` (для интеграционных тестов). */
const autorunRegistry: (() => void)[] = [];

/** Сбрасывает журнал порядка вызовов `Tracker.autorun`. */
export function resetTrackerStubAutorunQueue(): void {
  autorunInvocationOrder.length = 0;
  autorunSeq = 0;
}

/** Сбрасывает реестр колбэков `autorun` (между тестами). */
export function resetTrackerAutorunRegistryForTests(): void {
  autorunRegistry.length = 0;
}

/**
 * Повторно вызывает все зарегистрированные `Tracker.autorun` (имитация инвалидации Minimongo).
 * Нужен для интеграционных тестов без реального Meteor: после `setStubData` вызвать flush — таблица перерисуется.
 */
export function flushTrackerAutorunsForTests(): void {
  for (const fn of autorunRegistry) {
    fn();
  }
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
    autorunRegistry.push(fn);
    fn();
    return {
      stop: () => {
        void 0;
      },
      __VITEST_TRACKER_STUB: true as const,
    };
  },
};

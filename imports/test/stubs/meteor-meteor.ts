/**
 * @file Заглушка для `meteor/meteor` (unit-тесты).
 *
 * @remarks
 * - Нужна, чтобы Vitest/Vite резолвили `import { Meteor } from 'meteor/meteor'` без рантайма Meteor.
 * - `Meteor.startup` вызывает callback **синхронно** — предсказуемо для тестов без `vi.doMock`.
 * - Возврат `Meteor.subscribe` помечен для assert (см. поле на объекте ниже).
 * - Точечные сценарии по-прежнему можно переопределять через `vi.doMock('meteor/meteor', …)`.
 */

/* ============================================================================
 * METEOR (ЗАГЛУШКА ДЛЯ VITEST)
 * ========================================================================== */

export const Meteor = {
  startup: (cb: () => void) => {
    cb();
  },

  subscribe: (_name: string, ..._args: unknown[]) => {
    void _name;
    void _args;
    return {
      ready: () => true,
      stop: () => {
        void 0;
      },
      __VITEST_METEOR_SUBSCRIBE_STUB: true as const,
    };
  },
};

/**
 * @file Заглушка для `meteor/mongo` (unit-тесты).
 *
 * @remarks
 * - Нужна, чтобы Vitest/Vite резолвили `import { Mongo } from 'meteor/mongo'` без рантайма Meteor
 *   (например, `imports/api/collections.ts` создаёт `new Mongo.Collection(...)`).
 * - Маркеры модуля, класса коллекции и экземпляра (см. экспорты ниже) — чтобы не путать стаб с реальным Mongo.
 * - Данные для `find().fetch()`: по умолчанию `[]`; для сценариев — `setStubData` / `resetStubData` (глобальный буфер,
 *   как `setVlaskyMysqlStubSelectRows` у `vlasky:mysql`).
 * - Реальную реактивность и серверный Mongo здесь не моделируем.
 */

/* ============================================================================
 * МАРКЕР МОДУЛЯ (НЕ ПУТАТЬ С РЕАЛЬНЫМ meteor/mongo)
 * ========================================================================== */

/** Явный маркер модуля-стаба (импорт из `meteor/mongo` в Vitest). */
export const METEOR_MONGO_VITEST_STUB = true as const;

/* ============================================================================
 * СОСТОЯНИЕ И ХЕЛПЕРЫ ДЛЯ ТЕСТОВ
 * ========================================================================== */

let stubFetchRows: unknown[] | undefined;

/**
 * Задаёт массив документов, который вернёт `find().fetch()` у любой коллекции-стаба (до `resetStubData`).
 *
 * @param data — строки результата (как после fetch в Minimongo).
 */
export function setStubData(data: unknown[]): void {
  stubFetchRows = data;
}

/** Сбрасывает буфер: `find().fetch()` снова возвращает `[]`. */
export function resetStubData(): void {
  stubFetchRows = undefined;
}

/* ============================================================================
 * MONGO (ЗАГЛУШКА ДЛЯ VITEST)
 * ========================================================================== */

export const Mongo = {
  Collection: class Collection<T> {
    /** Маркер класса коллекции-стаба. */
    static readonly __VITEST_MONGO_COLLECTION_STUB = true as const;

    constructor(_name: string) {
      void _name;
    }

    /** Маркер экземпляра стаба (отладка / `expect(col.__VITEST_MONGO_STUB)`). */
    readonly __VITEST_MONGO_STUB = true as const;

    find(_selector?: unknown) {
      void _selector;
      return {
        fetch: (): T[] => (stubFetchRows ?? []) as T[],
      };
    }
  },
};

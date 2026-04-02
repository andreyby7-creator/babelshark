/**
 * @file Заглушка Vitest для `meteor/vlasky:mysql` (alias в `vitest.config.ts`).
 *
 * @remarks
 * - Экспорт **`VLASKY_MYSQL_VITEST_STUB`** и поле класса **`__VITEST_VLASKY_MYSQL_STUB`** — чтобы не путать с рантаймом Meteor.
 * - Для разных наборов строк: `setVlaskyMysqlStubSelectRows` / `resetVlaskyMysqlStub`; для явного `T[]` в тестах —
 *   `vlaskyMysqlStubSelectAsArray` (в ambient **нет** второй перегрузки `select → T[]`, см. комментарий в `.d.ts`).
 * - API зеркалит **`LiveMysql` / `LiveMysqlKeySelector`** (реальный пакет — `@vlasky/mysql-live-select`).
 * - **Async cursor (`Promise<Mongo.Cursor>`):** при появлении async-публикаций — расширить stub и ambient.
 */
import type { Mongo } from 'meteor/mongo';

/** Дублирует `MySQLOptions` из `imports/types/meteor-vlasky-mysql.d.ts` — без импорта из `meteor/vlasky:mysql`, иначе при резолве через `tsconfig.madge.json` получился бы цикл. */
interface MySQLOptions {
  readonly host?: string;
  readonly user?: string;
  readonly password?: string;
  readonly database?: string;
  readonly port?: number;
}

/* ============================================================================
 * МАРКЕР МОДУЛЯ (НЕ ПУТАТЬ С РЕАЛЬНЫМ meteor/vlasky:mysql)
 * ========================================================================== */

/** Явный маркер модуля-стаба (импорт из `meteor/vlasky:mysql` в Vitest). */
export const VLASKY_MYSQL_VITEST_STUB = true as const;

/* ============================================================================
 * СОСТОЯНИЕ И ХЕЛПЕРЫ ДЛЯ ТЕСТОВ
 * ========================================================================== */

type Row = Record<string, unknown>;

let stubSelectRows: Row[] | undefined;

type KeySelectorFn = (cases: unknown) => unknown;

/**
 * Задаёт массив строк, который `LiveMysql#select` вернёт как cursor-подобное значение (до следующего `reset`).
 *
 * @param rows — строки результата SELECT.
 */
export function setVlaskyMysqlStubSelectRows(rows: Row[]): void {
  stubSelectRows = rows;
}

/** Сбрасывает поведение стаба: `select` снова возвращает пустой cursor. */
export function resetVlaskyMysqlStub(): void {
  stubSelectRows = undefined;
}

/* ============================================================================
 * LiveMysqlKeySelector (заглушка под реальный namespace)
 * ========================================================================== */

export const LiveMysqlKeySelector = {
  Index(): KeySelectorFn {
    return (): unknown => ({});
  },
  Columns(columnList: string[]): KeySelectorFn {
    void columnList;
    return (): unknown => ({});
  },
  Func(keyFunc: (row: Record<string, unknown>, index: number) => string): KeySelectorFn {
    void keyFunc;
    return (): unknown => ({});
  },
};

/* ============================================================================
 * КЛАСС LiveMysql (ЗАГЛУШКА)
 * ========================================================================== */

export class LiveMysql {
  /**
   * @param _options — как в реальном `vlasky:mysql` (в стабе не используется).
   */
  constructor(_options?: MySQLOptions) {
    void _options;
  }

  /** Маркер экземпляра стаба (отладка / `expect(db.__VITEST_VLASKY_MYSQL_STUB)`). */
  readonly __VITEST_VLASKY_MYSQL_STUB = true as const;

  /**
   * @param _query — SQL (в stub не используется, кроме сценария через `setVlaskyMysqlStubSelectRows`).
   * @param _values — параметры prepared statement (в stub не используются).
   * @param _keySelector — key selector из `LiveMysqlKeySelector` (в stub не используется).
   * @param _triggers — binlog-триггеры (в stub не используются).
   * @returns Заглушка под cursor для `Meteor.publish(...)`.
   */
  select(
    _query: string,
    _values: object | null | undefined,
    _keySelector: KeySelectorFn,
    _triggers: { table: string; }[],
    _minInterval?: number,
  ): Mongo.Cursor<Row> {
    void _query;
    void _values;
    void _keySelector;
    void _triggers;
    void _minInterval;
    const rows = stubSelectRows ?? [];
    return rows as unknown as Mongo.Cursor<Row>;
  }
}

/* ============================================================================
 * ТЕСТОВЫЙ ХЕЛПЕР — T[] (только stub, не в ambient)
 * ========================================================================== */

/**
 * Явно приводит результат `LiveMysql#select` к **`T[]`** в юнит-тестах.
 *
 * @remarks
 * - В `imports/types/meteor-vlasky-mysql.d.ts` объявлен только возврат `LiveMysqlSelectHandle` — без второй перегрузки `T[]`.
 * - Здесь каст **локализован** и помечен как тестовый.
 *
 * @param db — экземпляр стаба `LiveMysql`.
 * @param sql — SQL (в стабе часто игнорируется).
 * @param values — опциональные параметры prepared statement.
 */
export function vlaskyMysqlStubSelectAsArray<T extends Record<string, unknown>>(
  db: LiveMysql,
  sql: string,
  values?: object | null,
): T[] {
  return db.select(sql, values, LiveMysqlKeySelector.Index(), [{
    table: '_vitest',
  }]) as unknown as T[];
}

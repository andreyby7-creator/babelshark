declare module 'meteor/vlasky:mysql' {
  /**
   * Типы для Meteor-пакета `vlasky:mysql` (ambient declaration).
   *
   * @remarks
   * - Официальных TS-типов у пакета нет; декларация нужна, чтобы `tsc` (вне сборки Meteor)
   *   видел модуль `meteor/vlasky:mysql`.
   * - Реальный пакет реэкспортирует **`LiveMysql`** / **`LiveMysqlKeySelector`** из `@vlasky/mysql-live-select`
   *   (см. `select(query, values, keySelector, triggers)` и binlog-триггеры по таблицам).
   * - **SRP:** только типы; стабы и хелперы — в `imports/test/stubs/`, рантайм — в Meteor.
   * - **Vitest:** заглушка модуля `meteor/vlasky:mysql` — `imports/test/stubs/meteor-vlasky-mysql.ts`
   *   (alias в `vitest.config.ts` → `resolve.alias['meteor/vlasky:mysql']`).
   * - Вторую перегрузку `select → T[]` **не объявляем** — массив в тестах см. `vlaskyMysqlStubSelectAsArray` в стабе.
   *
   * @see `imports/test/stubs/meteor-vlasky-mysql.ts` — Vitest-заглушка `meteor/vlasky:mysql`; alias в `vitest.config.ts` (`resolve.alias`).
   */

  /* ============================================================================
   * ПАРАМЕТРЫ ПОДКЛЮЧЕНИЯ (MySQLOptions)
   * ========================================================================== */

  export interface MySQLOptions {
    /** Хост MySQL (например 127.0.0.1). */
    readonly host?: string;
    /** Пользователь MySQL (например root). */
    readonly user?: string;
    /** Пароль MySQL. */
    readonly password?: string;
    /** Имя базы (например babel). */
    readonly database?: string;
    /** Порт MySQL (часто 3306). */
    readonly port?: number;
    /** Кодировка соединения (как в mysql2), например `utf8mb4`. */
    readonly charset?: string;
  }

  /** Триггер binlog для `LiveMysql#select` (минимум `table`). */
  export interface LiveMysqlTrigger {
    readonly database?: string;
    readonly table: string;
    readonly condition?: (...args: unknown[]) => boolean;
  }

  export type LiveMysqlKeySelectorFn = (cases: unknown) => unknown;

  export const LiveMysqlKeySelector: {
    Index(): LiveMysqlKeySelectorFn;
    Columns(columnList: string[]): LiveMysqlKeySelectorFn;
    Func(keyFunc: (row: Record<string, unknown>, index: number) => string): LiveMysqlKeySelectorFn;
  };

  /** Результат `select` с `_publishCursor` для `Meteor.publish` (каст к `Mongo.Cursor` в `publications.ts`). */
  export interface LiveMysqlSelectHandle {
    _publishCursor(sub: unknown): Promise<void>;
  }

  /* ============================================================================
   * КЛАСС LiveMysql (`@vlasky/mysql-live-select`)
   * ========================================================================== */

  export class LiveMysql {
    /**
     * Подключение к MySQL + binlog (реактивные SELECT для публикаций).
     *
     * @param options — параметры подключения (в TS помечены `readonly`, мутация конфига не поощряется).
     */
    constructor(options: MySQLOptions);

    /**
     * Реактивный SELECT для публикации: keySelector + непустой `triggers` по таблицам JOIN.
     *
     * @param query — SQL (часто с `trim()` у многострочного литерала).
     * @param values — `undefined` / `null` / объект параметров prepared statement (как в драйвере).
     * @param keySelector — результат `LiveMysqlKeySelector.Columns([...])` и т.п.
     * @param triggers — минимум по одному `{ table }` на затронутые таблицы (customers, positions).
     * @param minInterval — опционально (debounce перезапроса в ms).
     */
    select(
      query: string,
      values: object | null | undefined,
      keySelector: LiveMysqlKeySelectorFn,
      triggers: LiveMysqlTrigger[],
      minInterval?: number,
    ): LiveMysqlSelectHandle;
  }
}

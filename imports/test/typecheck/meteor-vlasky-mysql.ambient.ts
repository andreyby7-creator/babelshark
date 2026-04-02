/**
 * @file Compile-time проверки ambient-модуля `meteor/vlasky:mysql`.
 *
 * @internal Только проверка типов (`pnpm run type-check`), не рантайм и не Vitest.
 *
 * @remarks
 * - Для проверки используется `pnpm run type-check` (`tsc --noEmit`).
 * - Сигнатура `select` — как у `@vlasky/mysql-live-select` (keySelector + triggers + `LiveMysqlSelectHandle`).
 * - Различие **mutable vs `readonly`** в `MySQLOptions` без присвоения надёжно не проверить; поля задаются в `.d.ts`.
 *
 * @see `imports/test/stubs/meteor-vlasky-mysql.ts` — Vitest-заглушка и `vlaskyMysqlStubSelectAsArray`.
 */
import type {
  LiveMysql,
  LiveMysqlKeySelectorFn,
  LiveMysqlSelectHandle,
  LiveMysqlTrigger,
  MySQLOptions,
} from 'meteor/vlasky:mysql';

/* ============================================================================
 * MySQLOptions (литерал)
 * ========================================================================== */

/** Литерал опций для compile-time проверки `satisfies MySQLOptions`. */
export const vlaskyMysqlOptsFixture = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'babel',
  port: 3306,
} satisfies MySQLOptions;

export type VlaskyMysqlOptsFixture = typeof vlaskyMysqlOptsFixture;

/* ============================================================================
 * SELECT — сигнатура `LiveMysql#select`
 * ========================================================================== */

const keySelectorFixture: LiveMysqlKeySelectorFn = (): unknown => ({});

const triggersFixture: LiveMysqlTrigger[] = [{ table: 't' }];

/**
 * Проверяет, что `select` возвращает `LiveMysqlSelectHandle` (путь pub/sub + `_publishCursor`).
 *
 * @param db — экземпляр `LiveMysql` (в приложении — из `mysql.ts`).
 */
export function typecheckVlaskyMysqlSelectReturn(db: LiveMysql): LiveMysqlSelectHandle {
  return db.select(
    'SELECT id, name FROM t',
    undefined,
    keySelectorFixture,
    triggersFixture,
  );
}

/* ============================================================================
 * Сводный тип (навигация в IDE)
 * ========================================================================== */

/** Сводка артефактов, успешно прошедших компиляцию (см. @file). */
export type VlaskyMysqlAmbientCompileOk = [
  typeof vlaskyMysqlOptsFixture,
  ReturnType<typeof typecheckVlaskyMysqlSelectReturn>,
];

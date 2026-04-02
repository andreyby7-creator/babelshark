/**
 * @file Юнит-тесты рантайма заглушки `meteor/vlasky:mysql` (Vitest).
 *
 * @remarks
 * - Импорт из **файла** стаба (не из alias), чтобы тестировать именно `imports/test/stubs/meteor-vlasky-mysql.ts`.
 * - Типы ambient-модуля проверяются отдельно: `imports/test/typecheck/meteor-vlasky-mysql.ambient.ts` + `pnpm run type-check`.
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  LiveMysql,
  LiveMysqlKeySelector,
  resetVlaskyMysqlStub,
  setVlaskyMysqlStubSelectRows,
  VLASKY_MYSQL_VITEST_STUB,
  vlaskyMysqlStubSelectAsArray,
} from '../../stubs/meteor-vlasky-mysql';

const stubTriggers = [{ table: 't' }] as const;

describe('meteor-vlasky-mysql stub (Vitest)', () => {
  afterEach(() => {
    resetVlaskyMysqlStub();
  });

  it('экспортирует маркер модуля VLASKY_MYSQL_VITEST_STUB', () => {
    expect(VLASKY_MYSQL_VITEST_STUB).toBe(true);
  });

  it('экземпляр LiveMysql помечен __VITEST_VLASKY_MYSQL_STUB', () => {
    const db = new LiveMysql({});
    expect(db.__VITEST_VLASKY_MYSQL_STUB).toBe(true);
  });

  it('LiveMysqlKeySelector.Index / Columns / Func — вложенные key selector вызываются', () => {
    const idxKs = LiveMysqlKeySelector.Index();
    expect(idxKs(undefined)).toEqual({});

    const colKs = LiveMysqlKeySelector.Columns(['_id', 'name']);
    expect(colKs(undefined)).toEqual({});

    const funcKs = LiveMysqlKeySelector.Func((_row, i) => `k${String(i)}`);
    expect(funcKs(undefined)).toEqual({});
  });

  it('select без set возвращает пустой массив (как cursor-заглушка)', () => {
    const db = new LiveMysql({});
    expect(db.select('SELECT 1', undefined, LiveMysqlKeySelector.Index(), [...stubTriggers]))
      .toEqual([]);
  });

  it('select с minInterval (5-й аргумент) обрабатывается', () => {
    const db = new LiveMysql({});
    expect(
      db.select('SELECT 1', undefined, LiveMysqlKeySelector.Index(), [...stubTriggers], 50),
    ).toEqual([]);
  });

  it('setVlaskyMysqlStubSelectRows задаёт строки, reset очищает', () => {
    const db = new LiveMysql({});
    setVlaskyMysqlStubSelectRows([{ _id: '1', id: 1, full_name: 'A', position: 'P' }]);
    expect(db.select('SELECT *', undefined, LiveMysqlKeySelector.Index(), [...stubTriggers]))
      .toEqual([
        { _id: '1', id: 1, full_name: 'A', position: 'P' },
      ]);
    resetVlaskyMysqlStub();
    expect(db.select('SELECT *', undefined, LiveMysqlKeySelector.Index(), [...stubTriggers]))
      .toEqual([]);
  });

  it('vlaskyMysqlStubSelectAsArray — явный T[] для тестов (cast только в stub)', () => {
    const db = new LiveMysql({});
    setVlaskyMysqlStubSelectRows([{ id: 42, name: 'x' }]);
    const rows = vlaskyMysqlStubSelectAsArray<{ id: number; name: string; }>(db, 'SELECT 1');
    expect(rows).toEqual([{ id: 42, name: 'x' }]);
  });
});

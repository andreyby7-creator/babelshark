/**
 * @file Юнит-тесты заглушки `meteor/mongo` (Vitest).
 *
 * @remarks
 * - Импорт из **файла** стаба: `imports/test/stubs/meteor-mongo.ts` (alias в `vitest.config.ts`).
 * - Фиксируем контракт дефолтного стаба для `Mongo.Collection` в unit-тестах без Meteor.
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  METEOR_MONGO_VITEST_STUB,
  Mongo,
  resetStubData,
  setStubData,
} from '../../stubs/meteor-mongo';

describe('meteor-mongo stub (Vitest)', () => {
  afterEach(() => {
    resetStubData();
  });

  it('экспортирует маркер модуля METEOR_MONGO_VITEST_STUB', () => {
    expect(METEOR_MONGO_VITEST_STUB).toBe(true);
  });

  it('экспортирует Mongo.Collection как конструктор с маркером класса', () => {
    expect(Mongo.Collection).toBeTypeOf('function');
    expect(Mongo.Collection.__VITEST_MONGO_COLLECTION_STUB).toBe(true);
  });

  it('экземпляр помечен __VITEST_MONGO_STUB', () => {
    const col = new Mongo.Collection<{ _id: string; }>('test');
    expect(col.__VITEST_MONGO_STUB).toBe(true);
  });

  it('экземпляр: find().fetch() возвращает пустой массив по умолчанию', () => {
    const col = new Mongo.Collection<{ _id: string; }>('test');
    expect(col.find().fetch()).toEqual([]);
  });

  it('find принимает опциональный selector без падения', () => {
    const col = new Mongo.Collection<{ _id: string; }>('x');
    expect(col.find({ _id: '1' }).fetch()).toEqual([]);
  });

  it('setStubData задаёт данные для find().fetch(), resetStubData очищает', () => {
    interface Row {
      _id: string;
      id: number;
    }
    setStubData([{ _id: '1', id: 1 }]);

    const col = new Mongo.Collection<Row>('c');
    expect(col.find().fetch()).toEqual([{ _id: '1', id: 1 }]);

    resetStubData();
    expect(col.find().fetch()).toEqual([]);
  });
});

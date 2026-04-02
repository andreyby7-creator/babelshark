/**
 * @file Юнит-тесты заглушки `meteor/meteor` (Vitest).
 *
 * @remarks
 * - Импорт из **файла** стаба: `imports/test/stubs/meteor-meteor.ts` (alias в `vitest.config.ts`).
 * - В части тестов `Meteor` подменяют через `vi.doMock('meteor/meteor', …)`; здесь контракт **дефолтного** стаба.
 */
import { describe, expect, it, vi } from 'vitest';

import { Meteor } from '../../stubs/meteor-meteor';

describe('meteor-meteor stub (Vitest)', () => {
  it('экспортирует Meteor.startup как функцию', () => {
    expect(Meteor.startup).toBeTypeOf('function');
  });

  it('Meteor.startup вызывает callback синхронно один раз', () => {
    const cb = vi.fn();
    Meteor.startup(cb);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('Meteor.subscribe возвращает ready, stop и маркер __VITEST_METEOR_SUBSCRIBE_STUB', () => {
    const h = Meteor.subscribe('x');
    expect(h.ready()).toBe(true);
    expect(typeof h.stop).toBe('function');
    expect(h.__VITEST_METEOR_SUBSCRIBE_STUB).toBe(true);
    expect(() => {
      h.stop();
    }).not.toThrow();
  });
});

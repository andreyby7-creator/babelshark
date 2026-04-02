/**
 * @file Юнит-тесты заглушки `meteor/tracker` (Vitest).
 *
 * @remarks
 * - Импорт из **файла** стаба: `imports/test/stubs/meteor-tracker.ts` (alias в `vitest.config.ts`).
 * - Фиксируем контракт дефолтного стаба для `Tracker.autorun` в unit-тестах без Meteor.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTrackerStubAutorunInvocationOrder,
  METEOR_TRACKER_VITEST_STUB,
  resetTrackerStubAutorunQueue,
  Tracker,
} from '../../stubs/meteor-tracker';

describe('meteor-tracker stub (Vitest)', () => {
  beforeEach(() => {
    resetTrackerStubAutorunQueue();
  });

  afterEach(() => {
    resetTrackerStubAutorunQueue();
  });

  it('экспортирует маркер модуля METEOR_TRACKER_VITEST_STUB', () => {
    expect(METEOR_TRACKER_VITEST_STUB).toBe(true);
  });

  it('экспортирует Tracker.autorun как функцию', () => {
    expect(Tracker.autorun).toBeTypeOf('function');
  });

  it('Tracker.autorun вызывает callback синхронно один раз', () => {
    const fn = vi.fn();
    Tracker.autorun(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('Tracker.autorun возвращает handle с stop и маркером __VITEST_TRACKER_STUB', () => {
    const handle = Tracker.autorun(() => {
      void 0;
    });
    expect(typeof handle.stop).toBe('function');
    expect(handle.__VITEST_TRACKER_STUB).toBe(true);
    expect(() => {
      handle.stop();
    }).not.toThrow();
  });

  it('журнал порядка: два autorun подряд даёт возрастающие id', () => {
    Tracker.autorun(() => {
      void 0;
    });
    Tracker.autorun(() => {
      void 0;
    });
    expect(getTrackerStubAutorunInvocationOrder()).toEqual([1, 2]);
  });
});

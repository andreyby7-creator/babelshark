import { describe, expect, it, vi } from 'vitest';

import { CUSTOMERS_COLLECTION } from '/imports/api/constants/customers-collection';
import { CUSTOMERS_WITH_POSITIONS_SQL } from '/imports/api/repositories/customers-repo';

type PublishFn = (this: unknown) => unknown;

/** Минимальный контекст `this` для `Meteor.publish` (расширять при использовании в `publications.ts`). */
function createPublicationThis() {
  return {
    userId: null as string | null,
    added: vi.fn(),
    changed: vi.fn(),
    removed: vi.fn(),
    ready: vi.fn(),
    onStop: vi.fn(),
    stop: vi.fn(),
  };
}

describe('publications.ts (Meteor.publish)', () => {
  it('регистрирует публикацию и вызывает db.select с SQL, keySelector и triggers', async () => {
    vi.resetModules();

    const select = vi.fn(() => []);
    vi.doMock('/imports/api/mysql', () => ({
      db: { select },
    }));

    const publish = vi.fn((_name: string, fn: PublishFn) => {
      void fn;
      return undefined;
    });

    vi.doMock('meteor/meteor', () => ({
      Meteor: {
        publish,
      },
    }));

    await import('/imports/api/publications');

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(CUSTOMERS_COLLECTION, expect.any(Function));

    const handler = publish.mock.calls[0]?.[1];
    expect(handler).toBeTypeOf('function');

    const subscriptionThis = createPublicationThis();
    const result = handler!.call(subscriptionThis);

    expect(select).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith(
      CUSTOMERS_WITH_POSITIONS_SQL.trim(),
      undefined,
      expect.any(Function),
      [{ table: 'customers' }, { table: 'positions' }],
    );
    expect(result).toEqual([]);
  });
});

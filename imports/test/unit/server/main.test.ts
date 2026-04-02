import { describe, expect, it, vi } from 'vitest';

describe('server/main.ts (server startup)', () => {
  it('инициализирует TypeORM на старте', async () => {
    vi.resetModules();

    const startup = vi.fn();
    let startupCallback: (() => Promise<void>) | undefined;

    startup.mockImplementation((cb: () => Promise<void>) => {
      startupCallback = cb;
    });

    const initTypeORM = vi.fn(() => Promise.resolve());

    vi.doMock('meteor/meteor', () => ({ Meteor: { startup } }));
    vi.doMock('/imports/api/methods', () => ({}));
    vi.doMock('/imports/api/publications', () => ({}));
    vi.doMock('../../../../server/typeorm', () => ({ initTypeORM }));

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await import('../../../../server/main');

    expect(startup).toHaveBeenCalledTimes(1);
    expect(startupCallback).toBeTypeOf('function');

    await startupCallback?.();

    expect(initTypeORM).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('[startup] TypeORM initialized');
  });

  it('логирует и пробрасывает ошибку, если initTypeORM падает', async () => {
    vi.resetModules();

    const startup = vi.fn();
    let startupCallback: (() => Promise<void>) | undefined;

    startup.mockImplementation((cb: () => Promise<void>) => {
      startupCallback = cb;
    });

    const initTypeORM = vi.fn(() => Promise.reject(new Error('db down')));

    vi.doMock('meteor/meteor', () => ({ Meteor: { startup } }));
    vi.doMock('/imports/api/methods', () => ({}));
    vi.doMock('/imports/api/publications', () => ({}));
    vi.doMock('../../../../server/typeorm', () => ({ initTypeORM }));

    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await import('../../../../server/main');

    expect(startupCallback).toBeTypeOf('function');

    await expect(startupCallback?.()).rejects.toThrow('db down');
    expect(error).toHaveBeenCalledWith(
      '[startup] TypeORM failed to initialize',
      expect.any(Error),
    );
  });
});

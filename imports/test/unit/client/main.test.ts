/**
 * @file Юнит-тесты `client/main.ts` (клиентский entrypoint Meteor).
 *
 * @remarks
 * - Лежит рядом с зеркалом пути: `client/` → `imports/test/unit/client/`.
 */
import { describe, expect, it, vi } from 'vitest';

describe('client/main.ts (клиентский запуск)', () => {
  it('вызывает renderTable и initObserver внутри Meteor.startup', async () => {
    vi.resetModules();
    const startup = vi.fn();
    let startupCallback: (() => void) | undefined;

    startup.mockImplementation((cb: () => void) => {
      startupCallback = cb;
    });

    const renderTable = vi.fn();
    const initObserver = vi.fn();

    vi.doMock('meteor/meteor', () => ({ Meteor: { startup } }));
    vi.doMock('/imports/ui/table', () => ({ renderTable }));
    vi.doMock('/imports/observer/mutationObserver', () => ({ initObserver }));

    await import('../../../../client/main');

    expect(startup).toHaveBeenCalledTimes(1);
    expect(startupCallback).toBeTypeOf('function');

    startupCallback?.();

    expect(renderTable).toHaveBeenCalledTimes(1);
    expect(initObserver).toHaveBeenCalledTimes(1);
  });

  it('логирует и пробрасывает ошибку, если renderTable падает', async () => {
    vi.resetModules();
    const startup = vi.fn();
    let startupCallback: (() => void) | undefined;

    startup.mockImplementation((cb: () => void) => {
      startupCallback = cb;
    });

    const renderTable = vi.fn(() => {
      throw new Error('render failed');
    });
    const initObserver = vi.fn();

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    vi.doMock('meteor/meteor', () => ({ Meteor: { startup } }));
    vi.doMock('/imports/ui/table', () => ({ renderTable }));
    vi.doMock('/imports/observer/mutationObserver', () => ({ initObserver }));

    await import('../../../../client/main');

    expect(startupCallback).toBeTypeOf('function');

    expect(() => startupCallback?.()).toThrow('render failed');
    expect(consoleError).toHaveBeenCalledWith(
      '[startup] renderTable failed',
      expect.any(Error),
    );
    expect(initObserver).not.toHaveBeenCalled();
  });

  it('логирует и пробрасывает ошибку, если initObserver падает', async () => {
    vi.resetModules();
    const startup = vi.fn();
    let startupCallback: (() => void) | undefined;

    startup.mockImplementation((cb: () => void) => {
      startupCallback = cb;
    });

    const renderTable = vi.fn();
    const initObserver = vi.fn(() => {
      throw new Error('observer failed');
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    vi.doMock('meteor/meteor', () => ({ Meteor: { startup } }));
    vi.doMock('/imports/ui/table', () => ({ renderTable }));
    vi.doMock('/imports/observer/mutationObserver', () => ({ initObserver }));

    await import('../../../../client/main');

    expect(startupCallback).toBeTypeOf('function');

    expect(() => startupCallback?.()).toThrow('observer failed');
    expect(renderTable).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      '[startup] initObserver failed',
      expect.any(Error),
    );
  });
});

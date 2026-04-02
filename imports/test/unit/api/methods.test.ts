import { describe, expect, it, vi } from 'vitest';

type MethodsMap = Record<string, (...args: unknown[]) => unknown>;

describe('methods.ts (Meteor.methods)', () => {
  it('регистрирует метод translatePosition и валидирует аргументы', async () => {
    vi.resetModules();

    let registered: MethodsMap | undefined;

    class MeteorError extends Error {
      public readonly error: string;
      public readonly reason: string | undefined;

      public constructor(error: string, reason?: string) {
        super(reason);
        this.name = 'Meteor.Error';
        this.error = error;
        this.reason = reason;
      }
    }

    const methods = vi.fn((map: MethodsMap) => {
      registered = map;
    });

    vi.doMock('meteor/meteor', () => ({
      Meteor: {
        Error: MeteorError,
        methods,
      },
    }));

    const normalizeSource = vi.fn((s: string) => `norm:${s}`);
    vi.doMock('/imports/api/utils/normalize', () => ({ normalizeSource }));

    const translatePosition = vi.fn((normalized: string, original: string) => {
      return Promise.resolve(`t:${normalized}:${original}`);
    });
    vi.doMock('/imports/api/services/translation-service', () => ({ translatePosition }));

    await import('/imports/api/methods');

    expect(methods).toHaveBeenCalledTimes(1);
    expect(registered?.['translatePosition']).toBeTypeOf('function');
    const callMethod = registered?.['translatePosition'];
    expect(callMethod).toBeTypeOf('function');

    // 1) invalid type
    await expect(callMethod!(123)).rejects.toMatchObject({
      name: 'Meteor.Error',
      error: 'invalid-arg',
    });

    // 2) too long
    const long = 'x'.repeat(256);
    await expect(callMethod!(long)).rejects.toMatchObject({
      name: 'Meteor.Error',
      error: 'invalid-arg',
    });

    // 3) ok path: normalize + service call
    await expect(callMethod!('Dev')).resolves.toBe('t:norm:Dev:Dev');
    expect(normalizeSource).toHaveBeenCalledWith('Dev');
    expect(translatePosition).toHaveBeenCalledWith('norm:Dev', 'Dev');
  });
});

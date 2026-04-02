import { afterEach, describe, expect, it, vi } from 'vitest';

type OnceListener = (...args: unknown[]) => void;

/** Мок `typeorm` с сохранением опций конструктора (проверка env → port/host). */
function mockTypeormDataSource() {
  vi.doMock('typeorm', () => ({
    DataSource: class DataSource {
      public isInitialized = false;
      public initialize = vi.fn(() => Promise.resolve());
      public destroy = vi.fn(() => Promise.resolve());
      public options: unknown;
      public constructor(options: unknown) {
        this.options = options;
      }
    },
  }));
}

function mockTranslationEntity() {
  vi.doMock('/imports/api/entities/Translation', () => ({
    Translation: { useDataSource: vi.fn() },
  }));
}

describe('server/typeorm.ts (конфиг порта из DB_PORT)', () => {
  const snapshotDbPort = process.env['DB_PORT'];

  afterEach(() => {
    if (snapshotDbPort === undefined) delete process.env['DB_PORT'];
    else process.env['DB_PORT'] = snapshotDbPort;
  });

  it('DB_PORT не задан → порт 3306 в DataSource', async () => {
    vi.resetModules();
    delete process.env['DB_PORT'];
    mockTypeormDataSource();
    mockTranslationEntity();
    const { AppDataSource } = await import('../../../../server/typeorm');
    expect(
      (AppDataSource as unknown as { options: { port: number; }; }).options.port,
    ).toBe(3306);
  });

  it('DB_PORT пустая строка → порт 3306', async () => {
    vi.resetModules();
    process.env['DB_PORT'] = '';
    mockTypeormDataSource();
    mockTranslationEntity();
    const { AppDataSource } = await import('../../../../server/typeorm');
    expect(
      (AppDataSource as unknown as { options: { port: number; }; }).options.port,
    ).toBe(3306);
  });

  it('DB_PORT валидный → используется в DataSource', async () => {
    vi.resetModules();
    process.env['DB_PORT'] = '3308';
    mockTypeormDataSource();
    mockTranslationEntity();
    const { AppDataSource } = await import('../../../../server/typeorm');
    expect(
      (AppDataSource as unknown as { options: { port: number; }; }).options.port,
    ).toBe(3308);
  });

  it('DB_PORT невалидный (0) → fallback 3306', async () => {
    vi.resetModules();
    process.env['DB_PORT'] = '0';
    mockTypeormDataSource();
    mockTranslationEntity();
    const { AppDataSource } = await import('../../../../server/typeorm');
    expect(
      (AppDataSource as unknown as { options: { port: number; }; }).options.port,
    ).toBe(3306);
  });
});

describe('server/typeorm.ts (TypeORM singleton)', () => {
  it('initTypeORM: инициализирует DataSource, вызывает Translation.useDataSource, логирует успех', async () => {
    vi.resetModules();

    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const initialize = vi.fn(function initializeImpl(this: { isInitialized: boolean; }) {
      this.isInitialized = true;
      return Promise.resolve();
    });

    const destroy = vi.fn(() => Promise.resolve());
    const useDataSource = vi.fn();

    vi.doMock('/imports/api/entities/Translation', () => {
      class Translation {
        public __brand = 'Translation';
        public static useDataSource = useDataSource;
      }
      return { Translation };
    });

    vi.doMock('typeorm', () => ({
      DataSource: class DataSource {
        public isInitialized = false;
        public initialize = initialize;
        public destroy = destroy;
        public options: unknown;
        public constructor(options: unknown) {
          this.options = options;
        }
      },
    }));

    const { AppDataSource, initTypeORM } = await import('../../../../server/typeorm');

    expect(AppDataSource.isInitialized).toBe(false);
    await initTypeORM();
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(AppDataSource.isInitialized).toBe(true);
    expect(useDataSource).toHaveBeenCalledTimes(1);
    expect(useDataSource).toHaveBeenCalledWith(AppDataSource);
    expect(consoleLog).toHaveBeenCalledWith('[TypeORM] DataSource initialized');

    await initTypeORM();
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(useDataSource).toHaveBeenCalledTimes(1);
  });

  it('initTypeORM: при падении initialize() не вызывает Translation.useDataSource', async () => {
    vi.resetModules();

    const err = new Error('db down');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const initialize = vi.fn(() => Promise.reject(err));
    const destroy = vi.fn(() => Promise.resolve());
    const useDataSource = vi.fn();

    vi.doMock('/imports/api/entities/Translation', () => {
      class Translation {
        public __brand = 'Translation';
        public static useDataSource = useDataSource;
      }
      return { Translation };
    });

    vi.doMock('typeorm', () => ({
      DataSource: class DataSource {
        public isInitialized = false;
        public initialize = initialize;
        public destroy = destroy;
        public options: unknown;
        public constructor(options: unknown) {
          this.options = options;
        }
      },
    }));

    const { initTypeORM } = await import('../../../../server/typeorm');

    await expect(initTypeORM()).rejects.toThrow('db down');
    expect(consoleError).toHaveBeenCalledWith('[TypeORM] Failed to initialize DataSource', err);
    expect(useDataSource).not.toHaveBeenCalled();
  });

  it('registerTypeORMShutdownHandlers: destroy затем Translation.useDataSource(null)', async () => {
    vi.resetModules();

    const listeners = new Map<string, OnceListener>();
    const processOnce = vi
      .spyOn(process, 'once')
      .mockImplementation((event: string | symbol, listener: OnceListener) => {
        if (typeof event === 'string') {
          listeners.set(event, listener);
        }
        return process;
      });

    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const destroy = vi.fn(function destroyImpl(this: { isInitialized: boolean; }) {
      this.isInitialized = false;
      return Promise.resolve();
    });

    const useDataSource = vi.fn();

    vi.doMock('/imports/api/entities/Translation', () => {
      class Translation {
        public __brand = 'Translation';
        public static useDataSource = useDataSource;
      }
      return { Translation };
    });

    vi.doMock('typeorm', () => ({
      DataSource: class DataSource {
        public isInitialized = false;
        public initialize = vi.fn(() => Promise.resolve());
        public destroy = destroy;
        public options: unknown;
        public constructor(options: unknown) {
          this.options = options;
        }
      },
    }));

    const { AppDataSource, registerTypeORMShutdownHandlers } = await import(
      '../../../../server/typeorm'
    );

    registerTypeORMShutdownHandlers();
    registerTypeORMShutdownHandlers();

    expect(processOnce).toHaveBeenCalledTimes(2);
    expect(listeners.has('SIGINT')).toBe(true);
    expect(listeners.has('SIGTERM')).toBe(true);

    listeners.get('SIGINT')?.();
    await Promise.resolve();
    expect(destroy).not.toHaveBeenCalled();

    (AppDataSource as unknown as { isInitialized: boolean; }).isInitialized = true;
    listeners.get('SIGTERM')?.();
    await Promise.resolve();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(useDataSource).toHaveBeenCalledWith(null);
    expect(consoleLog).toHaveBeenCalledWith('[TypeORM] DataSource destroyed (SIGTERM)');

    destroy.mockRejectedValueOnce(new Error('destroy failed'));
    (AppDataSource as unknown as { isInitialized: boolean; }).isInitialized = true;
    listeners.get('SIGTERM')?.();
    await Promise.resolve();
    expect(consoleError).toHaveBeenCalledWith(
      '[TypeORM] Failed to destroy DataSource (SIGTERM)',
      expect.any(Error),
    );
  });
});

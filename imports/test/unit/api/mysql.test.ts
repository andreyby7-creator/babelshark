import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type EnvKey =
  | 'DB_HOST'
  | 'DB_PORT'
  | 'DB_USER'
  | 'DB_PASS'
  | 'DB_NAME'
  | 'CI'
  | 'NODE_ENV'
  | 'VITEST';

interface EnvSnapshot {
  DB_HOST: string | undefined;
  DB_PORT: string | undefined;
  DB_USER: string | undefined;
  DB_PASS: string | undefined;
  DB_NAME: string | undefined;
  CI: string | undefined;
  NODE_ENV: string | undefined;
  VITEST: string | undefined;
}

function readEnvKey(key: EnvKey): string | undefined {
  switch (key) {
    case 'DB_HOST':
      return process.env['DB_HOST'];
    case 'DB_PORT':
      return process.env['DB_PORT'];
    case 'DB_USER':
      return process.env['DB_USER'];
    case 'DB_PASS':
      return process.env['DB_PASS'];
    case 'DB_NAME':
      return process.env['DB_NAME'];
    case 'CI':
      return process.env['CI'];
    case 'NODE_ENV':
      return process.env['NODE_ENV'];
    case 'VITEST':
      return process.env['VITEST'];
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function setEnvKey(key: EnvKey, value: string | undefined): void {
  switch (key) {
    case 'DB_HOST':
      if (value === undefined) {
        delete process.env['DB_HOST'];
      } else {
        process.env['DB_HOST'] = value;
      }
      break;
    case 'DB_PORT':
      if (value === undefined) {
        delete process.env['DB_PORT'];
      } else {
        process.env['DB_PORT'] = value;
      }
      break;
    case 'DB_USER':
      if (value === undefined) {
        delete process.env['DB_USER'];
      } else {
        process.env['DB_USER'] = value;
      }
      break;
    case 'DB_PASS':
      if (value === undefined) {
        delete process.env['DB_PASS'];
      } else {
        process.env['DB_PASS'] = value;
      }
      break;
    case 'DB_NAME':
      if (value === undefined) {
        delete process.env['DB_NAME'];
      } else {
        process.env['DB_NAME'] = value;
      }
      break;
    case 'CI':
      if (value === undefined) {
        delete process.env['CI'];
      } else {
        process.env['CI'] = value;
      }
      break;
    case 'NODE_ENV':
      if (value === undefined) {
        delete process.env['NODE_ENV'];
      } else {
        process.env['NODE_ENV'] = value;
      }
      break;
    case 'VITEST':
      if (value === undefined) {
        delete process.env['VITEST'];
      } else {
        process.env['VITEST'] = value;
      }
      break;
    default: {
      const _exhaustive: never = key;
      void _exhaustive;
    }
  }
}

function snapshotEnv(): EnvSnapshot {
  return {
    DB_HOST: readEnvKey('DB_HOST'),
    DB_PORT: readEnvKey('DB_PORT'),
    DB_USER: readEnvKey('DB_USER'),
    DB_PASS: readEnvKey('DB_PASS'),
    DB_NAME: readEnvKey('DB_NAME'),
    CI: readEnvKey('CI'),
    NODE_ENV: readEnvKey('NODE_ENV'),
    VITEST: readEnvKey('VITEST'),
  };
}

function restoreEnv(snap: EnvSnapshot): void {
  setEnvKey('DB_HOST', snap.DB_HOST);
  setEnvKey('DB_PORT', snap.DB_PORT);
  setEnvKey('DB_USER', snap.DB_USER);
  setEnvKey('DB_PASS', snap.DB_PASS);
  setEnvKey('DB_NAME', snap.DB_NAME);
  setEnvKey('CI', snap.CI);
  setEnvKey('NODE_ENV', snap.NODE_ENV);
  setEnvKey('VITEST', snap.VITEST);
}

interface MysqlOpts {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

type EnvPatch = Partial<Record<EnvKey, string | undefined>>;

function applyEnvPatch(patch: EnvPatch): void {
  if ('DB_HOST' in patch) setEnvKey('DB_HOST', patch.DB_HOST);
  if ('DB_PORT' in patch) setEnvKey('DB_PORT', patch.DB_PORT);
  if ('DB_USER' in patch) setEnvKey('DB_USER', patch.DB_USER);
  if ('DB_PASS' in patch) setEnvKey('DB_PASS', patch.DB_PASS);
  if ('DB_NAME' in patch) setEnvKey('DB_NAME', patch.DB_NAME);
  if ('CI' in patch) setEnvKey('CI', patch.CI);
  if ('NODE_ENV' in patch) setEnvKey('NODE_ENV', patch.NODE_ENV);
  if ('VITEST' in patch) setEnvKey('VITEST', patch.VITEST);
}

describe('mysql.ts (vlasky:mysql config)', () => {
  let envSnap: EnvSnapshot;

  beforeEach(() => {
    envSnap = snapshotEnv();
  });

  afterEach(() => {
    restoreEnv(envSnap);
    vi.restoreAllMocks();
  });

  /**
   * Поднимает модуль заново с заданным `process.env` и моком `LiveMysql`.
   *
   * @param env — значения env; `undefined` удаляет ключ (как unset).
   * @returns Экспорт `db` и опции, переданные в конструктор `LiveMysql`.
   */
  async function loadMysqlModule(env: EnvPatch): Promise<{
    db: unknown;
    mysqlOptions: MysqlOpts;
  }> {
    applyEnvPatch(env);

    let captured: MysqlOpts | undefined;

    vi.resetModules();
    vi.doMock('meteor/vlasky:mysql', () => ({
      LiveMysql: class MockLiveMysql {
        /** Поле не для логики — только чтобы класс не был «только конструктор» для ESLint. */
        readonly _vitestMock = true;

        constructor(options: MysqlOpts) {
          captured = options;
        }
      },
    }));

    const mod = await import('/imports/api/mysql');
    expect(captured).toBeDefined();
    return { db: mod.db, mysqlOptions: captured! };
  }

  it('дефолты: host/port/user/password/database и без лога при VITEST=true', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);

    const { db, mysqlOptions } = await loadMysqlModule({
      DB_HOST: undefined,
      DB_PORT: undefined,
      DB_USER: undefined,
      DB_PASS: undefined,
      DB_NAME: undefined,
      CI: undefined,
      NODE_ENV: undefined,
      VITEST: 'true',
    });

    expect(db).toBeDefined();

    expect(mysqlOptions).toEqual({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'babel',
    });
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('DB_PORT пустая строка → порт 3306', async () => {
    vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    const { mysqlOptions } = await loadMysqlModule({
      DB_PORT: '',
      VITEST: 'true',
    });
    expect(mysqlOptions.port).toBe(3306);
  });

  it('DB_PORT валидный → используется', async () => {
    vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    const { mysqlOptions } = await loadMysqlModule({
      DB_PORT: '3307',
      VITEST: 'true',
    });
    expect(mysqlOptions.port).toBe(3307);
  });

  it('DB_PORT граница 1 и 65535', async () => {
    vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    const { mysqlOptions: a } = await loadMysqlModule({ DB_PORT: '1', VITEST: 'true' });
    expect(a.port).toBe(1);
    vi.resetModules();
    restoreEnv(envSnap);
    const { mysqlOptions: b } = await loadMysqlModule({ DB_PORT: '65535', VITEST: 'true' });
    expect(b.port).toBe(65535);
  });

  it('DB_PORT невалидный (0, отрицательный, >65535, NaN) → 3306', async () => {
    vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    for (const portVal of ['0', '-1', '65536', 'nope']) {
      vi.resetModules();
      restoreEnv(envSnap);
      const { mysqlOptions } = await loadMysqlModule({ DB_PORT: portVal, VITEST: 'true' });
      expect(mysqlOptions.port).toBe(3306);
    }
  });

  it('переопределение DB_* в опциях конструктора', async () => {
    vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    const { mysqlOptions } = await loadMysqlModule({
      DB_HOST: 'db.example',
      DB_PORT: '3308',
      DB_USER: 'app',
      DB_PASS: 'secret',
      DB_NAME: 'appdb',
      VITEST: 'true',
    });
    expect(mysqlOptions).toEqual({
      host: 'db.example',
      port: 3308,
      user: 'app',
      password: 'secret',
      database: 'appdb',
    });
  });

  it('лог host:port при CI=true и без VITEST', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    await loadMysqlModule({
      DB_HOST: '10.0.0.5',
      DB_PORT: '3309',
      VITEST: undefined,
      CI: 'true',
      NODE_ENV: 'production',
    });
    expect(logSpy).toHaveBeenCalledWith('[db] connecting to 10.0.0.5:3309');
  });

  it('лог при NODE_ENV=development и без VITEST', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    await loadMysqlModule({
      VITEST: undefined,
      CI: undefined,
      NODE_ENV: 'development',
    });
    expect(logSpy).toHaveBeenCalledWith('[db] connecting to 127.0.0.1:3306');
  });

  it('без лога при NODE_ENV=production и без CI и без VITEST', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation((): undefined => undefined);
    await loadMysqlModule({
      VITEST: undefined,
      CI: undefined,
      NODE_ENV: 'production',
    });
    expect(logSpy).not.toHaveBeenCalled();
  });
});

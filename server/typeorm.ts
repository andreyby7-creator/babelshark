/**
 * @file Инициализация TypeORM (server-only).
 *
 * В рамках ТЗ TypeORM используется только для чтения `translations`
 * внутри Meteor.method `translatePosition`.
 *
 * Важно:
 * - параметры подключения берём из `process.env` (без хардкода)
 * - `synchronize: false` всегда (схема создаётся через `private/init.sql`)
 *
 * @remarks
 * - Миграции не ведём через TypeORM: схема задаётся `private/init.sql`.
 * - Production logger не подключаем: для тестового достаточно `console.*`.
 * - После `initialize()` вызывается `Translation.useDataSource(AppDataSource)` (Active Record по ТЗ); при `destroy` — `useDataSource(null)`.
 * - **`connectorPackage: 'mysql2'`** — MySQL 8 / `caching_sha2_password`; старый npm-пакет `mysql` в проекте не используем.
 * - Порт задаётся через **`DB_PORT`** (как в `imports/api/mysql.ts` для `vlasky:mysql`).
 */

import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { Translation } from '/imports/api/entities/Translation';

/* ============================================================================
 * TYPEORM — SINGLETON DATASOURCE
 * ========================================================================== */

// Конфиг БД (env + dev fallback по умолчанию).
const dbHost = process.env['DB_HOST'] ?? '127.0.0.1';
const dbPortRaw = process.env['DB_PORT'];
const dbPortParsed = dbPortRaw === undefined || dbPortRaw === ''
  ? 3306
  : Number.parseInt(dbPortRaw, 10);
const dbPort = Number.isFinite(dbPortParsed) && dbPortParsed > 0 && dbPortParsed <= 65535
  ? dbPortParsed
  : 3306;
const dbUser = process.env['DB_USER'] ?? 'root';
const dbPass = process.env['DB_PASS'] ?? 'root';
const dbName = process.env['DB_NAME'] ?? 'babel';

export const AppDataSource = new DataSource({
  type: 'mysql',
  connectorPackage: 'mysql2',
  host: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPass,
  database: dbName,
  entities: [Translation],
  synchronize: false,
});

/**
 * Инициализирует DataSource один раз (idempotent).
 *
 * @returns Promise, который резолвится после успешной инициализации или сразу, если уже инициализировано
 */
export const initTypeORM = async () => {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      Translation.useDataSource(AppDataSource);
      console.log('[TypeORM] DataSource initialized');
    } catch (err) {
      console.error('[TypeORM] Failed to initialize DataSource', err);
      throw err;
    }
  }
};

/* ============================================================================
 * GRACEFUL SHUTDOWN (опционально)
 * ========================================================================== */

let shutdownHandlersRegistered = false;

/**
 * Регистрирует graceful shutdown для long-running сервера.
 *
 * @returns void
 *
 * @note Опционально для тестового. Не вызывает `process.exit()`.
 */
export const registerTypeORMShutdownHandlers = (): void => {
  if (shutdownHandlersRegistered) return;
  shutdownHandlersRegistered = true;

  const shutdown = async (signal: string): Promise<void> => {
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        Translation.useDataSource(null);
        console.log(`[TypeORM] DataSource destroyed (${signal})`);
      }
    } catch (err) {
      console.error(`[TypeORM] Failed to destroy DataSource (${signal})`, err);
    }
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
};

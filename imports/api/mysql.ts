/**
 * @file Подключение MySQL через `vlasky:mysql`.
 *
 * @remarks
 * - Используется только для публикаций `vlasky:mysql` (реактивный SSOT для customers/positions); класс подключения —
 *   **`LiveMysql`** (пакет `vlasky:mysql` / `@vlasky/mysql-live-select`).
 * - TypeORM для customers/positions не используется (только таблица `translations`).
 * - Локально удобны дефолты; переопределение через env: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
 *   (CI / контейнеры).
 * - Порт по умолчанию **3306** (как в `docker-compose.yml`); `DB_PORT` — опционально.
 * - **Production:** не полагаться на `root`/простые пароли из дефолтов — учётка и секреты из CI/CD (или secret store),
 *   отдельный DB user с минимальными правами.
 * - **Масштабирование:** при росте числа/объёма публикаций — проверить лимиты подключений у `vlasky:mysql`/драйвера
 *   (`maxConnections`, pool и т.п.); при необходимости задать **опциональный `connectionLimit`** (или аналог в API пакета),
 *   если документация/исходники это поддерживают.
 * - **Логирование:** сейчас `console.log` для простоты; для управляемого вывода в prod/CI/dev стоит перейти на `debug`
 *   (или кастомный logger с уровнями), чтобы включать/глушить шум через env/конфиг.
 * - **Dev/CI:** в лог пишем только `host:port` (без user/password), если `CI=true` или `NODE_ENV !== 'production'`;
 *   при `VITEST=true` не пишем, чтобы не засорять вывод юнит-тестов.
 */
import { LiveMysql } from 'meteor/vlasky:mysql';

/* ============================================================================
 * ПОРТ MYSQL (DB_PORT + ДЕФОЛТ 3306)
 * ========================================================================== */

const DEFAULT_MYSQL_PORT = 3306;
const MAX_TCP_PORT = 65535;

/**
 * Читает порт MySQL из `DB_PORT` или возвращает дефолт (детерминированное поведение для локалки).
 *
 * @returns Валидный порт TCP (1…65535) либо `DEFAULT_MYSQL_PORT`.
 */
function resolveMysqlPort(): number {
  const raw = process.env['DB_PORT'];
  if (raw === undefined || raw === '') return DEFAULT_MYSQL_PORT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > MAX_TCP_PORT) return DEFAULT_MYSQL_PORT;
  return n;
}

/* ============================================================================
 * VLASKY:MYSQL — ПОДКЛЮЧЕНИЕ К БД
 * ========================================================================== */

const mysqlHost = process.env['DB_HOST'] ?? '127.0.0.1';
const mysqlPort = resolveMysqlPort();

const shouldLogDbTarget = process.env['VITEST'] !== 'true'
  && (process.env['CI'] === 'true' || process.env['NODE_ENV'] !== 'production');
if (shouldLogDbTarget) {
  // См. @remarks: позже — debug / кастомный logger вместо console.
  console.log(`[db] connecting to ${mysqlHost}:${String(mysqlPort)}`);
}

export const db = new LiveMysql({
  host: mysqlHost,
  port: mysqlPort,
  user: process.env['DB_USER'] ?? 'root',
  password: process.env['DB_PASS'] ?? 'root',
  database: process.env['DB_NAME'] ?? 'babel',
});

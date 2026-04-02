/**
 * @file Meteor publications (server).
 *
 * В рамках ТЗ:
 * - данные клиентов и должностей публикуем реактивно через `vlasky:mysql`
 * - публикация возвращает результат `LiveMysql#select` (cursor с `_publishCursor`), не «сырой» Mongo
 *
 * @remarks
 * - В SELECT обязателен строковый `_id` (например `CAST(c.id AS CHAR) AS _id`) для Minimongo.
 * - SQL держим в одном месте (SSOT) — см. `CUSTOMERS_WITH_POSITIONS_SQL`.
 * - TypeORM здесь не используем (только для `translations`).
 * - API `select` — как в `@vlasky/mysql-live-select`: keySelector + triggers по таблицам JOIN.
 */
import { Meteor } from 'meteor/meteor';
import type { Mongo } from 'meteor/mongo';
import { LiveMysqlKeySelector } from 'meteor/vlasky:mysql';

import { CUSTOMERS_COLLECTION } from './constants/customers-collection';
import { db } from './mysql';
import { CUSTOMERS_WITH_POSITIONS_SQL } from './repositories/customers-repo';

/* ============================================================================
 * LIVE MYSQL — BINLOG TRIGGERS (JOIN customers + positions)
 * ========================================================================== */

const CUSTOMERS_POSITIONS_LIVE_TRIGGERS = [
  { table: 'customers' },
  { table: 'positions' },
] as const;

/* ============================================================================
 * METEOR PUBLICATIONS
 * ========================================================================== */

Meteor.publish(CUSTOMERS_COLLECTION, function() {
  return db.select(
    CUSTOMERS_WITH_POSITIONS_SQL.trim(),
    undefined,
    LiveMysqlKeySelector.Columns(['_id']),
    [...CUSTOMERS_POSITIONS_LIVE_TRIGGERS],
  ) as unknown as Mongo.Cursor<Record<string, unknown>>;
});

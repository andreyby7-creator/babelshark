/**
 * @file SSOT: имя публикации и клиентской Minimongo-коллекции для customers/positions.
 *
 * @remarks
 * - Вынесено из `collections.ts`, чтобы сервер (`publications.ts`) и тесты импортировали строку без `Mongo.Collection`.
 * - Значение должно совпадать с `Meteor.publish` на сервере и с `Mongo.Collection(name)` на клиенте.
 */

/* ============================================================================
 * CUSTOMERS — ИМЯ ПУБЛИКАЦИИ / КОЛЛЕКЦИИ
 * ========================================================================== */

/** Литерал имени: публикация `vlasky:mysql` и клиентская коллекция (ТЗ: совпадают). */
export const CUSTOMERS_COLLECTION = 'customersWithPositions';

/**
 * @file Minimongo: коллекция и типы строки публикации.
 *
 * - `Customer` — доменная форма (camelCase), без привязки к Meteor.
 * - `CustomerRow` — transport/wire: как документ в Minimongo после публикации (`full_name`, `_id` из SQL).
 * - Имя коллекции = имя публикации — см. `imports/api/constants/customers-collection.ts`.
 */

import { Mongo } from 'meteor/mongo';

import { CUSTOMERS_COLLECTION } from './constants/customers-collection';

/* ============================================================================
 * CUSTOMERS — DOMAIN + TRANSPORT
 * ========================================================================== */

/** Доменная модель (UI/логика вне snake_case SQL). */
export interface Customer {
  id: number;
  fullName: string;
  position: string;
}

/**
 * Строка из публикации vlasky:mysql → Minimongo.
 * SSOT по обязательности полей — `private/init.sql` (NOT NULL); типы совпадают со схемой.
 */
export interface CustomerRow {
  _id: string;
  id: number;
  full_name: string;
  position: string;
}

export { CUSTOMERS_COLLECTION };

export const Customers = new Mongo.Collection<CustomerRow>(CUSTOMERS_COLLECTION);

/** Маппинг transport → domain (имена полей). */
export function customerFromRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    position: row.position,
  };
}

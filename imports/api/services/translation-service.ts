/**
 * @file TranslationService (server-only).
 *
 * Минимальный сервис без инфраструктуры:
 * - lookup перевода через TypeORM Active Record (`Translation.findOneBy`, см. `Translation.useDataSource` в `initTypeORM`)
 * - возвращает перевод или fallback на оригинал
 *
 * @remarks
 * - Кэширование на сервере намеренно не внедряем: в рамках ТЗ достаточно client-side cache в observer.
 * - Batch-lookup (`translatePositions`) тоже не делаем: ТЗ не просит, добавим при необходимости нагрузки.
 */

import { Translation } from '/imports/api/entities/Translation';

/* ============================================================================
 * TRANSLATION SERVICE
 * ========================================================================== */

export type TranslationService = Readonly<{
  /**
   * Возвращает перевод для нормализованного source.
   *
   * @param normalizedSource - нормализованный ключ (`trim + lowerCase`)
   * @param originalSource - оригинальная строка (для fallback)
   * @returns перевод, либо `originalSource` если перевод не найден
   *
   * Контракт:
   * - `normalizedSource`: `trim + lowerCase` (используется как ключ lookup/cache)
   * - возвращает `translated`, а если перевод не найден — `originalSource` (fallback)
   */
  translate: (normalizedSource: string, originalSource: string) => Promise<string>;
}>;

/**
 * Перевод должности через таблицу `translations` (TypeORM).
 *
 * @param normalizedSource - нормализованный ключ (`trim + lowerCase`)
 * @param originalSource - оригинальная строка (для fallback)
 * @returns перевод, либо `originalSource` если перевод не найден
 */
export const translatePosition = async (
  normalizedSource: string,
  originalSource: string,
): Promise<string> => {
  const row = await Translation.findOneBy({ source: normalizedSource });

  // Fallback: если перевода нет — возвращаем оригинальный `source`.
  return row?.translated ?? originalSource;
};

export const translationService: TranslationService = {
  translate: translatePosition,
};

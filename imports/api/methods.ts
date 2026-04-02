/**
 * @file Meteor methods (server).
 *
 * В рамках ТЗ:
 * - `translatePosition` читает перевод из MySQL таблицы `translations` через TypeORM
 * - вызывается с клиента через `Meteor.call()`
 *
 * @remarks
 * - Server-side cache намеренно не внедряем: по ТЗ достаточно client-side cache в observer.
 * - Batch API не делаем: ТЗ не просит, добавим при необходимости нагрузки.
 */
import { Meteor } from 'meteor/meteor';

import { translatePosition } from './services/translation-service';
import { normalizeSource } from './utils/normalize';

/* ============================================================================
 * METEOR METHODS
 * ========================================================================== */

const MAX_SOURCE_LENGTH = 255;

Meteor.methods({
  /**
   * Перевод должности (имитация онлайн-переводчика).
   *
   * @param source - исходная строка (ожидаем string; остальные типы отклоняем)
   * @returns перевод, либо исходная строка (fallback), если перевода нет
   *
   * Поведение (в рамках ТЗ):
   * - вход валидируется как строка
   * - строка нормализуется (`trim + lowerCase`) для детерминированного поиска/кэша
   * - перевод читается из таблицы `translations` через TypeORM
   * - если перевода нет — возвращаем fallback (оригинальный `source`)
   */
  async translatePosition(source: unknown): Promise<string> {
    if (typeof source !== 'string') {
      throw new Meteor.Error('invalid-arg', 'source must be string');
    }

    // Safety: ограничиваем размер входа (соответствует VARCHAR(255) в init.sql).
    if (source.length > MAX_SOURCE_LENGTH) {
      throw new Meteor.Error(
        'invalid-arg',
        `source is too long (max ${String(MAX_SOURCE_LENGTH)})`,
      );
    }

    const normalized = normalizeSource(source);
    return await translatePosition(normalized, source);
  },
});

import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @file Entity для таблицы `translations` (TypeORM).
 *
 * Используется только для чтения в Meteor.method `translatePosition` (в рамках ТЗ):
 * - вход: исходная должность (source)
 * - выход: перевод (translated) или fallback на source
 *
 * В текущем ТЗ не используем entity для записи/обновления данных.
 *
 * @remarks
 * - **Active Record (ТЗ):** после `initTypeORM()` вызывается `Translation.useDataSource(AppDataSource)`;
 *   чтение — `Translation.findOneBy({ source })` в `translation-service.ts`.
 * - Нормализацию `source` выполняем в `translatePosition` (entrypoint), не в entity.
 * - TypeORM hooks (`@BeforeInsert/@BeforeUpdate`) не добавляем: в рамках ТЗ таблица read-only.
 */

/* ============================================================================
 * TRANSLATIONS — MYSQL TABLE ENTITY
 * ========================================================================== */

@Entity('translations')
@Index('idx_translation_source', ['source'])
export class Translation extends BaseEntity {
  /** PK (AUTO_INCREMENT) */
  @PrimaryGeneratedColumn()
  id!: number;

  /** Нормализованная исходная строка (trim + lowerCase) */
  @Column()
  source!: string;

  /** Перевод для source */
  @Column()
  translated!: string;
}

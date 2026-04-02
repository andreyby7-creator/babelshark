import 'reflect-metadata';

import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

describe('Translation.ts (TypeORM entity)', () => {
  it('регистрирует таблицу `translations`, колонки и индекс source', async () => {
    vi.resetModules();

    const { Translation } = await import('/imports/api/entities/Translation');

    expect(Translation).toBeTypeOf('function');

    const storage = getMetadataArgsStorage();

    const table = storage.tables.find((t) => t.target === Translation);
    expect(table?.name).toBe('translations');

    const columns = storage.columns.filter((c) => c.target === Translation);
    const columnNames = columns.map((c) => c.propertyName).sort();
    expect(columnNames).toEqual(['id', 'source', 'translated']);

    const primary = storage.generations.find((g) => g.target === Translation);
    expect(primary?.propertyName).toBe('id');

    const index = storage.indices.find((i) => i.target === Translation);
    expect(index?.name).toBe('idx_translation_source');
    expect(index?.columns).toEqual(['source']);
  });
});

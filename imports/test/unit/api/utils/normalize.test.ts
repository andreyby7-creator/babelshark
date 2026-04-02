import { describe, expect, it } from 'vitest';

describe('normalize.ts (normalizeSource)', () => {
  it('делает trim + lowerCase (детерминированный ключ)', async () => {
    const { normalizeSource } = await import('/imports/api/utils/normalize');

    expect(normalizeSource('  DevElOpEr  ')).toBe('developer');
  });

  it('корректно работает с уже нормализованной строкой', async () => {
    const { normalizeSource } = await import('/imports/api/utils/normalize');

    expect(normalizeSource('developer')).toBe('developer');
  });
});

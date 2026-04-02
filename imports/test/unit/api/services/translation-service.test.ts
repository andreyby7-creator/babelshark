import { describe, expect, it, vi } from 'vitest';

describe('translation-service.ts (TranslationService)', () => {
  it('возвращает перевод, если запись найдена', async () => {
    vi.resetModules();

    const findOneBy = vi.fn(() => Promise.resolve({ translated: 'перевод' }));

    vi.doMock('/imports/api/entities/Translation', () => ({
      Translation: { findOneBy },
    }));

    const { translatePosition } = await import('/imports/api/services/translation-service');

    await expect(translatePosition('developer', 'Developer')).resolves.toBe('перевод');
    expect(findOneBy).toHaveBeenCalledTimes(1);
    expect(findOneBy).toHaveBeenCalledWith({ source: 'developer' });
  });

  it('делает fallback на originalSource, если записи нет', async () => {
    vi.resetModules();

    const findOneBy = vi.fn(() => Promise.resolve(null));

    vi.doMock('/imports/api/entities/Translation', () => ({
      Translation: { findOneBy },
    }));

    const { translatePosition, translationService } = await import(
      '/imports/api/services/translation-service'
    );

    await expect(translatePosition('unknown', 'Unknown')).resolves.toBe('Unknown');
    await expect(translationService.translate('unknown', 'Unknown')).resolves.toBe('Unknown');
    expect(findOneBy).toHaveBeenCalledWith({ source: 'unknown' });
  });
});

import { describe, expect, it } from 'vitest';

describe('constants/customers-collection.ts', () => {
  it('экспортирует литерал имени публикации и Minimongo-коллекции', async () => {
    const { CUSTOMERS_COLLECTION } = await import(
      '/imports/api/constants/customers-collection'
    );

    expect(CUSTOMERS_COLLECTION).toBe('customersWithPositions');
    expect(typeof CUSTOMERS_COLLECTION).toBe('string');
  });
});

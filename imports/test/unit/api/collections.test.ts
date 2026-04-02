import { describe, expect, it } from 'vitest';

import { CUSTOMERS_COLLECTION as CUSTOMERS_COLLECTION_FROM_CONSTANTS } from '/imports/api/constants/customers-collection';

describe('collections.ts (Minimongo + domain)', () => {
  it('реэкспортирует CUSTOMERS_COLLECTION без расхождения с constants', async () => {
    const { CUSTOMERS_COLLECTION } = await import('/imports/api/collections');

    expect(CUSTOMERS_COLLECTION).toBe(CUSTOMERS_COLLECTION_FROM_CONSTANTS);
    expect(CUSTOMERS_COLLECTION).toBe('customersWithPositions');
  });

  it('создаёт Customers с рабочим find().fetch() (Vitest stub Mongo)', async () => {
    const { Customers } = await import('/imports/api/collections');

    expect(Customers.find().fetch()).toEqual([]);
  });

  it('customerFromRow маппит transport → domain', async () => {
    const { customerFromRow } = await import('/imports/api/collections');

    const row = {
      _id: '42',
      id: 7,
      full_name: 'Jane Doe',
      position: 'Engineer',
    };

    expect(customerFromRow(row)).toEqual({
      id: 7,
      fullName: 'Jane Doe',
      position: 'Engineer',
    });
  });
});

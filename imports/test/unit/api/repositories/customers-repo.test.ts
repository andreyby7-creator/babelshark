import { describe, expect, it } from 'vitest';

describe('customers-repo.ts (SQL SSOT)', () => {
  it('содержит обязательный алиас `_id` для vlasky:mysql/minimongo', async () => {
    const { CUSTOMERS_WITH_POSITIONS_SQL } = await import(
      '/imports/api/repositories/customers-repo'
    );

    expect(CUSTOMERS_WITH_POSITIONS_SQL).toContain('CAST(c.id AS CHAR) AS _id');
  });

  it('выбирает ожидаемые поля и JOIN-ит positions', async () => {
    const { CUSTOMERS_WITH_POSITIONS_SQL } = await import(
      '/imports/api/repositories/customers-repo'
    );

    const sql = CUSTOMERS_WITH_POSITIONS_SQL.replaceAll(/\s+/g, ' ').trim().toLowerCase();

    expect(sql).toContain('select');
    expect(sql).toContain('from customers c');
    expect(sql).toContain('join positions p on c.position_id = p.id');
    expect(sql).toContain('c.full_name');
    expect(sql).toContain('p.name as position');
  });
});

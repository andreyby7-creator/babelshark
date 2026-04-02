import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn<
    () => {
      _id: string;
      id: number;
      full_name: string;
      position: string;
    }[]
  >(() => []),
}));

vi.mock('/imports/api/collections', async (importOriginal) => {
  // Vitest: подменяем только Customers; остальное — из реального модуля (customerFromRow, типы).
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- единственный способ типизировать importOriginal для этого мока
  const mod = await importOriginal<typeof import('/imports/api/collections')>();
  return {
    ...mod,
    Customers: {
      find: () => ({
        fetch: () => fetchMock(),
      }),
    },
  };
});

import { renderTable } from '/imports/ui/table';

describe('table.ts (renderTable)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app" data-root="app"></div>';
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => []);
  });

  it('строит таблицу и не падает при пустых данных', () => {
    renderTable();

    const app = document.getElementById('app');
    expect(app?.querySelector('table.table')).toBeTruthy();
    expect(app?.querySelectorAll('thead th')).toHaveLength(3);
    expect(app?.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(app?.querySelectorAll('td.__t')).toHaveLength(0);
  });

  it('бросает, если контейнер #app отсутствует', () => {
    document.body.innerHTML = '';

    expect(() => {
      renderTable();
    }).toThrow('renderTable: #app not found');
  });

  it('ставит class="__t" только на ячейку position', () => {
    fetchMock.mockImplementation(() => [
      { _id: '1', id: 1, full_name: 'Alice', position: 'Engineer' },
    ]);

    renderTable();

    const app = document.getElementById('app');
    const cells = app?.querySelectorAll('tbody td');
    expect(cells).toHaveLength(3);

    expect(cells?.[0]?.classList.contains('__t')).toBe(false);
    expect(cells?.[1]?.classList.contains('__t')).toBe(false);
    expect(cells?.[2]?.classList.contains('__t')).toBe(true);
    expect(cells?.[2]?.textContent).toBe('Engineer');
  });
});

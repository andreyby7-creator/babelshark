/**
 * @file UI: таблица клиентов (1 страница).
 *
 * В рамках ТЗ:
 * - подписка на публикацию (`CUSTOMERS_COLLECTION`)
 * - реактивный рендер через Tracker + Minimongo
 * - `class="__t"` только на `<td>` с должностью (position)
 *
 * @remarks
 * - Реальный перевод текста в DOM выполняется отдельным MutationObserver.
 * - Значения ячеек задаём через `textContent`, без `innerHTML` по данным из БД.
 * - Подписка и `Tracker.autorun` вешаются на уже созданный `tbody` **до** вставки таблицы в контейнер,
 *   чтобы первый синхронный прогон autorun писал в известный узел (без `getElementById` и ветки «tbody пропал»).
 * - **Масштаб:** при больших таблицах полный `replaceChildren` на каждый прогон Tracker — O(n) по DOM;
 *   разумный следующий шаг — **diff по `_id`** (обновлять только изменённые строки) → стоимость ближе к O(diff).
 * - Если список клиентов может сильно вырасти — смотреть **виртуализацию** (lazy rendering видимых строк). Оба пункта вне текущего ТЗ.
 */

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { type Customer, customerFromRow, Customers } from '/imports/api/collections';
import { CUSTOMERS_COLLECTION } from '/imports/api/constants/customers-collection';

/* ============================================================================
 * КОЛОНКИ (SSOT: заголовки + ключи domain)
 * ========================================================================== */

/**
 * Ключ сортировки (extension point).
 *
 * @remarks
 * - В рамках ТЗ сортировка не требуется, но это удобная точка расширения.
 */
export type SortKey = keyof Pick<Customer, 'id' | 'fullName' | 'position'>;

interface CustomerColumn {
  readonly key: SortKey;
  readonly label: string;
  readonly cellClass?: string;
}

/** Заголовки и соответствие колонок полям `Customer`; `cellClass` — только для ячейки должности (`__t`). */
const CUSTOMER_TABLE_COLUMNS: readonly CustomerColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'fullName', label: 'Full name' },
  { key: 'position', label: 'Position', cellClass: '__t' },
];

/* ============================================================================
 * DOM — ЯЧЕЙКИ / СТРОКИ
 * ========================================================================== */

/** Ячейка с текстом через `textContent`; класс задаём только если непустой (без `class=""`). */
function createTd(text: string, className?: string): HTMLTableCellElement {
  const td = document.createElement('td');
  td.textContent = text;
  if (className !== undefined && className !== '') {
    td.className = className;
  }
  return td;
}

/** Значение ячейки по ключу колонки; `switch` вместо `customer[key]` — исчерпывающий `SortKey` и спокойный ESLint. */
function cellText(customer: Customer, key: SortKey): string {
  switch (key) {
    case 'id':
      return String(customer.id);
    case 'fullName':
      return customer.fullName;
    case 'position':
      return customer.position;
  }
}

/** Одна строка таблицы: порядок `<td>` совпадает с `CUSTOMER_TABLE_COLUMNS`. */
function createTr(customer: Customer): HTMLTableRowElement {
  const tr = document.createElement('tr');
  for (const col of CUSTOMER_TABLE_COLUMNS) {
    tr.appendChild(createTd(cellText(customer, col.key), col.cellClass));
  }
  return tr;
}

/* ============================================================================
 * РЕНДЕР ТЕЛА ТАБЛИЦЫ (presentation, без Meteor)
 * ========================================================================== */

/** Полная перерисовка `tbody` из массива domain-моделей (см. @file про O(n) и diff при росте данных). */
function renderTbodyWithCustomers(
  tbody: HTMLTableSectionElement,
  customers: readonly Customer[],
): void {
  tbody.replaceChildren();
  for (const c of customers) {
    tbody.appendChild(createTr(c));
  }
}

/* ============================================================================
 * РЕАКТИВНЫЙ ИСТОЧНИК (Minimongo)
 * ========================================================================== */

/**
 * Подписка + `Tracker.autorun`: при изменении курсора Minimongo пересобираем строки.
 * Вызывать до монтирования таблицы в `#app` — см. `renderTable` (первый прогон пишет в переданный `tbody`).
 */
function wireMinimongoCustomersToTbody(tbody: HTMLTableSectionElement): void {
  Meteor.subscribe(CUSTOMERS_COLLECTION);
  Tracker.autorun(() => {
    const customers = Customers.find().fetch().map(customerFromRow);
    renderTbodyWithCustomers(tbody, customers);
  });
}

/* ============================================================================
 * СБОРКА ТАБЛИЦЫ
 * ========================================================================== */

/** Разметка `<table>` + пустой `tbody` (строки появятся из `wireMinimongoCustomersToTbody`). */
function buildCustomerTableElement(): {
  table: HTMLTableElement;
  tbody: HTMLTableSectionElement;
} {
  const table = document.createElement('table');
  table.className = 'table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const col of CUSTOMER_TABLE_COLUMNS) {
    const th = document.createElement('th');
    th.textContent = col.label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbody.id = 'tbody'; // устойчивый селектор для отладки и скриптов
  table.appendChild(tbody);

  return { table, tbody };
}

/* ============================================================================
 * ПУБЛИЧНЫЙ API
 * ========================================================================== */

/**
 * Рендерит таблицу клиентов в контейнер `#app`.
 *
 * @remarks
 * Порядок: очистить контейнер → собрать таблицу → привязать Minimongo к `tbody` → вставить таблицу в DOM.
 *
 * @returns void
 */
export const renderTable = (): void => {
  const container = document.getElementById('app');
  if (!container) {
    throw new Error('renderTable: #app not found');
  }

  container.replaceChildren();

  const { table, tbody } = buildCustomerTableElement();

  wireMinimongoCustomersToTbody(tbody);

  container.appendChild(table);
};

/**
 * @file Репозиторий (SQL helper) для публикации customers/positions.
 *
 * В рамках ТЗ мы используем `vlasky:mysql` напрямую в Meteor.publish, поэтому этот файл:
 * - не абстрагирует pub/sub (это infra-layer Meteor),
 * - а лишь фиксирует SSOT для SQL и обязательного `_id` маппинга.
 *
 * @remarks
 * - Пагинацию (LIMIT/OFFSET) не добавляем: для тестового достаточно полного списка.
 * - Любые будущие фильтры/аргументы публикации: валидировать на входе; **параметры передавать только через
 *   prepared params (`?` и массив/объект значений в API драйвера), без конкатенации и string interpolation**
 *   в SQL — иначе риск SQL injection.
 */

/* ============================================================================
 * CUSTOMERS WITH POSITIONS — SQL (SSOT)
 * ========================================================================== */

export const CUSTOMERS_WITH_POSITIONS_SQL = `
SELECT
  CAST(c.id AS CHAR) AS _id, -- string _id для Minimongo (избегаем number|string на wire)
  c.id,
  c.full_name,
  p.name AS position
FROM customers c
JOIN positions p ON c.position_id = p.id
`;

**Назначение:** пофазовый план и приёмка по ТЗ (ограничения, файлы, чек-лист). Обзор проекта, стек и быстрый старт — в корневом **[`README.md`](../README.md)**.

Порядок работ: Meteor + MySQL + TS; customers/positions только через `vlasky:mysql`; TypeORM — `translations` + `translatePosition`; `MutationObserver` с кэшем/debounce без спама `Meteor.call`.

### 0 Принципы ✅

- Одна страница: таблица Bootstrap (`class="table"`, CSS в `client/main.ts`). ✅
- Pub/sub для customers/positions — только `vlasky:mysql` (не TypeORM, не серверный Mongo под эти сущности). ✅
- TypeORM — только `translations` / метод `translatePosition`. ✅
- `class="__t"` — только на ячейке должности (position). ✅
- Перевод: `Meteor.call('translatePosition', source)` → текст в DOM обновляется. ✅

---

## Фаза 0 — Скелет ✅

- `.meteor/`, `client/main.{html,ts}` (`#app`, `data-root="app"`), `server/main.ts`
- `imports/api/**`, `imports/observer/**`, `imports/ui/**`

---

## Фаза 1 — MySQL (Docker + schema) ✅

- `docker-compose.yml` (MySQL 8, volume `mysql_data`, `init.sql`)
- `private/init.sql` — схема и seed

```bash
docker compose up -d
```

После первого создания volume: БД `babel`, таблицы `customers` / `positions` / `translations`, по 3 строки в seed.

Сброс данных:

```bash
docker compose down -v && docker compose up -d
```

`init.sql` снова применится только при новом volume.

---

## Фаза 2 — Data layer ✅

- `vlasky:mysql` (Meteor); класс **`LiveMysql`** / `LiveMysqlKeySelector` (`@vlasky/mysql-live-select`); TypeORM — только `mysql2`
- `imports/api/mysql.ts` — `DB_*`, порт `3306` / `DB_PORT`, лог `host:port` (без пароля в обычном dev)
- `imports/api/repositories/customers-repo.ts` — `CUSTOMERS_WITH_POSITIONS_SQL`, `CAST(c.id AS CHAR) AS _id`
- `imports/api/constants/customers-collection.ts` — `CUSTOMERS_COLLECTION`
- `imports/api/publications.ts` — `db.select(sql.trim(), undefined, LiveMysqlKeySelector.Columns(['_id']), triggers)` + cast под `Meteor.publish`; публикации импортируются в `server/main.ts`
- `imports/types/meteor-vlasky-mysql.d.ts` — `LiveMysql` / `LiveMysqlSelectHandle` (без перегрузки `select → T[]` для тестов — см. stub)

**На ревью (запреты):** не TypeORM и не серверный Mongo для customers/positions; имя публикации = имя клиентской коллекции: `customersWithPositions`.

**Проверки:** `imports/test/unit/api/mysql.test.ts`, `publications.test.ts`, стаб/ambient vlasky, `pnpm run type-check`.

---

## Фаза 3 — Translations API ✅

- `imports/api/entities/Translation.ts` — `extends BaseEntity`
- `server/typeorm.ts` — `synchronize: false`, env, **`connectorPackage: 'mysql2'`**, порт `DB_PORT`; после `initialize()` — `Translation.useDataSource(AppDataSource)`; при shutdown — `useDataSource(null)`
- `imports/api/services/translation-service.ts` — `Translation.findOneBy({ source })` (Active Record)
- `imports/api/methods.ts` — `Meteor.call('translatePosition', …)` → таблица `translations`

**Проверки:** `Translation.test.ts`, `translation-service.test.ts`, `methods.test.ts`, `imports/test/unit/server/typeorm.test.ts`.

---

## Фаза 4 — UI ✅

- `imports/api/collections.ts` — `Customer` / `CustomerRow`, `Customers`, `customerFromRow`
- `imports/ui/table.ts` — подписка, `Tracker.autorun`, DOM через `createElement` / `textContent`, `__t` на position; порядок: `tbody` → wire → монтаж в `#app`
- Vitest: алиасы `meteor/*` → `imports/test/stubs/*` (`vitest.config.ts`)

**Проверки:** `collections.test.ts`, `customers-collection.test.ts`, `table.test.ts`, тесты стабов meteor.

---

## Фаза 5 — MutationObserver ✅

`imports/observer/mutationObserver.ts`: цель `.__t`, root `[data-root="app"]` / `#app`, debounce + кэш + lock, `data-original`, `characterData`.

**Проверка:** `mutationObserver.test.ts`.

В `client/main.ts` после `renderTable()` — `initObserver()`; E2E с БД — фаза 9.

---

## Фаза 6 — Bootstrap ✅

- `bootstrap` в `package.json`
- `client/main.ts`: `import 'bootstrap/dist/css/bootstrap.min.css'`
- `imports/types/css.d.ts` — `*.css`; опционально `imports/test/typecheck/css-import.ambient.ts`

Классы: `container mt-4` в HTML, `table` на `<table>`.

CDN в `client/main.html` не нужен, пока CSS из npm.

---

## Фаза 7 — Entrypoints ✅

- `client/main.html` — `static-html`, `#app` в `<main>`.
- `client/main.ts` — Bootstrap CSS, `Meteor.startup`: `renderTable`, `initObserver` (`try/catch`).
- `server/main.ts` — methods/publications; `Meteor.startup`: `initTypeORM`.

---

## Фаза 8 — `.env` ✅

- `.env.example` — `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `.gitignore`: игнор `.env` / `.env.*`, исключение `!.env.example`

Локально: `cp .env.example .env` или переменные в shell / CI. Meteor `.env` сам не читает.

**`package.json`:** без `"type": "module"` — иначе падает Node на `.meteor/local/build/main.js` с `require`. **`.npmrc`:** `node-linker=hoisted` — иначе Meteor не находит `@babel/runtime` при layout pnpm.

---

## Фаза 9 — Приёмка ✅

**Локально (хост):**

```bash
docker compose up -d
meteor run
```

Ожидаемо в логе: `[TypeORM] DataSource initialized`, `=> App running at: http://localhost:3000/`.

**Автопроверки** (зафиксировано на репозитории): `pnpm run type-check`, `tsc:check`, `lint:canary`, `format`, `check:circular-deps`, `pnpm run test` (юниты + **`imports/test/integration/app-flow.integration.test.ts`** — сквозной сценарий со стабами Minimongo/Tracker). С покрытием: `pnpm exec vitest run --coverage imports/test/unit` — целевые файлы в отчёте 100%, артефакты `coverage/`, `test-results/results.json`.

Pre-push: `type-check` → `lint:canary` → `format:check` → `test` (`docs/commands.md`).

Кэш и debounce в чек-листе п.3–4 — дублируются в `mutationObserver.test.ts`.

### Чек-лист в браузере

1. Таблица из публикации; ячейки position с `__t` переводятся.
2. MySQL: `UPDATE positions SET name = 'manager' WHERE id = 1;` — UI обновился.
3. Повтор того же `source` — без лишних `Meteor.call` (кэш).
4. Debounce: быстро добавить в `#tbody` несколько строк с `.__t` (например циклом в консоли) — ожидать 1–2 вызова `translatePosition`, не по одному на каждую строку.

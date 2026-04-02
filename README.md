# BabelShark

Одностраничное приложение на **Meteor 3** и **TypeScript**: таблица клиентов и должностей из **MySQL** в реальном времени, перевод подписи должности через **TypeORM**; на клиенте **`MutationObserver`** с кэшем и debounce, чтобы не плодить лишние вызовы **`Meteor.call`** при обновлении текста в DOM.

**Зачем этот репозиторий:** тестовое задание с чётким разделением «live SQL → Minimongo» и «переводы через ORM», плюс юнит-тесты без полного Meteor.

---

## Стек (кратко)

Meteor 3 · TypeScript · MySQL 8 (Docker) · `vlasky:mysql` / `LiveMysql` · TypeORM + `mysql2` · Bootstrap 5 (npm) · Vitest + стабы Meteor · Rspack (`@meteorjs/rspack`) · pnpm

---

## Поток данных (обзор)

```mermaid
flowchart TB
  subgraph db [(MySQL)]
    TP[customers / positions]
    TT[translations]
  end
  subgraph server [Сервер Meteor]
    LM[LiveMysql]
    PUB[publish]
    MTH["method translatePosition"]
    ORM[TypeORM]
  end
  subgraph client [Клиент]
    TBL[Таблица + Minimongo]
    MO[MutationObserver]
  end
  TP --> LM --> PUB --> TBL
  TT --> ORM
  TBL --> MO
  MO --> MTH
  MTH --> ORM
  MTH -->|ответ: обновление переводов в DOM| MO
```

Стрелка **`method translatePosition` → MutationObserver** — не «замыкание» на сервер: это возврат результата метода и **обновление текста в ячейках** на клиенте; повторные мутации режутся кэшем и debounce, чтобы не спамить **`Meteor.call`**.

Детали ограничений ТЗ, файлов по фазам и чек-лист приёмки — в **[`docs/roadmap.md`](docs/roadmap.md)** (пошаговый план **0–9**, не дублируйте его в README).

---

## Быстрый старт

Нужны **Node** и **pnpm** из `package.json` → `engines`.

```bash
pnpm install
docker compose up -d
meteor run
```

Открыть **http://localhost:3000/**. В логе: `[TypeORM] DataSource initialized`, `App running at`.

Перед push / для ревью:

```bash
pnpm run type-check && pnpm run lint:canary && pnpm run test
```

Все команды, coverage, сброс БД — **[`docs/commands.md`](docs/commands.md)**.

---

## Где что лежит в документации

- **[README.md](README.md)** (этот файл) — вход в проект, старт, схема потока, ссылки.
- **[docs/roadmap.md](docs/roadmap.md)** — принципы ТЗ, **фазы 0–9**, файлы по слоям, приёмка.
- **[docs/commands.md](docs/commands.md)** — скрипты `pnpm`, Docker, тесты, pre-push.
- **[.github/README.md](.github/README.md)** — CI, `gh`, защита веток; подробности в [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md).

---

## Репозиторий

Репозиторий на GitHub: **[github.com/andreyby7-creator/babelshark](https://github.com/andreyby7-creator/babelshark)** — для задания задействована только ветка **`main`** (CI и документация под неё).

Конфиг бандлера: `rspack.config.cjs`. Патчи зависимостей: `patches/`, см. `pnpm-workspace.yaml`. В `package.json` для npm указано `"private": true`.

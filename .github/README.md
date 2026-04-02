# Конфигурация GitHub — BabelShark

Каталог со специфичной для GitHub настройкой Meteor-проекта BabelShark (TypeScript, Vitest, pnpm).

## Структура

```
.github/
├── workflows/
│   ├── ci.yml        # Полный прогон: type-check, ESLint, dprint, тесты
│   ├── lint.yml      # То же для PR при изменениях в TS/JS и конфигах линтера
│   ├── test.yml      # Vitest при изменениях в тестах и исходниках
│   └── security.yml  # pnpm audit (еженедельно и по событиям)
├── dependabot.yml
├── BRANCH_PROTECTION.md
├── CODEOWNERS
└── README.md
```

## Пайплайны

- **CI** — единая проверка перед merge: `type-check` → `lint:canary` → `format:check` → `test`.
- **Lint** — ускоренный прогон при правках в TS/JS и конфигах линтера/форматтера (см. `paths:` в `lint.yml`).
- **Test** — Vitest при изменениях в `imports/test` и связанных путях (см. `paths:` в `test.yml`).
- **Security** — `pnpm run audit` (`pnpm audit --prod`).

В CI для `pnpm install` выставлено `HUSKY=0`, чтобы не трогать git-hooks на раннере.

## Dependabot

Еженедельные PR для npm и GitHub Actions; группы: TypeScript, ESLint, тесты, Meteor/Rspack.

## Ветки

Workflows завязаны только на **`main`** (push / pull_request). Правила защиты ветки — см. [`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md).

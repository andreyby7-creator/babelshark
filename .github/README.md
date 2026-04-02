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
├── ISSUE_TEMPLATE/
├── dependabot.yml
├── CODEOWNERS
└── README.md
```

## Пайплайны

| Workflow   | Назначение |
|-----------|------------|
| **CI**    | Единая проверка перед merge: `type-check` → `lint:canary` → `format:check` → `test` |
| **Lint**  | Ускоренный запуск при правках только в области линтинга/форматирования |
| **Test**  | Запуск Vitest при изменениях в `imports/test` и связанных путях |
| **Security** | `pnpm audit --audit-level moderate` |

В CI для `pnpm install` выставлено `HUSKY=0`, чтобы не трогать git-hooks на раннере.

## Dependabot

Еженедельные PR для npm и GitHub Actions; группы: TypeScript, ESLint, тесты, Meteor/Rspack.

## Ветки

Рекомендуемые правила защиты — см. `BRANCH_PROTECTION.md`.

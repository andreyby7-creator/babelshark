# Команды BabelShark

## Скрипты (`package.json`)

```bash
pnpm run build               # tsc (tsconfig.build.json)
pnpm run type-check          # tsc --noEmit (строго)
pnpm run tsc:check           # то же, --skipLibCheck
pnpm run lint:canary         # eslint, 0 warnings
pnpm run lint:fix
pnpm run format              # dprint fmt
pnpm run format:check
pnpm run test                # vitest run --passWithNoTests
pnpm run check:circular-deps # madge (tsconfig.madge.json, алиасы meteor → stubs)
pnpm run audit               # pnpm audit --prod
```

## Локальный стенд (MySQL + приложение)

```bash
docker compose up -d
meteor run
```

MySQL: порт 3306, init — `private/init.sql`. Сброс данных: `docker compose down -v && docker compose up -d`.

## Тесты

```bash
pnpm run test                                       # все тесты (unit + integration)
pnpm exec vitest run --coverage imports/test/unit   # только unit; coverage/, test-results/
```

## Прочее

```bash
pnpm audit                   # полное дерево (включая dev)
pnpm outdated
cp .env.example .env         # при необходимости (Meteor env не подхватывает .env сам)
pnpm run repo:github         # gh create + push (см. .github/README.md)
```

Pre-push (`.husky/pre-push`): `type-check` → `lint:canary` → `format:check` → `test`.

`engines` — в `package.json` (Node/pnpm).

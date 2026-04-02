# Команды проекта BabelShark

Команды ниже соответствуют скриптам из корневого `package.json`, хуку `pre-push` (Husky) и запуску MySQL/Meteor в этом репозитории.

## pnpm scripts (из `package.json`)

```bash
pnpm run build              # Сборка TypeScript (tsconfig.build.json)
pnpm run type-check         # Проверка типов без emit (строгий tsconfig)
pnpm run tsc:check          # То же с --skipLibCheck (быстрее по зависимостям)
pnpm run lint:canary        # ESLint, ноль предупреждений
pnpm run lint:fix           # ESLint с автоисправлением
pnpm run format             # Форматирование dprint
pnpm run format:check       # Проверка формата без записи
pnpm run test               # Vitest: `vitest run --passWithNoTests`
pnpm run prepare            # Инициализация Husky (обычно один раз после клонирования)
pnpm run check:circular-deps # madge + tsconfig.madge.json (imports / server / client)
```

## Тесты (Vitest)

```bash
npx vitest run
npx vitest run --coverage imports/test/unit   # Юниты с coverage
```

Прямые команды pnpm (без записи в `package.json`):

```bash
pnpm audit                  # Уязвимости в зависимостях
pnpm outdated               # Устаревшие пакеты относительно диапазонов в package.json
```

Граф импортов:

```bash
pnpm run check:circular-deps
```

Madge читает **`tsconfig.madge.json`**: там к путям `/imports/*` добавлены алиасы **`meteor/*` →** файлы в `imports/test/stubs/`, иначе Meteor-пакеты не существуют как обычные файлы и madge предупреждает о «пропусках». Для типов приложения это не используется: **`pnpm run type-check`** идёт через **`tsconfig.typecheck.json`** (ambient-типы Meteor, без стабов).

## Форматирование (dprint)

```bash
npx dprint fmt
```

## Pre-push (`.husky/pre-push`)

Перед `git push` последовательно выполняются:

```bash
pnpm run type-check
pnpm run lint:canary
pnpm run format:check
pnpm run test
```

## Переменные БД (шаблон)

В корне: `.env.example` (в репозитории). Локальный `.env` в `.gitignore`.

```bash
cp .env.example .env   # при необходимости; значения совпадают с дефолтами в коде
```

## MySQL (Docker Compose)

Файл: `docker-compose.yml` в корне проекта.

```bash
docker compose up -d        # Поднять MySQL (порт 3306, init из private/init.sql)
docker compose down         # Остановить контейнеры
docker compose down -v      # Остановить и удалить volume mysql_data (полный сброс данных)
```

## Meteor

Из корня репозитория:

```bash
meteor run
```

UI: Bootstrap 5 подключён как npm-зависимость (`package.json`), CSS импортируется в `client/main.ts` (см. Фаза 6 в `docs/roadmap.md`).

## Примечания

- Версии Node/pnpm зафиксированы в `package.json` (`engines`).
- Отчёты Vitest: `./test-results/results.json`; покрытие: каталог `coverage/` (см. `vitest.config.ts`).

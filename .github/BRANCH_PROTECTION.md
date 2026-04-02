# Защита веток — BabelShark

Рекомендации для **[babelshark на GitHub](https://github.com/andreyby7-creator/babelshark)** (Meteor 3, TypeScript, Vitest, pnpm). Настройка: **Settings → Branches → Add branch protection rule**.

В репозитории для тестового задания в CI и в этой заметке фигурирует только ветка **`main`**.

## Ветка `main`

Workflows (`.github/workflows/*.yml`) запускаются на **push** и **pull_request** в **`main`**.

### Обязательные проверки (job id)

В UI проверки часто отображаются как **`Имя workflow / job`**, например `CI / ci`. В списке «required status checks» выбирайте те же имена, что показывает GitHub после первого успешного прогона.

- **`ci`** (`ci.yml`, workflow **CI**) — `type-check` → `lint:canary` → `format:check` → `test` (полный прогон, как pre-push).
- **`lint`** (`lint.yml`) — то же по линту/формату, но **только** если менялись `*.ts`/`*.js` или `eslint.config.mjs` / `dprint.json`.
- **`test`** (`test.yml`) — Vitest **только** при изменениях в тестах/исходниках по path filter.
- **`security`** (`security.yml`) — `pnpm run audit` (`--prod`).

**Практичный минимум для merge:** отметить **`ci`** (или `CI / ci`) — он всегда запускается на push/PR в **`main`** без path filters.

**Lint** и **Test** из-за `paths:` на части PR **не стартуют**; если сделать их обязательными в правиле, GitHub может требовать их даже когда workflow не бежал — уточняйте поведение в своей версии UI или ограничьтесь job **`ci`** + при желании **`security`**.

### Остальные опции (по желанию)

- Требовать pull request перед слиянием в `main`
- Требовать ревью (для соло-репозитория можно не включать)
- С **CODEOWNERS** — опционально автозапрос ревью
- Сбрасывать approve при новых коммитах
- Запретить force-push и удаление `main`

## Связанные файлы

- Описание workflows: [`.github/README.md`](README.md)
- Локальные команды: [`docs/commands.md`](../docs/commands.md)

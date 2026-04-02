/**
 * @file Ambient: side-effect импорты `*.css` (например Bootstrap в `client/main.ts`).
 *
 * @remarks
 * - Нужно для `tsc --noEmit` (`pnpm run type-check`): без декларации TS2882 на `import '…/*.css'`.
 * - Содержимое CSS на этапе проверки типов не типизируем; в рантайме подключает сборщик Meteor / Vitest.
 * - Compile-time проверка: `imports/test/typecheck/css-import.ambient.ts` (как `meteor-vlasky-mysql.ambient.ts`).
 */

/* ============================================================================
 * CSS — WILDCARD MODULE
 * ========================================================================== */

declare module '*.css';

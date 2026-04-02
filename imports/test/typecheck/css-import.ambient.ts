/**
 * @file Compile-time: side-effect `import '*.css'` согласован с `imports/types/css.d.ts`.
 *
 * @internal Только `pnpm run type-check`, не Vitest.
 *
 * @remarks
 * - Дублирует по смыслу импорт из `client/main.ts`; отдельный файл — явная фиксация ambient для ревью/навигации.
 * - Реальный CSS подхватывает сборщик Meteor; здесь проверяется лишь отсутствие TS2882.
 */

import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Подключает глобалы Vitest (`describe`, `it`, `expect`, …).
 *
 * @remarks
 * Явный `compilerOptions.types: ["vitest/globals"]` часто ломает резолв в IDE на путях `node_modules/.pnpm/...`.
 * Вместо этого: `typeRoots: ["./node_modules/@types"]` + эта тройная косая ссылка на пакет `vitest`.
 */
/// <reference types="vitest/globals" />

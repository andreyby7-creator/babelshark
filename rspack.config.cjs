const { defineConfig } = require('@meteorjs/rspack');

/**
 * Rspack configuration for Meteor projects.
 *
 * Provides typed flags on the `Meteor` object, such as:
 * - `Meteor.isClient` / `Meteor.isServer`
 * - `Meteor.isDevelopment` / `Meteor.isProduction`
 * - …and other flags available
 *
 * Use these flags to adjust your build settings based on environment.
 *
 * Файл в формате **`.cjs`**: CommonJS `require` / `module.exports` (как у Meteor bootstrap `main.js`).
 * `rspack.config.js` в корне — stub под `fs.existsSync` в @meteorjs/rspack; реально грузится этот файл.
 */
module.exports = defineConfig(() => ({
  ignoreWarnings: [
    /Critical dependency: the request of a dependency is an expression/,
    // Опциональные драйверы в mongodb / typeorm (динамический require) — в проекте только mysql2.
    { module: /node_modules[\\/](mongodb|typeorm)(?:[\\/]|$)/ },
  ],
}));

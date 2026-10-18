/**
 * Public entry point of the `@praxis-buchung/config` package.
 *
 * Consumers (the backend API and the seed) import from here rather than reaching
 * into individual files, so the internal layout can change without breaking them.
 */
export * from './practice-config.types.js';
export * from './practice-config.validation.js';
export { practiceConfig, default } from './practice.config.js';

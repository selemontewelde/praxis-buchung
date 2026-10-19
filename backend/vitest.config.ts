import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`. Requires Vite 8, which ships this option.
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    // class-validator / class-transformer decorators need the metadata polyfill.
    setupFiles: ['reflect-metadata'],
    include: ['**/*.spec.ts'],
    // Integration tests (*.int-spec.ts) need a real database; they run via the
    // `test:int` script, not in the default unit run.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.int-spec.ts'],
  },
});

import { defineConfig } from 'vitest/config';

// Integration tests: run only *.int-spec.ts, which require a real database
// (DATABASE_URL). Run with `npm run test:int --workspace backend`.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    setupFiles: ['reflect-metadata'],
    include: ['**/*.int-spec.ts'],
    // Each file manages shared rows; don't run them in parallel against one DB.
    fileParallelism: false,
  },
});

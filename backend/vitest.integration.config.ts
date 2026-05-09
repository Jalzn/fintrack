import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['**/*.integration.test.ts'],
    globalSetup: ['./tests/integration/setup/global-setup.ts'],
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});

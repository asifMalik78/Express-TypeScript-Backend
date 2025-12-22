import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', '.git'],
    setupFiles: ['./vitest.setup.ts'],
    silent: false,
    // Run tests sequentially (one file at a time)
    fileParallelism: false,
    // Run tests in order: auth tests first, then user tests
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/tests/**',
        'src/index.ts',
        'src/server.ts',
      ],
      reportsDirectory: './coverage',
    },
  },
});

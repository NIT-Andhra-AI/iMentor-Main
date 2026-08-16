import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/test_*.js',
      'test/**/*.test.js'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ]
  }
});

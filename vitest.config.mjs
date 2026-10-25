// Konfigurasi Vitest di root repo, dipakai pipeline CI (`npx vitest run --coverage`).
// Hanya menjalankan test frontend; test back-end memakai node:test / bun test sendiri.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: [
        'src/auth.js',
        'src/utils/{validators,format,sanitize,guard,dialog}.js',
        'src/composables/useAsyncAction.js',
      ],
    },
  },
})
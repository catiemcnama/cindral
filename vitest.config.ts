import { defineConfig } from 'vitest/config'
import path from 'path'
import { config } from 'dotenv'

// Load environment variables for tests
config({ path: '.env.local' })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'drizzle', 'e2e/**'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', 'drizzle', '**/*.d.ts', 'test/**', 'e2e/**'],
    },
    // Use threads pool (more stable than forks)
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Environment variables are loaded above, pass through to tests
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

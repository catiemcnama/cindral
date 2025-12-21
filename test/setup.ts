import { beforeAll, afterAll } from 'vitest'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env.test', override: true })

/**
 * Global test setup
 * Runs before all tests
 */
beforeAll(async () => {
  // Ensure we're not running against production
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Tests cannot run in production environment')
  }

  // Set test environment
  process.env.NODE_ENV = 'test'
})

/**
 * Global test teardown
 * Runs after all tests
 */
afterAll(async () => {
  // Close database connections if they exist
  try {
    const { closeDb } = await import('../src/db')
    await closeDb()
  } catch {
    // Database may not have been initialized
  }
})

import { z } from 'zod'

/**
 * Environment variable schema
 * Validates all environment variables at startup
 * Fails fast if configuration is invalid
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(10),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // OAuth (optional in development)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  // AI (optional)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Email (optional in development)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Storage (optional)
  S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),

  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),

  // Feature flags
  ENABLE_AI_FEATURES: z.coerce.boolean().default(false),
  ENABLE_REALTIME: z.coerce.boolean().default(false),

  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

/**
 * Parse and validate environment variables
 * Called once at startup - fails fast on invalid config
 */
function validateEnv() {
  // In development, provide helpful defaults
  const envWithDefaults = {
    ...process.env,
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET ||
      (process.env.NODE_ENV !== 'production' ? 'development-secret-must-be-32-chars-long' : undefined),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  }

  const parsed = envSchema.safeParse(envWithDefaults)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment configuration')
  }

  return parsed.data
}

/**
 * Typed, validated environment variables
 * Use this instead of process.env directly
 */
export const env = validateEnv()

/**
 * Type-safe environment access
 */
export type Env = z.infer<typeof envSchema>

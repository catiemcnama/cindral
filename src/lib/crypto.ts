/**
 * Cryptographic utilities for encryption/decryption
 *
 * Used for encrypting sensitive data at rest (e.g., integration tokens)
 */

import crypto from 'crypto'

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Get encryption key from environment, derived from auth secret
function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be set (min 32 chars) for encryption')
  }

  // Derive a separate key for encryption using HKDF
  const derived = crypto.hkdfSync('sha256', secret, 'cindral-integration-encryption', 'aes-256-gcm-key', 32)
  return Buffer.from(derived)
}

/**
 * Encrypt a string value
 * Returns base64-encoded ciphertext with IV and auth tag prepended
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Combine: IV (16 bytes) + authTag (16 bytes) + ciphertext
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')])

  return combined.toString('base64')
}

/**
 * Decrypt a string value
 * Expects base64-encoded ciphertext with IV and auth tag prepended
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''

  const key = getEncryptionKey()
  const combined = Buffer.from(ciphertext, 'base64')

  // Extract IV, auth tag, and ciphertext
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Encrypt an object (serializes to JSON first)
 */
export function encryptObject<T extends object>(obj: T): string {
  return encrypt(JSON.stringify(obj))
}

/**
 * Decrypt an object (deserializes from JSON)
 */
export function decryptObject<T extends object>(ciphertext: string): T | null {
  try {
    const json = decrypt(ciphertext)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

// =============================================================================
// OAuth State Management
// =============================================================================

// In-memory store for OAuth states (use Redis in production with horizontal scaling)
const oauthStates = new Map<
  string,
  {
    organizationId: string
    provider: string
    createdAt: number
  }
>()

// State expiration (5 minutes)
const STATE_EXPIRY_MS = 5 * 60 * 1000

/**
 * Store OAuth state for later verification
 */
export function storeOAuthState(state: string, organizationId: string, provider: string): void {
  // Clean up expired states
  const now = Date.now()
  for (const [key, value] of oauthStates) {
    if (now - value.createdAt > STATE_EXPIRY_MS) {
      oauthStates.delete(key)
    }
  }

  oauthStates.set(state, {
    organizationId,
    provider,
    createdAt: now,
  })
}

/**
 * Verify and consume OAuth state
 * Returns the stored data if valid, null if invalid or expired
 */
export function verifyOAuthState(state: string, expectedOrgId: string, expectedProvider: string): boolean {
  const stored = oauthStates.get(state)

  if (!stored) {
    return false
  }

  // Check expiration
  if (Date.now() - stored.createdAt > STATE_EXPIRY_MS) {
    oauthStates.delete(state)
    return false
  }

  // Verify matches
  if (stored.organizationId !== expectedOrgId || stored.provider !== expectedProvider) {
    return false
  }

  // Consume the state (one-time use)
  oauthStates.delete(state)
  return true
}

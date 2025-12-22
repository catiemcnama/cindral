import { expect, test } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test.describe('Sign Up', () => {
    test('displays sign up form correctly', async ({ page }) => {
      await page.goto('/signup')

      // Check form elements are present
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
      await expect(page.getByLabel(/full name/i)).toBeVisible()
      await expect(page.getByLabel(/work email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
    })

    test('shows validation errors for invalid input', async ({ page }) => {
      await page.goto('/signup')

      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /create account/i })
      await expect(submitButton).toBeDisabled()

      // Enter invalid email
      await page.getByLabel(/work email/i).fill('invalid-email')
      await page.getByLabel(/work email/i).blur()

      // Should show email validation error
      await expect(page.getByText(/valid email/i)).toBeVisible()
    })

    test('shows password strength indicator', async ({ page }) => {
      await page.goto('/signup')

      const passwordInput = page.getByLabel(/password/i)

      // Weak password
      await passwordInput.fill('weak')
      await expect(page.getByText(/weak/i)).toBeVisible()

      // Strong password
      await passwordInput.fill('StrongP@ss123!')
      await expect(page.getByText(/strong|excellent/i)).toBeVisible()
    })

    test('can navigate to sign in page', async ({ page }) => {
      await page.goto('/signup')

      await page.getByRole('button', { name: /sign in instead/i }).click()
      await expect(page).toHaveURL(/signin/)
    })
  })

  test.describe('Sign In', () => {
    test('displays sign in form correctly', async ({ page }) => {
      await page.goto('/signin')

      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('shows forgot password link', async ({ page }) => {
      await page.goto('/signin')

      const forgotLink = page.getByRole('link', { name: /forgot password/i })
      await expect(forgotLink).toBeVisible()

      await forgotLink.click()
      await expect(page).toHaveURL(/forgot-password/)
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/signin')

      await page.getByLabel(/email/i).fill('nonexistent@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')

      const submitButton = page.getByRole('button', { name: /sign in/i })
      await submitButton.click()

      // Should show error message
      await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
    })

    test('can navigate to sign up page', async ({ page }) => {
      await page.goto('/signin')

      await page.getByRole('button', { name: /create an account/i }).click()
      await expect(page).toHaveURL(/signup/)
    })
  })

  test.describe('Forgot Password', () => {
    test('displays forgot password form', async ({ page }) => {
      await page.goto('/forgot-password')

      await expect(page.getByRole('heading', { name: /forgot your password/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /send reset/i })).toBeVisible()
    })

    test('validates email before submission', async ({ page }) => {
      await page.goto('/forgot-password')

      const submitButton = page.getByRole('button', { name: /send reset/i })
      await expect(submitButton).toBeDisabled()

      // Enter invalid email
      await page.getByLabel(/email/i).fill('invalid')
      await page.getByLabel(/email/i).blur()

      // Still disabled
      await expect(submitButton).toBeDisabled()

      // Enter valid email
      await page.getByLabel(/email/i).fill('valid@example.com')

      // Now enabled
      await expect(submitButton).toBeEnabled()
    })

    test('can navigate back to sign in', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.getByRole('button', { name: /back to sign in/i }).click()
      await expect(page).toHaveURL(/signin/)
    })
  })

  test.describe('Reset Password', () => {
    test('shows error without token', async ({ page }) => {
      await page.goto('/reset-password')

      await expect(page.getByText(/invalid|expired/i)).toBeVisible()
    })

    test('shows password requirements', async ({ page }) => {
      await page.goto('/reset-password?token=test-token')

      await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
      await expect(page.getByText(/uppercase/i)).toBeVisible()
      await expect(page.getByText(/lowercase/i)).toBeVisible()
      await expect(page.getByText(/number/i)).toBeVisible()
      await expect(page.getByText(/special character/i)).toBeVisible()
    })
  })

  test.describe('Email Verification', () => {
    test('shows verification pending message without token', async ({ page }) => {
      await page.goto('/verify-email')

      await expect(page.getByText(/check your email/i)).toBeVisible()
    })

    test('shows error for invalid token', async ({ page }) => {
      await page.goto('/verify-email?error=Invalid+token')

      await expect(page.getByText(/verification failed/i)).toBeVisible()
    })
  })
})

test.describe('Protected Routes', () => {
  test('dashboard redirects to signin when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/signin/)
  })

  test('settings redirects to signin when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/signin/)
  })

  test('alerts redirects to signin when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/alerts')
    await expect(page).toHaveURL(/signin/)
  })
})

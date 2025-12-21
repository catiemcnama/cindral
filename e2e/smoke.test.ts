import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')

    // Check that the page has loaded
    await expect(page).toHaveTitle(/Cindral/)

    // Check for key marketing elements
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /start free trial/i })).toBeVisible()
  })

  test('signin page loads', async ({ page }) => {
    await page.goto('/signin')

    // Check for auth form
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')

    // Check for signup form
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health/db')

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('ok')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('database')
  })
})

test.describe('Dashboard Access', () => {
  test('dashboard redirects to signin when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to signin
    await expect(page).toHaveURL(/signin/)
  })
})

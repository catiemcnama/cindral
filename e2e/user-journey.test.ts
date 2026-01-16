import { expect, test } from '@playwright/test'

/**
 * Full User Journey E2E Test
 *
 * Tests the complete flow: signup → create org → onboarding → dashboard
 * This validates the core product experience end-to-end.
 */
test.describe('User Journey', () => {
  const testUser = {
    name: `E2E User ${Date.now()}`,
    email: `e2e-${Date.now()}@test.cindral.io`,
    password: 'TestP@ssword123!',
    orgName: `Test Org ${Date.now()}`,
  }

  test('complete onboarding flow: signup → org → dashboard', async ({ page }) => {
    // Step 1: Sign up
    await test.step('Sign up new user', async () => {
      await page.goto('/signup')

      await page.getByLabel(/full name/i).fill(testUser.name)
      await page.getByLabel(/work email/i).fill(testUser.email)
      await page.getByLabel(/password/i).fill(testUser.password)

      // Accept terms if visible
      const termsCheckbox = page.getByRole('checkbox', { name: /terms/i })
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check()
      }

      await page.getByRole('button', { name: /create account/i }).click()

      // Should redirect to dashboard or verification
      await expect(page).toHaveURL(/dashboard|verify/)
    })

    // Step 2: Create organization (if on onboarding)
    await test.step('Create organization', async () => {
      // Wait for page to settle
      await page.waitForLoadState('networkidle')

      // If redirected to onboarding, create org
      if (page.url().includes('onboarding')) {
        const orgNameInput = page.getByLabel(/organization name/i)
        if (await orgNameInput.isVisible()) {
          await orgNameInput.fill(testUser.orgName)
          await page.getByRole('button', { name: /continue|next|create/i }).click()
          await page.waitForURL(/onboarding|dashboard/)
        }
      }
    })

    // Step 3: Complete onboarding wizard (select industry, regulations)
    await test.step('Complete onboarding wizard', async () => {
      await page.waitForLoadState('networkidle')

      // If on onboarding, go through steps
      if (page.url().includes('onboarding')) {
        // Look for magic setup or industry selection
        const magicSetup = page.getByText(/60-second|magic setup/i)
        const industrySelect = page.getByRole('button', { name: /financial services|banking/i })

        if (await magicSetup.isVisible()) {
          // Use magic setup
          const financeButton = page
            .locator('[data-industry]')
            .filter({ hasText: /financial|banking/i })
            .first()
          if (await financeButton.isVisible()) {
            await financeButton.click()
            // Should redirect to dashboard
            await page.waitForURL(/dashboard/, { timeout: 10000 })
          }
        } else if (await industrySelect.isVisible()) {
          // Manual flow
          await industrySelect.click()
          await page.getByRole('button', { name: /continue|next/i }).click()
        }
      }
    })

    // Step 4: Verify dashboard loads with data
    await test.step('Verify dashboard', async () => {
      // Navigate to dashboard if not there
      if (!page.url().includes('/dashboard')) {
        await page.goto('/dashboard')
      }

      await page.waitForLoadState('networkidle')

      // Check key dashboard elements
      await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible()

      // Check for compliance status card
      const complianceCard = page.getByText(/compliance status/i)
      await expect(complianceCard).toBeVisible()

      // Check for alerts section (may show empty state)
      const alertsSection = page.getByText(/alerts|notifications/i).first()
      await expect(alertsSection).toBeVisible()
    })
  })

  test('authenticated user can navigate key sections', async ({ page }) => {
    // Sign in with test credentials (assumes test user exists)
    await page.goto('/signin')

    // Use demo mode if available
    const demoButton = page.getByRole('button', { name: /demo|try demo/i })
    if (await demoButton.isVisible()) {
      await demoButton.click()
      await page.waitForURL(/dashboard/)
    } else {
      // Skip if no demo mode
      test.skip()
    }

    // Navigate to regulations
    await test.step('Navigate to regulations', async () => {
      await page.getByRole('link', { name: /regulations/i }).click()
      await expect(page).toHaveURL(/regulations/)
      await expect(page.getByRole('heading', { name: /regulations/i })).toBeVisible()
    })

    // Navigate to systems
    await test.step('Navigate to systems', async () => {
      await page.getByRole('link', { name: /systems/i }).click()
      await expect(page).toHaveURL(/systems/)
      await expect(page.getByRole('heading', { name: /systems/i })).toBeVisible()
    })

    // Navigate to alerts
    await test.step('Navigate to alerts', async () => {
      await page.getByRole('link', { name: /alerts/i }).click()
      await expect(page).toHaveURL(/alerts/)
    })

    // Navigate to settings
    await test.step('Navigate to settings', async () => {
      await page.getByRole('link', { name: /settings/i }).click()
      await expect(page).toHaveURL(/settings/)
    })
  })

  test('system map visualization loads', async ({ page }) => {
    // Use demo mode or skip
    await page.goto('/signin')

    const demoButton = page.getByRole('button', { name: /demo|try demo/i })
    if (await demoButton.isVisible()) {
      await demoButton.click()
      await page.waitForURL(/dashboard/)
    } else {
      test.skip()
    }

    // Navigate to systems
    await page.getByRole('link', { name: /systems/i }).click()
    await page.waitForURL(/systems/)

    // Look for system map tab or visualization
    const mapTab = page.getByRole('tab', { name: /map|visualization/i })
    if (await mapTab.isVisible()) {
      await mapTab.click()
    }

    // Check that some visualization renders (canvas or svg)
    const viz = page.locator('canvas, svg.react-flow')
    await expect(viz.first()).toBeVisible({ timeout: 10000 })
  })

  test('instant demo shows compliance gaps', async ({ page }) => {
    await page.goto('/try')

    // Check demo page loads
    await expect(page.getByRole('heading', { name: /compliance gaps|instant demo/i })).toBeVisible()

    // Select an industry
    const industryButton = page
      .locator('button')
      .filter({ hasText: /financial|banking|healthcare/i })
      .first()
    if (await industryButton.isVisible()) {
      await industryButton.click()

      // Wait for "scan" simulation
      await page.waitForTimeout(3000)

      // Should show results
      const results = page.getByText(/regulations|gaps found|systems/i)
      await expect(results.first()).toBeVisible()
    }
  })
})

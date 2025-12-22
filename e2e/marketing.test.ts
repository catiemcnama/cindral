import { expect, test } from '@playwright/test'

test.describe('Marketing Pages', () => {
  test.describe('Homepage', () => {
    test('has correct SEO elements', async ({ page }) => {
      await page.goto('/')

      // Title
      await expect(page).toHaveTitle(/Cindral/)

      // Meta description
      const metaDescription = page.locator('meta[name="description"]')
      await expect(metaDescription).toHaveAttribute('content', /.+/)

      // OG tags
      const ogTitle = page.locator('meta[property="og:title"]')
      await expect(ogTitle).toHaveAttribute('content', /.+/)

      const ogDescription = page.locator('meta[property="og:description"]')
      await expect(ogDescription).toHaveAttribute('content', /.+/)
    })

    test('displays hero section', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('link', { name: /start free trial/i })).toBeVisible()
    })

    test('has working navigation', async ({ page }) => {
      await page.goto('/')

      // Check nav links exist
      await expect(page.getByRole('link', { name: /features/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible()

      // Navigate to features
      await page
        .getByRole('link', { name: /features/i })
        .first()
        .click()
      await expect(page).toHaveURL(/features/)
    })

    test('CTA buttons work', async ({ page }) => {
      await page.goto('/')

      // Click main CTA
      const ctaButton = page.getByRole('link', { name: /start free trial/i }).first()
      await ctaButton.click()

      await expect(page).toHaveURL(/signup/)
    })
  })

  test.describe('Features Page', () => {
    test('displays feature sections', async ({ page }) => {
      await page.goto('/features')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Check for key feature keywords
      const pageContent = await page.textContent('body')
      expect(pageContent).toContain('compliance')
    })
  })

  test.describe('Pricing Page', () => {
    test('displays pricing tiers', async ({ page }) => {
      await page.goto('/pricing')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Check for pricing-related content
      const pageContent = await page.textContent('body')
      expect(pageContent?.toLowerCase()).toMatch(/free|starter|professional/i)
    })
  })

  test.describe('About Page', () => {
    test('displays company information', async ({ page }) => {
      await page.goto('/about')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Privacy & Terms', () => {
    test('privacy policy is accessible', async ({ page }) => {
      await page.goto('/privacy')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('terms of service is accessible', async ({ page }) => {
      await page.goto('/terms')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Contact Page', () => {
    test('displays contact information', async ({ page }) => {
      await page.goto('/contact')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })
})

test.describe('Accessibility', () => {
  test('homepage has no critical a11y issues', async ({ page }) => {
    await page.goto('/')

    // Check for basic accessibility
    // Skip link should exist or be addable
    await expect(page.getByRole('main')).toBeVisible()

    // All images should have alt text
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const ariaHidden = await img.getAttribute('aria-hidden')

      // Image should have alt, aria-label, or be aria-hidden
      expect(alt !== null || ariaLabel !== null || ariaHidden === 'true').toBe(true)
    }
  })

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/signin')

    // Email input should have label
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()

    // Password input should have label
    const passwordInput = page.getByLabel(/password/i)
    await expect(passwordInput).toBeVisible()
  })

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/signin')

    const buttons = page.getByRole('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const name = (await button.getAttribute('aria-label')) || (await button.textContent())
      expect(name?.trim().length).toBeGreaterThan(0)
    }
  })

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // Should have exactly one h1
    const h1s = page.locator('h1')
    await expect(h1s).toHaveCount(1)

    // H1 should be visible
    await expect(h1s.first()).toBeVisible()
  })

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/signin')

    // Tab to email input
    await page.keyboard.press('Tab')

    // Should be able to focus on email input
    const emailFocused = await page.evaluate(() => document.activeElement?.tagName === 'INPUT')
    expect(emailFocused).toBe(true)
  })
})

test.describe('Responsive Design', () => {
  test('homepage works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: /start free trial/i })).toBeVisible()
  })

  test('signin works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/signin')

    await expect(page.getByRole('heading')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('homepage works on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

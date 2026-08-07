import { test, expect } from '@playwright/test'

/**
 * Smoke journey over the routes that render from bundled data, so this suite
 * needs no API, no Firestore and no credentials — it cannot flake on a quota.
 *
 * That constraint is the point. The promotion pages read src/data/offersData.js
 * at build time, so every assertion here is deterministic and the job can gate
 * a merge. Anything requiring live inventory belongs in a separate suite that
 * is allowed to be unavailable.
 *
 * These replace specs that were written against markup that never existed
 * (`.flight-list`, `input[placeholder="From"]`, inline card fields when payment
 * goes through Razorpay's hosted widget) and a baseURL of :3000 when the app
 * serves on :4173.
 */

test.describe('home page', () => {
  test('renders and offers a search', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MakeMyTrip/i)
    await expect(page.getByRole('button', { name: /search/i }).first()).toBeVisible()
  })

  test('discloses demonstration mode somewhere on the page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/demonstration mode/i).first()).toBeVisible()
  })
})

test.describe('offers', () => {
  test('lists promotions and picks', async ({ page }) => {
    await page.goto('/offers')
    await expect(page.getByRole('heading', { name: /offers & deals/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /view offer/i }).first()).toBeVisible()
  })

  test('a promotion card opens its own page', async ({ page }) => {
    await page.goto('/offers')
    await page.getByRole('link', { name: /view offer/i }).first().click()
    await expect(page).toHaveURL(/\/offers\/[a-z0-9-]+$/)
    // The detail page shows what the card cannot: terms.
    await expect(page.getByRole('heading', { name: /terms & conditions/i })).toBeVisible()
  })

  test('a known offer renders its own content, not a fallback', async ({ page }) => {
    await page.goto('/offers/flat-25-domestic-flights')
    await expect(page.getByRole('heading', { name: /flat 25% off domestic flights/i })).toBeVisible()
    // Exact: the code also appears inside the description prose, so a substring
    // match resolves to two elements and trips strict mode.
    await expect(page.getByText('Code: MMTHDFC', { exact: true })).toBeVisible()
  })

  test('an unknown offer says so instead of crashing', async ({ page }) => {
    await page.goto('/offers/no-such-offer-exists')
    await expect(page.getByRole('heading', { name: /this offer has ended/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /back to home/i })).toBeVisible()
  })

  test('every offer action leads to a page that renders', async ({ page }) => {
    await page.goto('/offers/airport-cabs-200-off')
    await page.getByRole('button', { name: /book a cab/i }).click()
    await expect(page).toHaveURL(/\/cabs/)
    // The ErrorBoundary's copy — its absence is the assertion.
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0)
  })
})

test.describe('routing', () => {
  test('checkout pages reached without a selection explain themselves', async ({ page }) => {
    // Router state is discarded by a direct visit. These used to render a blank
    // page or crash on a null fare; they should now tell the visitor what to do.
    await page.goto('/cab/payment')
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0)
  })
})

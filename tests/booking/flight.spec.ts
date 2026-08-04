// tests/booking/flight.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsCustomer } from '../utils/authHelpers';

test.describe('Flight Booking End‑to‑End', () => {
  test('complete flight booking flow', async ({ page }) => {
    // Login as a test customer
    await loginAsCustomer(page, 'customerA@test.com', 'password123');

    // Search flights
    await page.goto('/');
    await page.fill('input[placeholder="From"]', 'Delhi');
    await page.fill('input[placeholder="To"]', 'Mumbai');
    await page.fill('input[name="departure"]', '2024-12-01');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.flight-list');

    // Apply a filter (e.g., Airline)
    await page.check('input[name="airline-filter"][value="Air India"]');

    // Sort by price
    await page.selectOption('select[name="sort"]', 'price_asc');

    // Select first flight
    await page.click('.flight-card >> nth=0 button:has-text("Select")');

    // Traveller info
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="dob"]', '1990-01-01');
    await page.click('button:has-text("Continue")');

    // Mock payment – assuming test mode accepts a dummy card
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/30');
    await page.fill('input[name="cvc"]', '123');
    await page.click('button:has-text("Pay")');

    // Confirmation page
    await page.waitForSelector('.booking-confirmation');
    const bookingId = await page.textContent('.booking-id');
    expect(bookingId).toMatch(/BK\d{6}/);

    // Download PDF invoice
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download PDF")')
    ]);
    const path = await download.path();
    expect(path).not.toBeNull();

    // Verify My Trips entry
    await page.goto('/my-trips');
    await expect(page.locator(`.trip-card:has-text("${bookingId}")`)).toBeVisible();
  });
});

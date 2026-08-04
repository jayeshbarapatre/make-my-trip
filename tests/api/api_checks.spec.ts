// tests/api/api_checks.spec.ts
import { test, expect, request } from '@playwright/test';

// Example of converting a curl check into a Playwright API test
test('GET /api/health should return 200 and status ok', async ({}) => {
  const apiRequest = await request.newContext({ baseURL: 'http://localhost:3000' });
  const response = await apiRequest.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('ok');
});

// Add further tests for the remaining 19 curl checks here

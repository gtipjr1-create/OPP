import { expect, test } from '@playwright/test';

const email = process.env.OPP_E2E_EMAIL;
const password = process.env.OPP_E2E_PASSWORD;

test.skip(!email || !password, 'Set OPP_E2E_EMAIL and OPP_E2E_PASSWORD to run smoke auth flow.');

test('auth smoke: login and land on dashboard', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login')),
    page.getByRole('button', { name: /sign in|login/i }).click(),
  ]);

  await expect(page.getByText(/active session/i)).toBeVisible();
});

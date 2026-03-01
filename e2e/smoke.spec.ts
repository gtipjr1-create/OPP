import { expect, test } from '@playwright/test';

const email = process.env.OPP_E2E_EMAIL;
const password = process.env.OPP_E2E_PASSWORD;

test('public smoke: login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'OPP' })).toBeVisible();
  await expect(page.getByPlaceholder('email')).toBeVisible();
  await expect(page.getByPlaceholder('password')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('auth smoke: login and land on dashboard', async ({ page }) => {
  test.skip(!email || !password, 'Set OPP_E2E_EMAIL and OPP_E2E_PASSWORD to run smoke auth flow.');
  await page.goto('/login');

  await page.getByPlaceholder('email').fill(email!);
  await page.getByPlaceholder('password').fill(password!);

  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login')),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  await expect(page.getByText(/active session/i)).toBeVisible();
});

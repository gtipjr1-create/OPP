import { expect, test } from '@playwright/test';

const email = process.env.OPP_E2E_EMAIL;
const password = process.env.OPP_E2E_PASSWORD;

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('email').fill(email!);
  await page.getByPlaceholder('password').fill(password!);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login')),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  await expect(page.getByText(/active session/i)).toBeVisible();
}

test.describe('task row visuals', () => {
  test.skip(!email || !password, 'Set OPP_E2E_EMAIL and OPP_E2E_PASSWORD for visual task-row checks.');

  test('desktop task row normal + confirm-delete', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);

    const row = page.locator('[data-task-id]').first();
    await expect(row).toBeVisible();
    await expect(row).toHaveScreenshot('task-row-desktop-normal.png');

    await row.getByRole('button', { name: /delete task/i }).click();
    await expect(row.getByText('Delete this task?')).toBeVisible();
    await expect(row).toHaveScreenshot('task-row-desktop-confirm-delete.png');
  });

  test('mobile task row normal + confirm-delete', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);

    const row = page.locator('[data-task-id]').first();
    await expect(row).toBeVisible();
    await expect(row).toHaveScreenshot('task-row-mobile-normal.png');

    await row.getByRole('button', { name: /delete task/i }).click();
    await expect(row.getByText('Delete this task?')).toBeVisible();
    await expect(row).toHaveScreenshot('task-row-mobile-confirm-delete.png');
  });
});

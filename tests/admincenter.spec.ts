import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';

test('Open Admin Center', async ({ page }) => {
    await page.goto('https://admin.officeatwork.com/');
    await signIn(page);

    await expect(page).toHaveURL(/admin\.officeatwork\.com/);
    await expect(page.getByText('officeatwork Admin Center')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: 'Admin Center' })).toBeVisible({ timeout: 15000 });

    await page.screenshot({
        path: './screenshots/admincenter_open.png',
        fullPage: true,
    });
});

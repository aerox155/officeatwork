import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';
import { HtmlReport } from './functions/htmlReport';

test('Open Admin Center', async ({ page }) => {
    const report = new HtmlReport('Open Admin Center');

    await page.goto('https://admin.officeatwork.com/');
    await signIn(page);
    report.step('Login successfully');

    await expect(page).toHaveURL(/admin\.officeatwork\.com/);
    report.step('Navigated to Admin Center');

    await expect(page.getByText('officeatwork Admin Center')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: 'Admin Center' })).toBeVisible({ timeout: 15000 });
    report.step('Verified Admin Center loaded successfully');

    await report.finish(page);
});

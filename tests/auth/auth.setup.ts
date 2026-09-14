import fs from 'fs';
import { test as setup } from '@playwright/test';
import { signIn } from './signin';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    setup.skip(fs.existsSync(authFile), 'reusing saved sign-in session');

    await page.goto('https://admin.officeatwork.com/');
    await signIn(page);
    await page.context().storageState({ path: authFile });
});

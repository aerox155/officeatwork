import fs from 'fs';
import { test as setup } from '@playwright/test';
import { signIn, microsoftLogin } from './signin';

const aeroxAuthFile = 'playwright/.auth/user.json';
const outlookAuthFile = 'playwright/.auth/outlook-user.json';
const officeAuthFile = 'playwright/.auth/office-user.json';

setup('authenticate', async ({ browser }) => {
    if (!fs.existsSync(aeroxAuthFile)) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('https://templatechooser.officeatwork.com/');
        await signIn(page);
        await context.storageState({ path: aeroxAuthFile });
        await context.close();
    }

    // A separate context avoids the two Microsoft accounts colliding through a
    // shared SSO session cookie.
    if (!fs.existsSync(outlookAuthFile)) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('https://outlook.office.com/mail/');
        await microsoftLogin(page, 'productionupn@thangph.onmicrosoft.com', 'akUmPFIp4T');
        await context.storageState({ path: outlookAuthFile });
        await context.close();
    }

    // A third, separate account/context for office.com (customupn).
    if (!fs.existsSync(officeAuthFile)) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('https://www.office.com/');
        // This account requires interactive 2FA (number matching on mobile), so it
        // can't be automated - run this setup with --headed and sign in manually,
        // then click Resume in the Inspector once logged in.
        await page.pause();
        await context.storageState({ path: officeAuthFile });
        await context.close();
    }
});

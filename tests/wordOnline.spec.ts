import { test } from '@playwright/test';
import { HtmlReport } from './functions/htmlReport';
import { microsoftLogin } from './auth/signin';

// Different account than the shared aerox/productionupn sessions - reuse its own
// cached login (see auth/auth.setup.ts, officeAuthFile) instead of starting clean.
test.use({ storageState: 'playwright/.auth/office-user.json' });

test('Word Online - Select Build then Template Chooser (Custom)', async ({ page }) => {
    test.setTimeout(240000);
    const report = new HtmlReport('Word Online Select Build');

    await page.goto('https://word.cloud.microsoft/');
    report.step('Opened Office online');

    // The cached session may have expired - sign in again if the login form shows up.
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    const needsLogin = await signInLink
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);

    if (needsLogin) {
        await signInLink.click();
        await microsoftLogin(page, 'customupn@thangph.onmicrosoft.com', 'akUmPFIp4T');
        report.step('Signed in as customupn@thangph.onmicrosoft.com');
    } else {
        report.step('Reused cached sign-in session');
    }

    const popupPromise = page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null);
    await page.getByRole('region', { name: 'quick actions' }).getByRole('button').first().click();
    const popup = await popupPromise;
    const docPage = popup ?? page;
    report.step(popup ? 'Created new Word document (opened in new tab)' : 'Created new Word document');

    // Opening a new document bounces through login.microsoftonline.com for SSO
    // before the editor settles, which can take a while.
    const developerTab = docPage.locator('iframe[name="WacFrame_Word_0"]').contentFrame().getByRole('tab', { name: 'Developer' });
    await developerTab.waitFor({ state: 'visible', timeout: 60000 });
    await docPage.waitForTimeout(2000);
    await developerTab.click();
    report.step('Opened Developer tab');

    await docPage.getByRole('button', { name: 'Select Build', exact: true }).click();
    report.step('Opened Select Build add-in');

    const addInFrame = docPage.locator('iframe[title*="Select Build"]').contentFrame();
    await addInFrame.getByRole('textbox').fill('3826');
    report.step('Searched for build number 3826');

    await addInFrame.getByRole('listitem').first().click();
    report.step('Selected first matching build');

    await docPage.getByRole('tab', { name: 'Home' }).click();
    report.step('Opened Home tab');

    await docPage.getByRole('button', { name: /Template Chooser/ }).click();
    report.step('Opened Template Chooser (Custom)');

    await report.finish(docPage);
});

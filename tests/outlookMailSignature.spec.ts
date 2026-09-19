import { test } from '@playwright/test';
import { HtmlReport } from './functions/htmlReport';
import { microsoftLogin } from './auth/signin';

// Different account than the shared aerox session - reuse its own cached login
// (see auth/outlook.setup.ts) instead of the aerox one.
test.use({ storageState: 'playwright/.auth/outlook-user.json' });

test('Outlook Mail Signature template and audience', async ({ page }) => {
    const report = new HtmlReport('Outlook Mail Signature');

    await page.goto('https://outlook.office.com/mail/');
    report.step('Opened Outlook on the web');

    // The cached session may have expired - sign in again if the login form shows up.
    const emailInput = page.locator('input[type="email"]');
    const needsLogin = await emailInput
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);

    if (needsLogin) {
        await microsoftLogin(page, 'productionupn@thangph.onmicrosoft.com', 'akUmPFIp4T');
        report.step('Signed in as productionupn@thangph.onmicrosoft.com');
    } else {
        report.step('Reused cached sign-in session');
    }

    const newButton = page.getByRole('button', { name: 'New', exact: true });
    const scrollRibbonRightButton = page.getByLabel('Scroll ribbon right');

    // The Mail Signature app tile's text always starts with "MailSignature", but
    // what follows varies per page load - if it's not there yet, reload and retry.
    const mailSignatureButton = page.getByText(/^MailSignature/);

    let found = false;
    for (let reloadAttempt = 0; reloadAttempt < 5 && !found; reloadAttempt++) {
        if (reloadAttempt > 0) {
            await page.reload();
            report.step('Reloaded page to retry Mail Signature app button');
        }

        await newButton.waitFor({ state: 'visible', timeout: 15000 });
        await newButton.click({ timeout: 5000 }).catch(() => { });
        report.step('Created new email');
        await page.waitForTimeout(3000);

        await scrollRibbonRightButton.waitFor({ state: 'visible', timeout: 15000 });
        await scrollRibbonRightButton.click({ timeout: 5000 }).catch(() => { });
        report.step('Scrolled ribbon right');

        for (let attempt = 0; attempt < 10 && !found; attempt++) {
            if (await mailSignatureButton.isVisible().catch(() => false)) {
                found = true;
                break;
            }

            if (!(await scrollRibbonRightButton.isEnabled().catch(() => false))) {
                break;
            }
            await scrollRibbonRightButton.click({ timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(500);
        }
    }

    if (found) {
        await mailSignatureButton.click({ timeout: 5000 });
    }

    // Two iframes share this title - only the one loading taskpane.html is the
    // actual visible UI; the other (runtime.html) is a background loader.
    const addInFrameLocator = page.locator('iframe[title="Office Add-in Mail Signature"][src*="taskpane.html"]');

    report.step('Opened Mail Signature app');

    await addInFrameLocator.waitFor({ state: 'attached', timeout: 30000 });
    const addInFrame = addInFrameLocator.contentFrame();
    await addInFrame.getByRole('button', { name: 'Choose Signature' }).click();
    await addInFrame.getByTitle('Smoke Test Signature Template', { exact: true }).click();
    report.step('Selected "Smoke Test Signature Template"');

    await page.getByRole('button', { name: 'Close add-in pane' }).click();

    await page.getByRole('button', { name: 'Dismiss' }).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await page.getByText('External', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await report.stepWithScreenshot('Signature inserted after choosing template', page);

    await page.getByLabel('Discard').click();
    await page.getByRole('button', { name: 'OK' }).click();
    report.step('Closed the email');

    await page.getByRole('button', { name: 'Scroll ribbon left' }).click();

    await page.getByRole('button', { name: 'New', exact: true }).click();
    report.step('Created new email again');

    await page.getByRole('button', { name: 'Dismiss' }).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    await page.getByText('External', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await report.stepWithScreenshot('Signature inserted automatically', page);

    await page.getByLabel('To', { exact: true }).click();
    await page.getByLabel('To', { exact: true }).fill('custom');
    await page.getByRole('option', { name: 'Custom !@#$% &*()_' }).click();
    report.step('Selected recipient "Custom !@#$% &*()_"');

    await page.getByText('Internal', { exact: true }).click();
    report.step('Waited for signature to update based on audience');

    await report.finish(page);
});

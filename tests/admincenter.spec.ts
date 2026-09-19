import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';
import { HtmlReport } from './functions/htmlReport';
import { selectSharePointAtdDestination } from './functions/selectSharePointDestination';

// These tests depend on each other's state (admin privileges, library sources),
// so they must run one after another, in this order, rather than in parallel.
// They also share one HtmlReport instance so all three end up in a single
// "Admin Center" report file instead of a separate file each.
test.describe.serial('Admin Center', () => {
    const report = new HtmlReport('Admin Center');

    test('Remove and Re-Add Admin center', async ({ page }) => {
        report.section('Remove and Re-Add Admin center');

        await page.goto('https://admin.officeatwork.com/');
        await signIn(page);
        report.step('Login successfully');

        await page.getByRole('link', { name: 'Admin' }).click();
        report.step('Opened Admin tab');

        const administratorsGrid = page.getByRole('grid');
        const deleteButton = page.getByRole('button', { name: 'Delete', exact: true });

        // The grid briefly shows skeleton placeholder rows while loading, so check for
        // an actual email address rather than just row presence.
        await page.waitForTimeout(3000);
        const hasExistingAdmins = await administratorsGrid
            .getByRole('gridcell')
            .filter({ hasText: '@' })
            .first()
            .waitFor({ state: 'visible', timeout: 3000 })
            .then(() => true)
            .catch(() => false);

        if (hasExistingAdmins) {
            const selectAllCheckbox = administratorsGrid.getByRole('row').first().getByRole('checkbox');
            await selectAllCheckbox.click();
            report.step('Selected all current administrators');

            await deleteButton.click();

            // Each administrator gets its own "Delete Administrator" confirmation dialog,
            // shown one after another - keep confirming until none remain.
            const deleteDialog = page.getByRole('alertdialog', { name: 'Delete Administrator' });
            for (let attempt = 0; attempt < 10; attempt++) {
                const hasDialog = await deleteDialog
                    .waitFor({ state: 'visible', timeout: 5000 })
                    .then(() => true)
                    .catch(() => false);
                if (!hasDialog) {
                    break;
                }
                await page.waitForTimeout(500);
                await deleteDialog.getByRole('button', { name: 'Delete', exact: true }).click({ timeout: 10000 }).catch(() => { });
                await page.waitForTimeout(1000);
            }
            // Wait for the admin list to settle with no administrators left before
            // capturing the "removed" screenshot.
            await expect(administratorsGrid.getByRole('gridcell').filter({ hasText: '@' })).toHaveCount(0, { timeout: 15000 });
            report.step('Removed all current administrators');
        } else {
            report.step('No existing administrators to remove');
        }
        await report.stepWithScreenshot('Admin list shows no administrators', page);

        const addMyselfButton = page.getByRole('button', { name: 'Add myself' });
        await expect(addMyselfButton).toBeEnabled({ timeout: 15000 });
        await addMyselfButton.click();
        report.step('Opened "Add Myself as Administrator" panel');

        await page.getByRole('button', { name: 'Verify Me' }).click();

        // Wait for verification to finish and the panel to close, then confirm the
        // administrators list actually shows the newly added account.
        await page.getByText('Verifying...').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => { });
        await expect(administratorsGrid.getByRole('gridcell').filter({ hasText: '@' }).first()).toBeVisible({ timeout: 30000 });
        report.step('Verified and added myself as administrator');
        await report.stepWithScreenshot('Admin list shows myself as administrator', page);

        const SECOND_ADMIN_EMAIL = 'grandfilano@thangph.onmicrosoft.com';
        await page.getByRole('button', { name: 'Add', exact: true }).click();
        report.step('Opened "Add Administrator" panel');

        const addAdminDialog = page.getByRole('dialog', { name: 'Add Administrator' });
        const adminSearchBox = addAdminDialog.getByRole('combobox');
        await adminSearchBox.click();
        // fill() sets the value in one shot and doesn't reliably trigger this search box's
        // debounced lookup - it needs real keystroke events, so type it out instead.
        await adminSearchBox.pressSequentially(SECOND_ADMIN_EMAIL, { delay: 50 });
        // The suggestion listbox renders in a portal outside the dialog's DOM subtree,
        // so it has to be searched for at the page level rather than scoped to the dialog.
        const searchResult = page.getByRole('option').filter({ hasText: SECOND_ADMIN_EMAIL });
        await searchResult.waitFor({ state: 'visible', timeout: 20000 });
        await searchResult.click();
        report.step(`Selected "${SECOND_ADMIN_EMAIL}"`);

        await addAdminDialog.getByRole('button', { name: 'Save', exact: true }).click();
        await addAdminDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
        await expect(administratorsGrid.getByRole('row').filter({ hasText: SECOND_ADMIN_EMAIL })).toHaveCount(1, { timeout: 15000 });
        report.step(`Added "${SECOND_ADMIN_EMAIL}" as second administrator`);
        await report.stepWithScreenshot('Admin list shows both administrators', page);
    });



    const LIBRARY_SOURCES = ['SharePoint', 'Teams', 'OneDrive', 'Unsplash', 'Pixabay', 'Frontify'];
    const FRONTIFY_DOMAIN = 'officeatwork.frontify.com';
    const FRONTIFY_LIBRARY_NAME = 'Phông Ty Pahi';

    async function setLibrarySourceEnabled(page: import('@playwright/test').Page, index: number, enabled: boolean) {
        await page.getByRole('button', { name: 'Manage' }).nth(index).click();
        await page.waitForTimeout(1000);

        const dialog = page.getByRole('dialog', { name: LIBRARY_SOURCES[index] });
        const toggle = dialog.getByRole('switch');
        const targetLabel = enabled ? 'Enabled' : 'Disabled';

        for (let attempt = 0; attempt < 3; attempt++) {
            const isAlreadyTarget = await dialog.getByText(targetLabel, { exact: true }).isVisible().catch(() => false);
            if (isAlreadyTarget) {
                break;
            }
            await toggle.click();
            await page.waitForTimeout(500);
        }

        if (enabled && LIBRARY_SOURCES[index] === 'Frontify') {
            await dialog.getByRole('textbox', { name: 'Frontify Domain' }).waitFor({ state: 'visible', timeout: 10000 });
            await dialog.getByRole('textbox', { name: 'Frontify Domain' }).fill(FRONTIFY_DOMAIN);
            await dialog.getByRole('textbox', { name: 'Library Name' }).fill(FRONTIFY_LIBRARY_NAME);
        }

        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        await page.waitForTimeout(1000);
    }

    // Opens the Content Chooser web app in its own tab, opens the "Libraries" panel and
    // checks whether it lists any libraries - used to verify the effect of disabling/enabling
    // library sources in Admin Center. The panel keeps a "Loading library..." spinner behind
    // it indefinitely in this standalone-browser context, so that spinner is ignored; only the
    // drawer's own body content (empty vs. populated) is checked. Always closes the tab before
    // returning, leaving the caller back on the Admin Center page.
    async function checkContentChooserLibraries(
        context: import('@playwright/test').BrowserContext,
        expectLibraries: boolean,
        screenshotLabel: string
    ) {
        const ccPage = await context.newPage();
        await ccPage.goto('https://contentchooser.officeatwork.com/');
        await ccPage.getByRole('button', { name: 'Select Library' }).click({ timeout: 20000 });

        const drawerBody = ccPage.getByRole('dialog').locator('.fui-DrawerBody');
        if (expectLibraries) {
            await expect(drawerBody).not.toHaveText('', { timeout: 30000 });
        } else {
            await expect(drawerBody).toHaveText('', { timeout: 15000 });
        }

        await report.stepWithScreenshot(screenshotLabel, ccPage);
        await ccPage.close();
    }

    test('Content Chooser - toggle library sources and ensure ATD SharePoint library exists', async ({ page }) => {
        report.section('Content Chooser - toggle library sources and ensure ATD SharePoint library exists');

        await page.goto('https://admin.officeatwork.com/');
        await signIn(page);
        report.step('Login successfully');

        await page.getByRole('link', { name: 'Content Chooser' }).click();
        report.step('Opened Content Chooser tab');

        await page.waitForTimeout(3000);

        for (let i = 0; i < LIBRARY_SOURCES.length; i++) {
            await setLibrarySourceEnabled(page, i, false);
            report.step(`Turned off library source "${LIBRARY_SOURCES[i]}"`);
        }

        await report.stepWithScreenshot('All library sources turned off', page);

        await checkContentChooserLibraries(
            page.context(),
            false,
            'Content Chooser shows no libraries after disabling all sources'
        );
        report.step('Verified Content Chooser shows no libraries, back to Admin Center');

        await page.getByText('SharePoint hosted Content Libraries').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        const atdLibraryLink = page.getByRole('button', { name: 'ATD', exact: true });
        // Each data row is itself a role="button" element wrapping the row's gridcells -
        // only the header uses role="row".
        const atdRow = page.getByRole('button').filter({ has: atdLibraryLink });
        const atdExists = await atdLibraryLink.isVisible().catch(() => false);

        if (atdExists) {
            await atdLibraryLink.hover();
            await page.waitForTimeout(500);
            const deleteButton = page.getByRole('button', { name: 'Delete', exact: true });
            await atdRow.getByRole('checkbox').click();
            await expect(deleteButton).toBeEnabled({ timeout: 10000 });
            report.step('Selected existing "ATD" library');

            await deleteButton.click();

            const deleteDialog = page.getByRole('alertdialog');
            const hasDeleteDialog = await deleteDialog
                .waitFor({ state: 'visible', timeout: 5000 })
                .then(() => true)
                .catch(() => false);
            if (hasDeleteDialog) {
                await deleteDialog.getByRole('button', { name: 'Delete', exact: true }).click();
            }

            // Wait for the delete confirmation dialog to fully close and the library
            // list to settle without "ATD" before capturing the screenshot.
            await deleteDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
            await expect(atdLibraryLink).toBeHidden({ timeout: 15000 });
            report.step('Removed "ATD" SharePoint library');
            await report.stepWithScreenshot('"ATD" library removed', page);
        }

        await page.getByRole('button', { name: 'Add' }).click();

        const addDialog = page.getByRole('dialog', { name: 'Add SharePoint Library' });
        // The "Linked Document Library" field's label isn't properly associated, so it
        // has no accessible name - it's the first textbox in the dialog; "Name" is second.
        const linkedLibraryInput = addDialog.getByRole('textbox').first();
        await linkedLibraryInput.waitFor({ state: 'visible', timeout: 15000 });

        await selectSharePointAtdDestination(
            linkedLibraryInput,
            addDialog.getByRole('textbox', { name: 'Name' }),
            'ATD',
            report
        );

        await addDialog.getByRole('button', { name: 'Save', exact: true }).click();

        // Wait for the Add panel to fully close and the library to actually show up
        // in the list before capturing the screenshot.
        await addDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
        await expect(atdLibraryLink).toBeVisible({ timeout: 15000 });
        report.step('Added "ATD" SharePoint library successfully');
        await report.stepWithScreenshot('"ATD" library added', page);

        for (let i = 0; i < LIBRARY_SOURCES.length; i++) {
            await setLibrarySourceEnabled(page, i, true);
            report.step(`Turned on library source "${LIBRARY_SOURCES[i]}"`);
        }

        // Wait for the last "Manage" drawer to fully close and every source to show
        // as Enabled (no "Disabled" left in the Library Sources section specifically -
        // other unrelated settings further down the page can legitimately say
        // "Disabled") before capturing the final screenshot.
        await page.getByRole('dialog', { name: LIBRARY_SOURCES[LIBRARY_SOURCES.length - 1] })
            .waitFor({ state: 'hidden', timeout: 15000 })
            .catch(() => { });
        const librarySourcesSection = page
            .getByRole('heading', { name: 'Library Sources', level: 2 })
            .locator('xpath=ancestor::*[.//button[text()="Manage"]][1]');
        await expect(librarySourcesSection.getByText('Disabled', { exact: true })).toHaveCount(0, { timeout: 10000 });

        await checkContentChooserLibraries(
            page.context(),
            true,
            'Content Chooser shows all libraries after re-enabling sources'
        );
        report.step('Verified Content Chooser shows all libraries, back to Admin Center');
    });

    const HELP_EXPERIENCE_TOGGLES = ['Documentation', 'Support Ticket System', 'Send Feedback'];
    const HELP_EXPERIENCE_LINKS = [
        'https://www.youtube.com/@officeatwork',
        'https://developer.microsoft.com/en-us/graph/graph-explorer',
        'https://help.officeatwork.com/en/categories/20-template-chooser',
    ];

    test('Template Chooser - set Help Experience to custom links', async ({ page }) => {
        report.section('Template Chooser - set Help Experience to custom links');

        await page.goto('https://admin.officeatwork.com/');
        await signIn(page);
        report.step('Login successfully');

        await page.getByRole('link', { name: 'Template Chooser' }).click();
        report.step('Opened Template Chooser tab');

        const helpSection = page
            .getByRole('heading', { name: 'Help Experience', level: 2 })
            .locator('xpath=ancestor::*[.//button[text()="Manage"]][1]');
        await helpSection.scrollIntoViewIfNeeded();
        await helpSection.getByRole('button', { name: 'Manage' }).click();
        report.step('Opened "Help Experience" panel');

        const dialog = page.getByRole('dialog', { name: 'Help Experience' });
        await dialog.getByRole('radio', { name: 'Custom experience' }).click();
        report.step('Selected "Custom experience" option');

        // Each link's toggle switch and text input are disabled until the toggle is
        // turned on, and the inputs have no accessible name, so they're matched
        // positionally (same order as HELP_EXPERIENCE_TOGGLES). Clicking the switch
        // sometimes doesn't register (Fluent UI Switch flakiness), so check its actual
        // checked state and only click when it's still off, rather than always clicking.
        const linkInputs = dialog.locator('input[type="text"]');
        for (let i = 0; i < HELP_EXPERIENCE_TOGGLES.length; i++) {
            const toggle = dialog.getByRole('switch', { name: HELP_EXPERIENCE_TOGGLES[i] });
            for (let attempt = 0; attempt < 5 && !(await toggle.isChecked()); attempt++) {
                await toggle.click();
                await page.waitForTimeout(400);
            }
            await expect(toggle).toBeChecked({ timeout: 5000 });

            await expect(linkInputs.nth(i)).toBeEnabled({ timeout: 5000 });
            await linkInputs.nth(i).fill(HELP_EXPERIENCE_LINKS[i]);
            report.step(`Set "${HELP_EXPERIENCE_TOGGLES[i]}" link`);
        }

        await report.stepWithScreenshot('Custom Help Experience links filled in', page);

        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        await dialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
        await expect(helpSection.getByText('Custom experience', { exact: true })).toBeVisible({ timeout: 15000 });
        report.step('Saved custom Help Experience configuration');
        await report.stepWithScreenshot('Help Experience set to custom links', page);

        // Verify the links actually take effect in the Template Chooser app itself:
        // each Help menu entry should open a popup pointing at its configured link.
        const tcPage = await page.context().newPage();
        await tcPage.goto('https://templatechooser.officeatwork.com/');
        await tcPage.waitForTimeout(8000);

        for (let i = 0; i < HELP_EXPERIENCE_TOGGLES.length; i++) {
            const linkLabel = HELP_EXPERIENCE_TOGGLES[i];
            const expectedUrl = HELP_EXPERIENCE_LINKS[i];

            await tcPage.getByRole('button', { name: 'Help' }).click();
            await tcPage.waitForTimeout(500);

            const popupPromise = page.context().waitForEvent('page', { timeout: 10000 });
            await tcPage.getByRole('menuitem', { name: linkLabel }).click();
            const popup = await popupPromise;
            await popup.waitForLoadState('domcontentloaded').catch(() => { });
            await popup.waitForTimeout(1500);

            // Some destinations (e.g. LinkedIn) redirect an unauthenticated visitor to
            // their own login page, carrying the original URL along as a redirect param -
            // that still confirms the configured link is correct, so accept either form.
            const actualUrl = popup.url();
            const opensExpectedUrl = actualUrl === expectedUrl || actualUrl.includes(encodeURIComponent(expectedUrl));
            expect(opensExpectedUrl).toBe(true);
            report.step(`Verified Help menu "${linkLabel}" link opens ${expectedUrl}`);
            await report.stepWithScreenshot(`Help menu "${linkLabel}" link opened`, popup);
            await popup.close();
        }

        await tcPage.close();
        report.step('Verified Template Chooser Help menu links, back to Admin Center');

        // Last test in the sequence - write out the combined report for all four.
        await report.finish(page);
    });
});

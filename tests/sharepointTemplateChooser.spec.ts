import { test, expect, Page, FrameLocator } from '@playwright/test';
import { HtmlReport } from './functions/htmlReport';

async function openTemplateChooser(page: Page, report: HtmlReport) {
    const templateChooserItem = page.getByRole('menuitem', { name: 'Template Chooser' });

    if (!(await templateChooserItem.isVisible().catch(() => false))) {
        await page.getByRole('menuitem', { name: 'More' }).click();
        report.step('Clicked "..." (More) button');
    }

    await templateChooserItem.click();
    report.step('Clicked "Template Chooser"');

    const dialog = page.getByRole('dialog', { name: /Template Chooser/i });
    const popupTitleHeading = dialog.getByRole('heading', { level: 1 });
    await expect(popupTitleHeading).toBeVisible();

    const popupTitle = (await popupTitleHeading.innerText()).trim();
    report.setMeta('Popup title', popupTitle);

    const frame = dialog.frameLocator('iframe');
    return { dialog, frame, popupTitle };
}

// The (Test) build of the panel can start on an internal "Pick version" screen used to
// choose which backend build/config the app loads from. Some builds don't include the
// template-chooser app at all, so walk the version list (newest first) until one does,
// select it, then reload SharePoint so the site picks up that build.
async function resolveVersionPicker(page: Page, frame: FrameLocator, report: HtmlReport): Promise<boolean> {
    const pickVersionParagraph = frame.getByText('Pick version:');
    const settingsButton = frame.getByRole('button', { name: 'Settings' });

    // Wait for the iframe to settle on either the normal app or the build-picker screen.
    await Promise.race([
        pickVersionParagraph.waitFor({ state: 'visible' }),
        settingsButton.waitFor({ state: 'visible' }),
    ]);

    if (!(await pickVersionParagraph.isVisible().catch(() => false))) {
        return false;
    }

    report.step('Encountered "Pick version" build-selector screen');

    const versionTextbox = frame.getByRole('textbox');
    const versionList = frame.getByRole('listitem').filter({ hasText: /^\d/ });

    // Clearing the textbox re-triggers its suggestion list - clicking it again once
    // a version is already selected does not reopen the list on its own.
    const openVersionList = async () => {
        await versionTextbox.click();
        await versionTextbox.selectText();
        await versionTextbox.press('Backspace');
        await versionList.first().waitFor({ state: 'visible', timeout: 8000 });
    };

    await openVersionList();

    const versionCount = await versionList.count();

    for (let i = 0; i < versionCount; i++) {
        const versionItem = versionList.nth(i);
        const versionLabel = (await versionItem.innerText()).trim();

        await versionItem.click();

        const appsList = frame.getByText(`Apps for ${versionLabel}:`);
        await appsList.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});

        const hasTemplateChooser = await frame.getByRole('link', { name: 'template-chooser' }).isVisible().catch(() => false);

        if (hasTemplateChooser) {
            report.step(`Version "${versionLabel}" includes template-chooser`);

            await page.reload();
            report.step('Refreshed SharePoint page');
            return true;
        }

        report.step(`Version "${versionLabel}" does not include template-chooser, trying version below`);
        await openVersionList();
    }

    throw new Error('No build version with template-chooser was found in the version list');
}

test('Create template from SharePoint Template Chooser', async ({ page }) => {
    const report = new HtmlReport('SharePoint Template Chooser');

    await page.goto('https://thangph.sharepoint.com/sites/Aerox/Shared%20Documents/Forms/AllItems.aspx');
    report.step('Opened SharePoint document library');

    let { dialog, frame } = await openTemplateChooser(page, report);

    // If the panel opened into the internal build picker, fix the version and reopen.
    if (await resolveVersionPicker(page, frame, report)) {
        ({ dialog, frame } = await openTemplateChooser(page, report));

        if (await resolveVersionPicker(page, frame, report)) {
            throw new Error('Template Chooser still shows the version picker after refreshing once');
        }
    }

    const settingsButton = frame.getByRole('button', { name: 'Settings' });
    await settingsButton.click();
    report.step('Opened Settings');

    await frame.getByText('About').click();
    report.step('Opened About');

    const productBuildLabel = frame.getByText('Product Build', { exact: true });
    await productBuildLabel.scrollIntoViewIfNeeded();

    const productBuild = (await productBuildLabel.locator('..').innerText())
        .replace('Product Build', '')
        .trim();
    report.setMeta('Product Build', productBuild);

    await frame.getByRole('dialog', { name: 'About' }).getByRole('button', { name: 'Close' }).click();
    report.step('Closed About');

    const selectLibraryButton = frame.getByRole('button', { name: 'Select Library' });
    const openingPrompt = frame.getByText('Please select how you would like your document to be opened.');

    let savedFileName = 'Automated';

    // The panel either shows the library/template picker, or jumps straight into
    // auto-creating a document from the last used template.
    await Promise.race([
        selectLibraryButton.waitFor({ state: 'visible' }),
        openingPrompt.waitFor({ state: 'visible' }),
    ]);

    if (await selectLibraryButton.isVisible().catch(() => false)) {
        await selectLibraryButton.click();
        await frame.locator('button').filter({ hasText: 'ATD' }).click();
        report.step('Selected library "ATD"');

        await frame.getByRole('button', { name: 'Document Automated' }).click();
        report.step('Selected template "Document Automated"');

        // Saves directly into the current SharePoint library - no destination step here.
        const fileNameInput = frame.getByRole('textbox', { name: 'File name' });
        const saveButton = frame.getByRole('button', { name: 'Save', exact: true });

        savedFileName = await fileNameInput.inputValue();

        await report.stepWithScreenshot('Ready to save template', page);
        await saveButton.click();

        const duplicateAlert = frame.getByRole('alert').filter({ hasText: 'already exists' });
        const hasDuplicateError = await duplicateAlert
            .waitFor({ state: 'visible', timeout: 8000 })
            .then(() => true)
            .catch(() => false);

        if (hasDuplicateError) {
            savedFileName = `${savedFileName}_${Date.now()}`;

            await fileNameInput.click();
            await fileNameInput.fill(savedFileName);
            report.step(`File already existed, renamed to "${savedFileName}"`);

            await saveButton.click();
        }
        await report.stepWithScreenshot('Saved template', page);
    } else {
        report.step('Template Chooser started creating the document automatically');
    }

    await expect(openingPrompt).toBeVisible({ timeout: 60000 });
    report.step('Document created successfully');

    await frame.getByRole('button', { name: "Don't open" }).click();
    report.step('Dismissed "open file" prompt');

    await expect(frame.getByText('Done')).toBeVisible({ timeout: 15000 });
    report.step('Verified template created successfully');

    await dialog.getByRole('button', { name: 'Close' }).click();
    report.step('Closed Template Chooser popup');

    // The underlying SharePoint page was never reloaded, so it picks up the newly
    // saved file via its own live sync rather than needing an explicit refresh or
    // search - reloading here has proven to race a slightly-behind replica.
    const createdFileRow = page.getByRole('button', { name: new RegExp(savedFileName) });
    await createdFileRow.scrollIntoViewIfNeeded();
    await expect(createdFileRow).toBeVisible({ timeout: 30000 });
    report.step(`Found created file "${savedFileName}" in the SharePoint library`);

    await report.finish(page);
});

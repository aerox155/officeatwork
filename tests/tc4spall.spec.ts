import { test, expect, Page, FrameLocator } from '@playwright/test';
import { HtmlReport } from './functions/htmlReport';

async function openTemplateChooser(page: Page, report: HtmlReport) {
    const templateChooserItem = page.getByRole('menuitem', { name: 'Template Chooser' });

    if (!(await templateChooserItem.isVisible().catch(() => false))) {
        // Short timeout here so a missing ribbon item (e.g. a freshly deployed package
        // still propagating) fails fast instead of eating the whole test timeout.
        await page.getByRole('menuitem', { name: 'More' }).click({ timeout: 15000 });
        report.step('Clicked "..." (More) button');
    }

    await templateChooserItem.click({ timeout: 15000 });
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

// Installs a template-chooser SharePoint package from solution-packages/, replacing
// whatever variant is currently deployed in the App Catalog (if any), trusting and
// deploying it, then confirming the deployment-settings prompts.
async function installSolutionPackage(page: Page, packageFileName: string, report: HtmlReport) {
    await page.goto('https://thangph.sharepoint.com/sites/appcatalog/AppCatalog/Forms/AllItems.aspx');
    report.step(`Opened App Catalog to install "${packageFileName}"`);

    // Remove every currently installed template-chooser package - there can be more
    // than one left over from previous runs, not just a single existing one. This is
    // the classic SharePoint list view, where each row's checkbox only appears on
    // hover, so rows are found via their title link and scoped to the nearest <tr>.
    const packageLinks = page.getByRole('link', { name: /^template-chooser-for-/ });
    let remainingPackages = await packageLinks.count();

    while (remainingPackages > 0) {
        const row = packageLinks.first().locator('xpath=ancestor::tr[1]');
        await row.hover();
        await row.getByRole('checkbox').click();
        await row.getByRole('link', { name: 'Open Menu' }).click();
        await page.getByRole('link', { name: 'More actions' }).click();

        // The confirm dialog asks "...send the item(s) to the site Recycle Bin?" -
        // dismiss() is Cancel and silently keeps the item, accept() is OK and actually
        // deletes it.
        page.once('dialog', dialog => {
            dialog.accept().catch(() => { });
        });
        await page.getByRole('link', { name: 'Delete' }).click();
        report.step('Deleted an existing template-chooser package');

        await page.waitForTimeout(2000);
        remainingPackages = await packageLinks.count();
    }

    await page.getByRole('button', { name: ' Upload' }).click();
    const addDocumentDialog = page.getByRole('dialog', { name: 'Add a document' });
    await addDocumentDialog
        .locator('iframe')
        .contentFrame()
        .getByRole('button', { name: 'Enter or browse for uploading' })
        .setInputFiles(`solution-packages/${packageFileName}`);
    await addDocumentDialog.locator('iframe').contentFrame().getByRole('button', { name: 'OK' }).click();
    report.step(`Uploaded "${packageFileName}"`);

    // The trust/deploy dialog only appears the first time a given app ID is uploaded -
    // updating an already-trusted app (e.g. switching between variants that share the
    // same solution ID) can silently auto-deploy without it.
    const trustDialog = page.getByRole('dialog', { name: 'Do you trust officeatwork' });
    const needsTrustConfirmation = await trustDialog
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);

    if (needsTrustConfirmation) {
        await trustDialog.locator('iframe').contentFrame().locator('#ctl00_PlaceHolderMain_skipFeatureDeployment').check();
        await trustDialog.locator('iframe').contentFrame().getByRole('button', { name: 'Deploy' }).click();
        report.step(`Deployed "${packageFileName}"`);
    } else {
        report.step(`"${packageFileName}" auto-deployed without a trust prompt`);
    }

    await page.goto(
        'https://thangph.sharepoint.com/sites/appcatalog/AppCatalog/Forms/AllItems.aspx?InitialTabId=Ribbon%2ERead&VisibilityContext=WSSTabPersistence#InplviewHash2b386ca6-662b-44d0-b6c9-44d8fec4a5d4=WebPartID%3D%7B2B386CA6--662B--44D0--B6C9--44D8FEC4A5D4%7D'
    );
    await page.getByRole('gridcell', { name: 'Yes' }).nth(2).click();
    await page.getByRole('gridcell', { name: 'Yes' }).nth(3).click();
    await page.getByRole('gridcell', { name: 'Yes' }).nth(4).click();
    report.step(`Confirmed deployment settings for "${packageFileName}"`);

    // Clear the browser cache and hard-reload so the site picks up the newly deployed
    // package's ribbon custom action instead of a stale cached version.
    const cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('Network.clearBrowserCache');
    await page.goto('https://thangph.sharepoint.com/sites/Aerox/Shared%20Documents/Forms/AllItems.aspx');
    await page.reload({ waitUntil: 'domcontentloaded' });
    report.step('Cleared browser cache and hard-reloaded the SharePoint site');
}

// A freshly deployed package (or a reload triggered by resolveVersionPicker) can take
// a while to propagate to the site's ribbon custom action, so retry with reloads until
// "Template Chooser" actually appears, rather than failing on the first miss.
async function openTemplateChooserWithRetry(page: Page, report: HtmlReport, libraryUrl: string) {
    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            return await openTemplateChooser(page, report);
        } catch {
            report.step(`"Template Chooser" not available yet in the ribbon - waiting and reloading (attempt ${attempt + 1})`);
            await page.waitForTimeout(15000);
            await page.goto(libraryUrl);
        }
    }
    throw new Error('"Template Chooser" never appeared in the ribbon after repeated reloads');
}

// Runs the full "create a template via the SharePoint Template Chooser panel" flow
// against whichever package variant is currently deployed, used to verify each
// installed variant works before moving on to the next one.
async function runTemplateChooserFlow(page: Page, report: HtmlReport) {
    const libraryUrl = 'https://thangph.sharepoint.com/sites/Aerox/Shared%20Documents/Forms/AllItems.aspx';
    await page.goto(libraryUrl);
    report.step('Opened SharePoint document library');

    let { dialog, frame } = await openTemplateChooserWithRetry(page, report, libraryUrl);

    // If the panel opened into the internal build picker, fix the version and reopen.
    if (await resolveVersionPicker(page, frame, report)) {
        ({ dialog, frame } = await openTemplateChooserWithRetry(page, report, libraryUrl));

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

    // The document library list is virtualized, so scrollIntoViewIfNeeded() can't
    // reveal rows that aren't rendered yet - click the custom scrollbar's down-arrow
    // button (just inside the scroll container's bottom-right corner) repeatedly
    // until the target row appears.
    const scrollContainer = page.locator('[class*="scrollableContainerRef"]').first();
    const scrollBox = await scrollContainer.boundingBox();
    if (scrollBox) {
        const downArrowX = scrollBox.x + scrollBox.width - 8;
        const downArrowY = scrollBox.y + scrollBox.height - 9;

        for (let attempt = 0; attempt < 40; attempt++) {
            if (await createdFileRow.isVisible().catch(() => false)) {
                break;
            }
            await page.mouse.click(downArrowX, downArrowY);
            await page.waitForTimeout(150);
        }
    }

    await expect(createdFileRow).toBeVisible({ timeout: 30000 });

    // toBeVisible() only confirms the row is rendered in the DOM - for a virtualized
    // list that can be true while it's still scrolled below the fold. Now that it's
    // rendered, scrollIntoViewIfNeeded() can actually bring it on screen.
    await createdFileRow.scrollIntoViewIfNeeded();

    // A fullPage screenshot resizes the viewport to the document's full height, which
    // disrupts this virtualized list's rendered row window - capture just the viewport.
    await report.stepWithScreenshot(`Found created file "${savedFileName}" in the SharePoint library`, page, false);
}

// Each package's install + verify cycle runs as its own test, serialized so they share
// the App Catalog state in order - keeps each run short enough to verify individually,
// rather than one long test covering all three variants back to back.
test.describe.serial('Install and verify SharePoint Template Chooser packages', () => {
    const report = new HtmlReport('SharePoint Template Chooser');

    test('Install and verify "custom" package', async ({ page }) => {
        test.setTimeout(8 * 60 * 1000);
        report.section('Install and verify "custom" package');

        await installSolutionPackage(page, 'template-chooser-for-sharepoint-custom.sppkg', report);
        await runTemplateChooserFlow(page, report);
    });

    test('Install and verify "staging" package', async ({ page }) => {
        test.setTimeout(8 * 60 * 1000);
        report.section('Install and verify "staging" package');

        await installSolutionPackage(page, 'template-chooser-for-sharepoint-staging.sppkg', report);
        await runTemplateChooserFlow(page, report);
    });

    test('Install and verify "production" package', async ({ page }) => {
        test.setTimeout(8 * 60 * 1000);
        report.section('Install and verify "production" package');

        await installSolutionPackage(page, 'template-chooser-for-sharepoint.sppkg', report);
        await runTemplateChooserFlow(page, report);

        // Last test in the sequence - write out the combined report for all three.
        await report.finish(page);
    });
});

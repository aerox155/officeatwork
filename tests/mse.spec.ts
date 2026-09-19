import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';
import { HtmlReport } from './functions/htmlReport';
import { selectSharePointAtdDestination } from './functions/selectSharePointDestination';

test('test', async ({ page }) => {
    const report = new HtmlReport('Mail Signature Editor');

    await page.goto('https://editor.mailsignature.officeatwork.com/');
    await signIn(page);
    report.step('Login successfully');

    await page.goto('https://editor.mailsignature.officeatwork.com/#/templates');
    await page.getByRole('button', { name: 'New Template' }).click();
    report.step('Opened Templates page');

    // "New Template" opens a "Choose Design" dialog first - apply any design to
    // reach the editor, which is where the Save/location dialog lives.
    await page.getByRole('button', { name: 'Apply' }).first().click();
    report.step('Applied a design to enter the editor');

    await page.getByRole('button', { name: 'Save' }).click();
    report.step('Opened save location dialog');

    // Check the save location dialog for a "Launch officeatwork Admin" button, which
    // only appears when no SharePoint library is configured yet for this tenant.
    const launchAdminButton = page.getByRole('button', { name: 'Launch officeatwork Admin' });
    const needsLibrarySetup = await launchAdminButton
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

    if (needsLibrarySetup) {
        report.step('"Launch officeatwork Admin" button appeared - no library configured yet');

        const adminPopupPromise = page.context().waitForEvent('page');
        await launchAdminButton.click();
        const adminPage = await adminPopupPromise;
        await adminPage.waitForLoadState('domcontentloaded');
        await adminPage.waitForTimeout(6000);

        const addLibraryDialog = adminPage.getByRole('dialog', { name: 'Add SharePoint Library' });
        await adminPage.getByRole('button', { name: 'Add' }).first().click();
        // The "Linked Document Library" field is the first textbox in the dialog and has
        // no accessible name; "Name" is the second, separately-labeled textbox and is
        // required for Save to be enabled.
        await selectSharePointAtdDestination(
            addLibraryDialog.getByRole('textbox').first(),
            addLibraryDialog.getByRole('textbox', { name: 'Name' }),
            'ATD',
            report
        );
        await addLibraryDialog.getByRole('button', { name: 'Save', exact: true }).click();
        await addLibraryDialog.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
        await expect(adminPage.getByRole('button', { name: 'ATD', exact: true })).toBeVisible({ timeout: 15000 });
        await adminPage.close();
        report.step('Added "ATD" SharePoint library in Admin Center');
    } else {
        report.step('Library already configured - no need to add via Admin Center');
    }

    // This save attempt was only for the throwaway design used to check/configure the
    // library, so cancel it and start a fresh template - this time applying the second
    // design option, "Default Signature", for the real work below.
    await page.getByRole('button', { name: 'Cancel' }).click();
    report.step('Cancelled save, back to Mail Signature editor');

    await page.goto('https://editor.mailsignature.officeatwork.com/#/templates');
    // Clear the browser cache so the Templates page re-fetches library data instead of
    // reusing a stale response from before the library was added, then hard-refresh.
    const cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('Network.clearBrowserCache');
    await page.reload({ waitUntil: 'domcontentloaded' });
    report.step('Refreshed Templates page and cleared browser cache');

    await page.getByRole('button', { name: 'New Template' }).click();
    await page.getByRole('button', { name: 'Apply' }).nth(1).click();
    report.step('Created new template from "Default Signature"');

    //Reaction on some elements
    await page.getByRole('button', { name: 'Show code editor' }).click();
    await page.getByRole('button', { name: 'Add Element' }).click();
    await page.getByText('Text Field Single Line').click();

    //Add Single Line Text Field
    const container = page.getByText('Name*').locator('..').locator('..').locator('..');
    await container.getByRole('textbox', { name: 'Name' }).fill('1line');
    await page.getByRole('textbox', { name: 'Label' }).fill('1 line');
    await page.getByRole('textbox', { name: 'Hint' }).fill('1 line');
    await page.getByRole('textbox', { name: 'Description' }).fill('1line');
    await page.getByRole('tab', { name: 'Defaults' }).click();
    await page.getByRole('textbox', { name: 'Value' }).fill('default');
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Added Single Line Text Field element "1line"');

    //Open Manage Image pane
    await page.getByRole('button', { name: 'Images' }).click();
    const parent_button_off_Add_Image = page.getByRole('heading', { name: 'Manage Images' }).locator('..').locator('..').locator('..');
    await parent_button_off_Add_Image.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox', { name: 'Name' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('Aerox155DLR');
    //Upload Images and set it's width
    await page.getByTitle('image').setInputFiles('images/Aerox155DLR.jpg');
    await page.getByRole('textbox', { name: 'Width' }).click();
    await page.getByRole('textbox', { name: 'Width' }).fill('155');
    await page.getByText('Back').click();
    await page.getByRole('button', { name: 'Save' }).click();
    report.step('Uploaded image "Aerox155DLR" with width 155');

    //insert uploaded image to Signature
    await page.getByRole('button', { name: 'Show code editor' }).click();
    await page.getByRole('button', { name: 'Placeholders' }).click();
    const parent_of_images_menu = page.getByText('Current user').locator('..').locator('..');
    const parent_of_images_menu2 = page.getByText('Current user').locator('..').locator('..').locator('..');
    await parent_of_images_menu.getByText('Images').hover();
    await page.getByText('Aerox155DLR').click();
    report.step('Inserted uploaded image into signature');

    //Insert Qr code and current datetime
    await page.getByRole('button', { name: 'Functions' }).click();
    await page.getByText('QR code').click();
    await page.getByRole('button', { name: 'Functions' }).click();
    await page.getByText('now').click();
    report.step('Inserted QR code and current date/time placeholders');

    //Add language th-th
    await page.getByRole('button', { name: 'Languages' }).click();
    const parent_of_addLanguage_Button = page.getByRole('heading', { name: 'Manage Languages' }).locator('..').locator('..').locator('..');
    await parent_of_addLanguage_Button.getByRole('button', { name: 'Add' }).click();

    const parent_of_search_language = page.getByRole('heading', { name: 'Add Languages' }).locator('..');
    await parent_of_search_language.getByRole('textbox').fill('th-th');
    await page.getByText('Thai (Thailand) (th-th)').click();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Added language "Thai (Thailand) (th-th)"');

    //Adding Audience
    await page.getByRole('button', { name: 'Audience' }).click();
    await page.getByRole('switch', { name: 'Off' }).check();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox').fill('aerox@thangph.onmicrosoft.com');
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Added audience "aerox@thangph.onmicrosoft.com"');

    //Adjust Settings pane
    await page.locator('#root').getByText('Settings', { exact: true }).click();
    //Turn off all toggles
    await page.getByText('New messages').click();
    await page.getByText('Forwarded messages').click();
    await page.getByText('Reply messages').click();
    await page.getByText('New appointments').click();
    await page.getByText('Sending messages').click();
    await page.getByText('Changing recipients in').click();
    await page.getByText('Changing the sender of').click();
    //Turn on all toggles
    await page.getByText('New messages').click();
    await page.getByText('Forwarded messages').click();
    await page.getByText('Reply messages').click();
    await page.getByText('Changing recipients in').click();
    await page.getByText('Changing the sender of').click();
    report.step('Toggled notification settings');

    //Change the radio options that who can change the Signatures:
    await page.getByText('No one can override insertion').first().click();
    await page.getByText('Everyone can override').first().click();
    await page.getByText('Users and groups can override').first().click();
    // Select users/groups for the last options
    await page.getByRole('combobox').click();
    await page.getByRole('combobox').fill('aerox');
    await page.getByText('aerox@thangph.onmicrosoft.com').click();
    await page.getByRole('combobox').click();
    await page.getByRole('combobox').fill('filano');
    await page.getByText('filano@thangph.onmicrosoft.com').click();
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Set signature override permissions for users/groups');

    //add config pane
    await page.getByRole('button', { name: 'Show configuration form' }).click();
    report.step('Opened configuration form');

    await page.getByRole('textbox', { name: 'Name', exact: true }).click();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('temp name');
    report.step('Filled organization Name');

    await page.getByTestId('text-field-multi-line-organisationAddress').click();
    await page.getByTestId('text-field-multi-line-organisationAddress').fill('temp add');
    report.step('Filled organization Address');

    await page.getByRole('textbox', { name: 'Fax' }).click();
    await page.getByRole('textbox', { name: 'Fax' }).fill('456');
    report.step('Filled organization Fax');

    // Logo: upload, then replace it with the same image via the "change image" icon.
    await page.locator('.___ape66w0').first().click();
    //await page.getByRole('button', { name: 'Upload' }).click();
    await page.getByTitle('image').setInputFiles('images/banner1.jpg');
    await page.getByRole('textbox', { name: 'Width' }).click();
    await page.getByRole('textbox', { name: 'Width' }).fill('155');
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Uploaded Logo image');

    await page.locator('.___ape66w0 > .fui-Icon > path').first().click();
    //await page.getByRole('button', { name: 'Upload' }).click();
    await page.getByTitle('image').setInputFiles('images/banner1.jpg');
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Replaced Logo image');

    // Wait for the "Edit Image" panel to fully close before capturing the screenshot,
    // otherwise it can still be visible (reopened for the next field) when captured.
    await page.getByRole('heading', { name: 'Edit Image' }).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
    await report.stepWithScreenshot('Logo uploaded successfully', page);

    // Banner: upload, then replace it with the same image via the "change image" icon.
    await page.locator('.___ape66w0').click();
    //await page.getByRole('button', { name: 'Upload' }).click();
    await page.getByTitle('image').setInputFiles('images/banner2.jpg');
    await page.getByRole('textbox', { name: 'Width' }).click();
    await page.getByRole('textbox', { name: 'Width' }).fill('155');
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Uploaded Banner image');

    await page.locator('.___ape66w0 > .fui-Icon').click();
    //await page.getByRole('button', { name: 'Upload' }).click();
    await page.getByTitle('image').setInputFiles('images/banner2.jpg');
    await page.getByRole('button', { name: 'Done' }).click();
    report.step('Replaced Banner image');

    // Wait for the "Edit Image" panel to fully close before capturing the screenshot.
    await page.getByRole('heading', { name: 'Edit Image' }).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
    await report.stepWithScreenshot('Banner uploaded successfully', page);

    await page.getByTestId('text-field-multi-line-legalDisclaimer').click();
    await page.getByTestId('text-field-multi-line-legalDisclaimer').fill('legal');
    report.step('Filled legal disclaimer');

    await page.getByRole('radio', { name: 'Specific Users and Groups' }).check();
    await page.getByRole('combobox', { name: 'Search Users and Groups' }).click();
    await page.getByRole('radio', { name: 'Everyone' }).check();
    report.step('Set configuration form visibility to "Everyone"');

    await page.getByRole('button', { name: 'Save' }).click();

    // Navigate the save-location folder tree, clicking each node only if it's actually
    // present - a locator is always truthy, so each check needs a real visibility wait.
    const generalLibrary = page.getByText('General Signature Template');
    if (await generalLibrary.waitFor({ state: 'visible', timeout: 1000 }).then(() => true).catch(() => false)) {
        await generalLibrary.click();
    }
    const permissionToGroup = page.getByText('Permission to a group');
    if (await permissionToGroup.waitFor({ state: 'visible', timeout: 1000 }).then(() => true).catch(() => false)) {
        await permissionToGroup.click();
    }
    const atdLibrary = page.getByText('ATD');
    if (await atdLibrary.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)) {
        await atdLibrary.click();
    }

    const fileNameTextbox = page.getByRole('textbox', { name: 'File Name' });
    await fileNameTextbox.click();
    await fileNameTextbox.fill('Automated FileName');
    await page.getByRole('button', { name: 'Save' }).click();

    // isVisible({timeout}) does not actually wait, so a real waitFor is needed here -
    // without it, the "Overwrite?" confirmation gets missed and the save never
    // completes, even though the file name was typed in.
    const overwriteHeading = page.getByRole('heading', { name: 'Overwrite?' });
    const needsOverwriteConfirm = await overwriteHeading
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);
    if (needsOverwriteConfirm) {
        await page.getByRole('button', { name: 'Yes' }).click();
        report.step('Confirmed overwrite of existing template');
    }

    // Wait for the save dialog to actually close before treating the save as done.
    await fileNameTextbox.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => { });
    report.step('Saved general signature template');
    await page.getByRole('button', { name: 'Close' }).click();
    //await page.goto('https://editor.mailsignature.officeatwork.com/#/editor');

    await page.getByRole('button', { name: 'Automated FileName' }).click();
    await page.getByText('Automated FileName', { exact: true }).click();
    report.step('Verified saved signature template "Automated FileName"');

    await report.finish(page);
});

import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';

test('test', async ({ page }) => {
    await page.goto('https://editor.mailsignature.officeatwork.com/');
    await signIn(page);

    await page.goto('https://editor.mailsignature.officeatwork.com/#/templates');
    await page.getByRole('button', { name: 'New Template' }).click();

    //Create new Default Template
    const parent = page.getByText('Default Signature').locator('..');
    await parent.locator('..').getByRole('button', { name: 'Apply' }).click();

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

    //insert uploaded image to Signature
    await page.getByRole('button', { name: 'Show code editor' }).click();
    await page.getByRole('button', { name: 'Placeholders' }).click();
    const parent_of_images_menu = page.getByText('Current user').locator('..').locator('..');
    const parent_of_images_menu2 = page.getByText('Current user').locator('..').locator('..').locator('..');
    await parent_of_images_menu.getByText('Images').hover();
    await page.getByText('Aerox155DLR').click();

    //Insert Qr code and current datetime
    await page.getByRole('button', { name: 'Functions' }).click();
    await page.getByText('QR code').click();
    await page.getByRole('button', { name: 'Functions' }).click();
    await page.getByText('now').click();

    //Add language th-th
    await page.getByRole('button', { name: 'Languages' }).click();
    const parent_of_addLanguage_Button = page.getByRole('heading', { name: 'Manage Languages' }).locator('..').locator('..').locator('..');
    await parent_of_addLanguage_Button.getByRole('button', { name: 'Add' }).click();

    const parent_of_search_language = page.getByRole('heading', { name: 'Add Languages' }).locator('..');
    await parent_of_search_language.getByRole('textbox').fill('th-th');
    await page.getByText('Thai (Thailand) (th-th)').click();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    //Adding Audience
    await page.getByRole('button', { name: 'Audience' }).click();
    await page.getByRole('switch', { name: 'Off' }).check();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('textbox').fill('aerox@thangph.onmicrosoft.com');
    await page.getByRole('button', { name: 'Done' }).click();

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
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('General Signature Template').click();
    await page.getByText('Permission to a group').click();
    await page.getByText('General Signature Template').click();
    await page.getByRole('textbox', { name: 'File Name' }).click();
    //await page.getByRole('textbox', { name: 'File Name' }).fill('FileName');
    await page.getByRole('button', { name: 'Save' }).click();

    const overwriteHeading = page.getByRole('heading', { name: 'Overwrite?' });

    if (await overwriteHeading.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: 'Yes' }).click();
    }

    await page.goto('https://editor.mailsignature.officeatwork.com/#/editor');
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'FileName' }).click();
    await page.getByText('FileName', { exact: true }).click();
});
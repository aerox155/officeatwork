import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';
test('test', async ({ page }) => {
    await page.goto('https://editor.mailsignature.officeatwork.com/');
    await signIn(page);

    await page.goto('https://editor.mailsignature.officeatwork.com/#/templates');
    await page.getByRole('button', { name: 'New Template' }).click();

    const parent = page.getByText('Default Signature').locator('..');

    await parent.locator('..')
        .getByRole('button', { name: 'Apply' })
        .click();
    await page.getByRole('button', { name: 'Show code editor' }).click();
    await page.getByRole('button', { name: 'Add Element' }).click();
    await page.getByText('Text Field Single Line').click();
    //await page.getByRole('textbox', { name: 'Name' }).fill('1line');

    const container = page.getByText('Name*').locator('..').locator('..').locator('..');
    await container.getByRole('textbox', { name: 'Name' }).fill('1line');
    await page.getByRole('textbox', { name: 'Label' }).fill('1 line');
    await page.getByRole('textbox', { name: 'Hint' }).fill('1 line');
    await page.getByRole('textbox', { name: 'Description' }).fill('1line');
    await page.getByRole('tab', { name: 'Defaults' }).click();
    await page.getByRole('textbox', { name: 'Value' }).fill('default');
    await page.getByRole('tab', { name: 'General' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Images' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Languages' }).click();
    const addLanguageButton = page.getByRole('button', { name: 'Add' });
    await addLanguageButton.waitFor({ state: 'visible' });
    await addLanguageButton.click();
    await page.locator('#field-_r_vv___control').fill('th-th');
    await page.locator('#checkbox-_r_1pp_').check();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Audience' }).click();
    await page.getByRole('switch', { name: 'Off' }).check();
    await page.getByRole('button', { name: 'Add' }).click();
    await page.locator('#field-_r_1sj___control').click();
    await page.locator('#field-_r_1sj___control').fill('aerox@thangph.onmicrosoft.com');
    await page.getByRole('button', { name: 'Done' }).click();
    await page.locator('#root').getByText('Settings').click();
    await page.locator('#radio-_r_1so_').check();
    await page.getByRole('combobox', { name: 'Search Users and Groups' }).click();
    await page.getByRole('combobox', { name: 'Search Users and Groups' }).click();
    await page.getByRole('combobox', { name: 'Search Users and Groups' }).fill('aerox');
    await page.getByText('aerox@thangph.onmicrosoft.com').click();
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('General Signature Template').click();
    await page.getByText('Permission to a group').click();
    await page.getByText('General Signature Template').click();
    await page.getByRole('textbox', { name: 'File Name' }).click();
    await page.getByRole('textbox', { name: 'File Name' }).click();
    await page.getByRole('textbox', { name: 'File Name' }).fill('FileName');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.goto('https://editor.mailsignature.officeatwork.com/#/editor');
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'FileName' }).click();
    await page.getByText('FileName', { exact: true }).click();
});
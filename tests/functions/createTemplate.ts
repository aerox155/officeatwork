import { Page, expect } from '@playwright/test';
import { HtmlReport } from './htmlReport';

export async function createTemplate(page: Page, templateName: string, report?: HtmlReport) {

    await page.getByRole('button', { name: templateName }).click();
    report?.step(`Selected template "${templateName}"`);

    await page.getByRole('combobox', { name: 'Destination' }).click();
    report?.step('Opened Destination selector');

    await page.getByRole('listitem', { description: 'Sources', exact: true, }).getByRole('button').click();
    report?.step('Opened Sources');

    await page.getByText('SharePoint').click();
    report?.step('Selected SharePoint source');

    await page.getByText('Aerox').click();
    report?.step('Selected "Aerox" site');

    await page.getByText('Save Here').click();
    report?.step('Selected "Save Here" folder');

    await page.getByRole('button', { name: 'Select' }).click();
    report?.step('Confirmed destination');

    // Tạo tên file theo ngày giờ hiện tại
    const now = new Date();
    const fileName =
        `ATD_${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, '0')}-` +
        `${String(now.getDate()).padStart(2, '0')}_` +
        `${String(now.getHours()).padStart(2, '0')}-` +
        `${String(now.getMinutes()).padStart(2, '0')}-` +
        `${String(now.getSeconds()).padStart(2, '0')}`;
    console.log(`File name: ${fileName}`);

    const fileNameInput = page.getByRole('textbox', { name: 'File name', });

    await fileNameInput.fill(fileName);
    report?.step(`Entered file name "${fileName}"`);

    await page.getByRole('button', { name: 'Save', exact: true, }).click();
    report?.step('Saved template');

    await page.getByRole('button', { name: "Don't open", }).click();
    report?.step('Dismissed "open file" prompt');

return fileName;

}
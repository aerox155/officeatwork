import { Page, expect } from '@playwright/test';

export async function createTemplate(page: Page, templateName: string) {

    await page.getByRole('button', { name: templateName }).click();
    await page.getByRole('combobox', { name: 'Destination' }).click();

    await page.getByRole('listitem', { description: 'Sources', exact: true, }).getByRole('button').click();
    await page.getByText('SharePoint').click();
    await page.getByText('Aerox').click();
    await page.getByText('Save Here').click();
    await page.getByRole('button', { name: 'Select' }).click();

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
    await page.getByRole('button', { name: 'Save', exact: true, }).click();
    await page.getByRole('button', { name: "Don't open", }).click();
return fileName;

}
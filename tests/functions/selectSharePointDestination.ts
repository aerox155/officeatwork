import { Locator } from '@playwright/test';
import { HtmlReport } from './htmlReport';

// Clicks through the SharePoint document library picker (SharePoint > Aerox > ATD > Select)
// and fills in the destination file name. `linkedLibraryInput` is the field that opens the
// "Select library location" picker when clicked (often a readonly textbox).
export async function selectSharePointAtdDestination(
    linkedLibraryInput: Locator,
    nameInput: Locator,
    fileName: string,
    report?: HtmlReport
) {
    const page = linkedLibraryInput.page();

    await linkedLibraryInput.click();
    await page.getByLabel('Select library location').getByText('SharePoint', { exact: true }).click();
    await page.getByText('Aerox', { exact: true }).click();
    await page.getByText('ATD', { exact: true }).click();
    await page.getByRole('button', { name: 'Select' }).click();
    report?.step('Selected "Aerox > ATD" SharePoint document library');

    await nameInput.fill(fileName);
    report?.step(`Set file name to "${fileName}"`);
}

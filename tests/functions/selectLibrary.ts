import { Locator, Page, expect } from '@playwright/test';
import { HtmlReport } from './htmlReport';

export async function selectLibraryDrawerButton(page: Page, libraryName: string, report?: HtmlReport) {
  const selectLibraryButton = page.getByRole('button', {
    name: 'Select Library',
  });

  await expect(selectLibraryButton).toBeVisible({ timeout: 30000 });
  await expect(selectLibraryButton).toBeEnabled({ timeout: 30000 });
  await selectLibraryButton.click();
  report?.step('Opened Select Library menu');

  await page.locator('button').filter({ hasText: libraryName }).click();
  report?.step(`Selected library "${libraryName}"`);
}

// Clicks through the SharePoint document library picker (SharePoint > Aerox > ATD > Select)
// and fills in the destination file name. `linkedLibraryInput` is the field that opens the
// "Select library location" picker when clicked (often a readonly textbox). Used by the
// "Add SharePoint Library" dialogs in Admin Center, which are a different, deeper picker
// than the flat "Select Library" menu above.
export async function selectSharePointAtdDestination(libraryName: string,
  linkedLibraryInput: Locator,
  nameInput: Locator,
  fileName: string,
  report?: HtmlReport
) {
  const page = linkedLibraryInput.page();

  await linkedLibraryInput.click();
  await page.getByLabel('Select library location').getByText('SharePoint', { exact: true }).click();
  await page.getByText('Aerox', { exact: true }).click();
  await page.getByText(libraryName, { exact: true }).click();
  await page.getByRole('button', { name: 'Select' }).click();
  report?.step('Selected "Aerox > ' + libraryName + '" SharePoint document library');

  await nameInput.fill(fileName);
  report?.step(`Set file name to "${fileName}"`);
}
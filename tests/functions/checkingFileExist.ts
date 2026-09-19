import { Page, expect } from '@playwright/test';
import { HtmlReport } from './htmlReport';

export async function checkingFileExist(page: Page, fileName: string, report?: HtmlReport) {

  await page.getByRole('search', { name: 'Search in Save Here' }).click();
  await page.getByRole('search', { name: 'Search in Save Here' }).fill(fileName);
  report?.step(`Searched for file "${fileName}"`);

  await page.getByRole('button', { name: 'Document '+fileName }).click();
  report?.step(`Opened file "${fileName}"`);

  await page.getByText(fileName).click();
  report?.step(`Verified file "${fileName}" exists`);

  console.log('Passed');
}
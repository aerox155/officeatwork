import { Page, expect } from '@playwright/test';

export async function checkingFileExist(page: Page, fileName: string) {

  await page.getByRole('search', { name: 'Search in Save Here' }).click();
  await page.getByRole('search', { name: 'Search in Save Here' }).fill(fileName);
  await page.getByRole('button', { name: 'Document '+fileName }).click();
  await page.getByText(fileName).click();

  
  await page.screenshot({
    path: `./screenshots/checkingFileExist_${fileName}.png`,
    fullPage: true,
  });
  console.log('Passed');
}
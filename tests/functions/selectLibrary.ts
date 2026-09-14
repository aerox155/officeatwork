import { Page, expect } from '@playwright/test';
import { HtmlReport } from './htmlReport';

export async function selectLibrary(page: Page, libraryName: string, report?: HtmlReport) {
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
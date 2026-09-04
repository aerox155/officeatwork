import { Page, expect } from '@playwright/test';

export async function selectLibrary(page: Page, libraryName: string) {
  const selectLibraryButton = page.getByRole('button', {
    name: 'Select Library',
  });

  await expect(selectLibraryButton).toBeVisible({ timeout: 30000 });
  await expect(selectLibraryButton).toBeEnabled({ timeout: 30000 });
  await selectLibraryButton.click();
  await page.locator('button').filter({ hasText: libraryName }).click();

}
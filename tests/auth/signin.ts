import { Page } from '@playwright/test';
export async function signIn(page: Page) {

  const signInButton = page.getByRole('button', { name: 'Sign In' });
  const connectButton = page.getByRole('button', { name: 'Connect' });

  await Promise.race([
    signInButton.waitFor({ state: 'visible' }),
    connectButton.waitFor({ state: 'visible' }),
  ]);

  if (await signInButton.isVisible()) {
    await signInButton.click();
  } else if (await connectButton.isVisible()) {
    await connectButton.click();
  }

 await page.locator('input[type="email"]').fill('aerox@thangph.onmicrosoft.com');
  await page.getByRole('button', { name: 'Next' }).click();

  await page.locator('input[type="password"]').fill('akUmPFIp4T');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await  page.getByRole('button', { name: 'Yes' }).click();;
 
}
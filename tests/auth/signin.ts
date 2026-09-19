import { Page } from '@playwright/test';

export async function microsoftLogin(page: Page, email: string, password: string) {
  await page.locator('input[type="email"]').fill(email);
  await page.getByRole('button', { name: 'Next' }).click();

  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.getByRole('button', { name: 'Yes' }).click();
}

export async function signIn(page: Page) {

  const signInButton = page.getByRole('button', { name: 'Sign In' });
  const connectButton = page.getByRole('button', { name: 'Connect' });

  const alreadySignedIn = await Promise.race([
    signInButton.waitFor({ state: 'visible' }).then(() => false),
    connectButton.waitFor({ state: 'visible' }).then(() => false),
    page.waitForTimeout(3000).then(() => true),
  ]);

  if (alreadySignedIn) {
    return;
  }

  if (await signInButton.isVisible()) {
    await signInButton.click();
  } else if (await connectButton.isVisible()) {
    await connectButton.click();
  }

  await microsoftLogin(page, 'aerox@thangph.onmicrosoft.com', 'akUmPFIp4T');
}

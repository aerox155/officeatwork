import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';
import { selectLibrary } from './functions/selectLibrary';
import { createTemplate } from './functions/createTemplate';
import { checkingFileExist } from './functions/checkingFileExist';

test('Create ATD Word document', async ({ page }) => {


await page.goto(
  'https://templatechooser.officeatwork.com/'
);
await signIn(page);
await selectLibrary(page, 'ATD');
const fileName = await createTemplate(page,'Document Automated');

await selectLibrary(page,'Save Here');
await checkingFileExist(page,fileName);
});

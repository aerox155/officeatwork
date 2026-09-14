import { test, expect } from '@playwright/test';
import { signIn } from './auth/signin';
import { selectLibrary } from './functions/selectLibrary';
import { createTemplate } from './functions/createTemplate';
import { checkingFileExist } from './functions/checkingFileExist';
import { HtmlReport } from './functions/htmlReport';

test('Create ATD Word document', async ({ page }) => {
  const report = new HtmlReport('Create ATD Word document');

  await page.goto(
    'https://templatechooser.officeatwork.com/'
  );
  await signIn(page);
  report.step('Login successfully');

  await selectLibrary(page, 'ATD', report);
  const fileName = await createTemplate(page, 'Document Automated', report);

  await selectLibrary(page, 'Save Here', report);
  await checkingFileExist(page, fileName, report);

  await report.finish(page);
});

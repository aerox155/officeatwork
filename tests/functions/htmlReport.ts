import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export class HtmlReport {
    private steps: { message: string; time: string }[] = [];
    private testName: string;

    constructor(testName: string) {
        this.testName = testName;
    }

    step(message: string) {
        this.steps.push({ message, time: new Date().toLocaleString() });
        console.log(`${this.steps.length}. ${message}`);
    }

    async finish(page: Page, reportDir: string = './reports') {
        const screenshot = await page.screenshot({ fullPage: true });
        const base64Image = screenshot.toString('base64');

        fs.mkdirSync(reportDir, { recursive: true });

        const safeName = this.testName.replace(/[^a-z0-9]+/gi, '_');
        const filePath = path.join(reportDir, `${safeName}_${Date.now()}.html`);

        const stepsHtml = this.steps
            .map((s, i) => `<li><strong>${i + 1}. ${s.message}</strong> <span class="time">${s.time}</span></li>`)
            .join('\n            ');

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.testName} - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
        h1 { margin-bottom: 4px; }
        .generated { color: #666; font-size: 13px; margin-bottom: 24px; }
        ol { font-size: 16px; line-height: 1.9; padding-left: 20px; }
        .time { color: #888; font-size: 12px; margin-left: 8px; }
        h2 { margin-top: 32px; }
        img { max-width: 100%; border: 1px solid #ccc; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>${this.testName}</h1>
    <div class="generated">Generated: ${new Date().toLocaleString()}</div>
    <ol>
            ${stepsHtml}
    </ol>
    <h2>Final Screenshot</h2>
    <img src="data:image/png;base64,${base64Image}" alt="Final screenshot" />
</body>
</html>`;

        fs.writeFileSync(filePath, html);
        console.log(`Report saved to ${filePath}`);
        return filePath;
    }
}

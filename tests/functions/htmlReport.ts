import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type Step = { message: string; time: string; image?: string };
type Section = { title: string; steps: Step[] };

export class HtmlReport {
    private sections: Section[] = [];
    private meta: { label: string; value: string }[] = [];
    private testName: string;

    constructor(testName: string) {
        this.testName = testName;
    }

    // Starts a new labeled section in the report - use this to group steps from
    // separate tests when sharing one HtmlReport instance across a describe.serial block.
    section(title: string) {
        this.sections.push({ title, steps: [] });
    }

    private currentSection(): Section {
        if (this.sections.length === 0) {
            this.sections.push({ title: this.testName, steps: [] });
        }
        return this.sections[this.sections.length - 1];
    }

    step(message: string) {
        const section = this.currentSection();
        section.steps.push({ message, time: new Date().toLocaleString() });
        console.log(`${section.steps.length}. ${message}`);
    }

    async stepWithScreenshot(message: string, page: Page) {
        const screenshot = await page.screenshot({ fullPage: true });
        const section = this.currentSection();
        section.steps.push({ message, time: new Date().toLocaleString(), image: screenshot.toString('base64') });
        console.log(`${section.steps.length}. ${message}`);
    }

    setMeta(label: string, value: string) {
        this.meta.push({ label, value });
        console.log(`${label}: ${value}`);
    }

    async finish(page: Page, reportDir: string = './reports', fullPage: boolean = true) {
        const screenshot = await page.screenshot({ fullPage });
        const base64Image = screenshot.toString('base64');

        fs.mkdirSync(reportDir, { recursive: true });

        const safeName = this.testName.replace(/[^a-z0-9]+/gi, '_');
        const filePath = path.join(reportDir, `${safeName}_${Date.now()}.html`);

        const sectionsHtml = this.sections
            .map(section => {
                const stepsHtml = section.steps
                    .map((s, i) => {
                        const stepImage = s.image
                            ? `<br><img src="data:image/png;base64,${s.image}" alt="${s.message}" />`
                            : '';
                        return `<li><strong>${i + 1}. ${s.message}</strong> <span class="time">${s.time}</span>${stepImage}</li>`;
                    })
                    .join('\n                ');

                return `<h2>${section.title}</h2>
    <ol>
                ${stepsHtml}
    </ol>`;
            })
            .join('\n    ');

        const metaHtml = this.meta
            .map(m => `<strong>${m.label}:</strong> ${m.value}`)
            .join(' &nbsp;|&nbsp; ');

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.testName} - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
        h1 { margin-bottom: 4px; }
        .meta { color: #444; font-size: 14px; margin-bottom: 8px; }
        .generated { color: #666; font-size: 13px; margin-bottom: 24px; }
        ol { font-size: 16px; line-height: 1.9; padding-left: 20px; }
        .time { color: #888; font-size: 12px; margin-left: 8px; }
        h2 { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px; }
        img { max-width: 100%; border: 1px solid #ccc; border-radius: 4px; }
        li img { margin: 8px 0 16px; }
    </style>
</head>
<body>
    <h1>${this.testName}</h1>
    ${metaHtml ? `<div class="meta">${metaHtml}</div>` : ''}
    <div class="generated">Generated: ${new Date().toLocaleString()}</div>
    ${sectionsHtml}
    <h2>Final Screenshot</h2>
    <img src="data:image/png;base64,${base64Image}" alt="Final screenshot" />
</body>
</html>`;

        fs.writeFileSync(filePath, html);
        console.log(`Report saved to ${filePath}`);
        return filePath;
    }
}

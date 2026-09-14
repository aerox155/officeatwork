import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
    await page.goto('https://login.microsoftonline.com/209ae809-29d4-47d0-91fb-dce715a14a47/oauth2/authorize?client%5Fid=00000003%2D0000%2D0ff1%2Dce00%2D000000000000&response%5Fmode=form%5Fpost&ear%5Fjwe%5Fcrypto=eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImFwdiI6IkFBQUFDVVZoY2tOc2FXVnVkR2dBQUFCRlEwc3pNQUFBQUF5dFM1dW9xbTd1d1YwaEZrKytnMXMvWmxRbXM0UzlmNmQyYkJmUUFxaTk3NFA4MVY4U00yNXJ2WkJRc1JqQ1haVEtXR1dYTENEZThqUDdrQ2pWeWNGZHN4blFIU2V1RVc4MzN1MUtZQ3dETm9wbHdSNWVjQkpLMWFOQjZ2NVg0UUFBQUJpWGI0R1ZTSmR0RWZ3ZWVRdmY5NldyRVR3U3RyVHEzWWc9In0%3D&ear%5Fjwk=eyJhbGciOiJFQ0RILUVTIiwiY3J2IjoiUC0zODQiLCJ4IjoiQUFBQU1BeXRTNXVvcW03dXdWMGhGaysrZzFzL1psUW1zNFM5ZjZkMmJCZlFBcWk5NzRQODFWOFNNMjVydlpCUXNSakNYUT09IiwieSI6IkFBQUFNSlRLV0dXWExDRGU4alA3a0NqVnljRmRzeG5RSFNldUVXODMzdTFLWUN3RE5vcGx3UjVlY0JKSzFhTkI2djVYNFE9PSIsImt0eSI6IkVDIn0%3D&spa%5Fclient%5Fid=08e18876%2D6177%2D487e%2Db8b5%2Dcf950c1e598c&client%5Finfo=1&response%5Ftype=code%20id%5Ftoken%20spa%5Frt&resource=00000003%2D0000%2D0ff1%2Dce00%2D000000000000&scope=openid&nonce=D6AFFD887EC4BE632F7262FA80C91CCB7225D956E6998CFB%2D3D90C9D999D3B9369631BBC5ED9E1589B4A77E5FE971611D343EA4D57A54537F&redirect%5Furi=https%3A%2F%2Fthangph%2Esharepoint%2Ecom%2F%5Fforms%2Fdefault%2Easpx&state=OD0wJjMyPUFBTUMyQUFBQUJRNzI4MlFkU1lLamZBU0pYSiUyRmI4aVo4VzV2aHV3OFhXdzBNTzlNdmlialdXckRHcjRuRU1meDBBc0FycHB4MjB2bTVsNFRTazZIT3M4UjVJMDElMkZLRENaRGNIdU1NNFZKY1lhQUREZGVwV0lEb09Rb1Ezdk5EYXVvbWd5T3BDN3VGQ3hjQzA4NnVBSnYwUzBmMkxkTnpaOXNNSnRNVksyaHJmJTJCd3ZtJTJCYXJ0eUROUEt4VUMzZGlTTEhYNG5wc2klMkZ1MW9OeDJuUUlqY0NOWVV2cWVWMlppTkhzQ1E3dm1LdGVzMyUyRjZWMnZIbDVmQjZVJTJCYXEwS3U5djJPJTJGJTJGcVZQakklMkZid3BaRU9rMnJuWGh6U2xCeEVFM1M5eThyNWV4UENCS0ZMTWFTZXF5Q3YwSU9WRWlydDJ2ckJSbWNNQ3E3cjR5c05HOEtKb01ETVd1MWkxSUxybkNZVHN1ZWNIM0NLaW1MbjFzeWpMbTcyTjhQMjc4ZlRoRzRIbjJFJTNE&claims=%7B%22id%5Ftoken%22%3A%7B%22xms%5Fcc%22%3A%7B%22values%22%3A%5B%22CP1%22%5D%7D%7D%7D&wsucxt=1&cobrandid=11bd8083%2D87e0%2D41b5%2Dbb78%2D0bc43c8a8e8a&client%2Drequest%2Did=ca6939a2%2Db00b%2D7000%2Da639%2Dc5961100a1a5&sso_reload=true');
    await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).click();
    await page.getByRole('textbox', { name: 'Enter your email, phone, or' }).fill('aerox@thangph.onmicrosoft.com');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.locator('#i0118').fill('akUmPFIp5t');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('textbox', { name: 'Enter the password for aerox@' }).click();
    await page.getByRole('textbox', { name: 'Enter the password for aerox@' }).fill('akUmPFIp4T');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.goto('https://thangph.sharepoint.com/sites/Aerox/Lists/5000%20more%20items%20indexed%20with%20folder/AllItems.aspx');
    for (let i = 2; i <= 32; i++) {
        const folderName = `Folder ${String(i).padStart(4, '0')}`;

        await page.getByRole('menuitem', { name: 'New' }).click();
        await page.getByRole('menuitem', { name: 'folder Folder' }).click();

        await page.getByRole('textbox', { name: 'Enter your folder name' }).fill(folderName);
        await page.getByRole('button', { name: 'Create' }).click();
    }
});
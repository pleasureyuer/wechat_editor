import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://editor.ai2026.cloud', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

// Fill editor with some content
const ta = page.locator('textarea').first();
await ta.fill('# 测试内容\n\n复制粘贴测试');
await page.waitForTimeout(300);
await page.locator('button', { hasText: '一键排版' }).first().click();
await page.waitForTimeout(2000);

// Grant clipboard permission
const ctx = browser.contexts()[0];
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);

// Click copy button
const copyBtn = page.locator('button', { hasText: '复制' }).first();
await copyBtn.click();
await page.waitForTimeout(1000);

// Check for success alert
const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 }).catch(() => null);
const dialog = await dialogPromise;
if (dialog) {
  console.log('Dialog message:', dialog.message());
  await dialog.accept();
}

// Try to read clipboard
try {
  const clipText = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  console.log('Clipboard text length:', clipText.length);
  console.log('Clipboard has content:', clipText.length > 50);
} catch(e) {
  console.log('Clipboard read not available:', e.message.substring(0, 100));
}

await page.screenshot({ path: 'tests/e2e/screenshots/copy-test.png', fullPage: false });
console.log('Screenshot saved');
await browser.close();

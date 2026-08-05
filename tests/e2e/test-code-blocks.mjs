import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://editor.ai2026.cloud', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

const ta = page.locator('textarea').first();

// Test code blocks with triple backticks
const md = '## 代码测试\n\n```\nconst a = 1\nconsole.log(a)\n```\n\n这是普通段落';
await ta.fill(md);
await page.waitForTimeout(300);
await page.locator('button', { hasText: '一键排版' }).first().click();
await page.waitForTimeout(2000);

const editorHTML = await page.locator('[contenteditable]').first().innerHTML();
console.log('EDITOR has code text:', editorHTML.includes('const a'));
console.log('EDITOR has infoBox:', editorHTML.includes('infoBox') || editorHTML.includes('style-'));
console.log('EDITOR content snippet:', editorHTML.substring(0, 500));

const mainHtml = await page.evaluate(() => document.querySelector('main').innerHTML);
console.log('PREVIEW has code text:', mainHtml.includes('const a'));
console.log('PREVIEW snippet:', mainHtml.substring(0, 500));

await page.screenshot({ path: 'tests/e2e/screenshots/code-blocks.png', fullPage: false });
console.log('Screenshot saved');
await browser.close();

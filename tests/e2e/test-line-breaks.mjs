import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://editor.ai2026.cloud', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

const ta = page.locator('textarea').first();

// Code block with multiline content (using triple backticks)
const md = '通俗解释：\n\n```\n用户问："上个月销售额是多少？"\n① 检索：去数据库找相关数据\n② 增强：把数据喂给大模型\n③ 生成：大模型回答\n```';

await ta.fill(md);
await page.waitForTimeout(300);
await page.locator('button', { hasText: '一键排版' }).first().click();
await page.waitForTimeout(2000);

const editor = page.locator('[contenteditable]').first();
const editorHTML = await editor.innerHTML();
const brCount = (editorHTML.match(/<br>/g) || []).length;
console.log('Editor <br> count:', brCount);
console.log('Has infoBox:', editorHTML.includes('infoBox') || editorHTML.includes('info-box'));
console.log('Contains 检索:', editorHTML.includes('检索'));
console.log('Contains ①:', editorHTML.includes('①'));

const mainHtml = await page.evaluate(() => document.querySelector('main').innerHTML);
const pBrCount = (mainHtml.match(/<br>/g) || []).length;
console.log('Preview <br> count:', pBrCount);

await page.screenshot({ path: 'tests/e2e/screenshots/line-breaks.png', fullPage: false });
console.log('Screenshot saved');
await browser.close();

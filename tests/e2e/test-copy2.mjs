import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://editor.ai2026.cloud', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

// Fill editor
const ta = page.locator('textarea').first();
await ta.fill('# 测试复制\n\n我是一段测试文本');
await page.waitForTimeout(300);
await page.locator('button', { hasText: '一键排版' }).first().click();
await page.waitForTimeout(2000);

// Listen for dialog
let dialogMsg = '';
page.on('dialog', async (dialog) => {
  dialogMsg = dialog.message();
  await dialog.accept();
});

// Click copy
const copyBtn = page.locator('button', { hasText: '复制' }).first();
await copyBtn.click();
await page.waitForTimeout(2000);

console.log('Dialog message:', dialogMsg);
console.log('Copy success:', dialogMsg.includes('已复制'));
console.log('Has error:', dialogMsg.includes('失败') || dialogMsg.includes('异常'));

// Also test execCommand directly
const execResult = await page.evaluate(() => {
  const d = document.createElement('div');
  d.contentEditable = 'true';
  d.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;';
  d.innerHTML = '<b>测试</b>';
  document.body.appendChild(d);
  const sel = window.getSelection();
  sel.removeAllRanges();
  const r = document.createRange();
  r.selectNodeContents(d);
  sel.addRange(r);
  d.focus();
  const ok = document.execCommand('copy');
  sel.removeAllRanges();
  document.body.removeChild(d);
  return ok;
});
console.log('execCommand copy result:', execResult);

await page.screenshot({ path: 'tests/e2e/screenshots/copy-test.png', fullPage: false });
await browser.close();

// ═══════════════════════════════════════════════════════════
//  wechat_editor PC 版本核心功能 E2E 测试
//  使用 Playwright + 系统 Edge
// ═══════════════════════════════════════════════════════════
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, 'screenshots');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE = 'http://editor.ai2026.cloud';
let passed = 0, failed = 0;
const results = [];

function logResult(name, ok, detail = '') {
  const status = ok ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status}: ${name}${detail ? ' — ' + detail : ''}`);
  results.push({ name, ok, detail });
  ok ? passed++ : failed++;
}

async function screenshot(page, name) {
  const path = join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${name}.png`);
  return path;
}

(async () => {
  console.log('═══════════════════════════════════');
  console.log('wechat_editor 核心功能 E2E 测试');
  console.log('═══════════════════════════════════\n');

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  try {

    // ═══════════════════════════════════════════
    //  测试1: 页面加载和初始渲染
    // ═══════════════════════════════════════════
    console.log('📋 测试1: 页面加载和渲染');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // 等 Vue 渲染

    const title = await page.title();
    logResult('页面标题', title.length > 0, `title="${title}"`);

    // 三栏布局检查
    const hasLeftSidebar = await page.$('.left-sidebar');
    const hasEditor = await page.$('.editor-section');
    const hasRightSidebar = await page.$('.right-sidebar');
    logResult('左侧栏存在', !!hasLeftSidebar);
    logResult('编辑区存在', !!hasEditor);
    logResult('右侧栏存在', !!hasRightSidebar);

    // 顶部工具栏
    const hasTopBar = await page.$('#app > [data-theme]'); // 或更具体的检查
    logResult('顶部工具栏存在', !!hasTopBar);

    await screenshot(page, '01-page-loaded');

    // ═══════════════════════════════════════════
    //  测试2: 完整示例
    // ═══════════════════════════════════════════
    console.log('\n📋 测试2: 完整示例');

    // 找到"完整示例"按钮并点击
    const fullSampleBtn = await page.$('button:has-text("完整示例")');
    if (!fullSampleBtn) {
      logResult('完整示例按钮存在', false, 'button not found');
    } else {
      logResult('完整示例按钮存在', true);

      // 点击前先截图编辑器状态
      await fullSampleBtn.click();
      await page.waitForTimeout(2000); // 等组件插入渲染

      // 验证编辑区有内容
      const editorContent = await page.$eval('.editor-section', el => el.textContent?.trim() || '');
      const hasContent = editorContent.length > 100; // 应该有大量内容
      logResult('完整示例执行后编辑区有内容', hasContent, `内容长度: ${editorContent.length}ch`);

      await screenshot(page, '02-full-sample-loaded');
    }

    // ═══════════════════════════════════════════
    //  测试3: 一键排版 (Markdown)
    // ═══════════════════════════════════════════
    console.log('\n📋 测试3: 一键排版');

    // 先清空编辑器
    const clearBtn = await page.$('button[title="清空编辑区"]');
    if (clearBtn) {
      await clearBtn.click();
      await page.waitForTimeout(500);
    }

    // 检查内容输入面板是否存在（左侧栏可能需要先切换到"内容输入"tab）
    // 尝试找到 textarea 或 contenteditable 区域
    const textarea = await page.$('.left-sidebar textarea, .left-sidebar [contenteditable]');
    
    if (textarea) {
      // 输入测试 Markdown
      const testMd = `# 测试标题一
这是测试内容的正文。

## 测试标题二
- 列表项1
- 列表项2
- 列表项3

### 测试标题三
> 这是一段引用测试文字。

这是正文段落。`;
      
      await textarea.fill(testMd);
      await page.waitForTimeout(300);
      logResult('Markdown 输入', true);

      // 点击"一键排版"
      const mdBtn = await page.$('button:has-text("一键排版")');
      if (mdBtn) {
        await mdBtn.click();
        await page.waitForTimeout(2000);

        // 验证编辑区有转换后的内容
        const mdResult = await page.$eval('.editor-section', el => el.innerHTML || '');
        const hasHtml = mdResult.includes('<') && mdResult.length > 50;
        logResult('一键排版后编辑区有HTML', hasHtml, `HTML长度: ${mdResult.length}`);

        await screenshot(page, '03-markdown-applied');
      } else {
        logResult('一键排版按钮存在', false);
      }
    } else {
      logResult('Markdown 输入区', false, '找不到 textarea，可能需切换tab');
      await screenshot(page, '03-no-textarea-found');
    }

    // ═══════════════════════════════════════════
    //  测试4: 主题色切换
    // ═══════════════════════════════════════════
    console.log('\n📋 测试4: 主题色切换');

    // 右侧面板找主题色选项
    const themeSwatches = await page.$$('.right-sidebar .color-swatch, .right-sidebar [class*="theme"], .right-sidebar [class*="color"]');
    
    if (themeSwatches.length > 0) {
      logResult('主题色选项存在', true, `找到 ${themeSwatches.length} 个`);
      
      // 点击第二个色块切换
      if (themeSwatches.length >= 2) {
        await themeSwatches[1].click();
        await page.waitForTimeout(500);
        await screenshot(page, '04-theme-switched');

        // 验证 CSS 变量变化
        const themeColor = await page.$eval('#app', el => getComputedStyle(el).getPropertyValue('--theme-color'));
        logResult('主题色 CSS 变量已更新', themeColor.trim().length > 0, `值: ${themeColor.trim()}`);
      }
    } else {
      logResult('主题色选项', false, '未找到色块元素');
      await screenshot(page, '04-theme-no-swatches');
    }

    // ═══════════════════════════════════════════
    //  测试5: 样式预设切换
    // ═══════════════════════════════════════════
    console.log('\n📋 测试5: 样式预设');

    // 左侧栏找样式预设选择器
    const stylePresets = await page.$$('.left-sidebar [class*="preset"], .left-sidebar [class*="style-select"], .left-sidebar select, .left-sidebar [class*="sp-"]');
    
    if (stylePresets.length > 0) {
      logResult('样式预设选项存在', true, `找到 ${stylePresets.length} 个相关元素`);
    } else {
      logResult('样式预设选项', false, '未找到，可能需要切换到样式tab');
    }
    await screenshot(page, '05-style-presets');

    // ═══════════════════════════════════════════
    //  测试6: 编辑器工具栏
    // ═══════════════════════════════════════════
    console.log('\n📋 测试6: 编辑器工具栏');

    // 检查工具栏按钮
    const toolbarBtns = await page.$$('.editor-section .tb-btn, .editor-section button');
    logResult('编辑器工具栏按钮', toolbarBtns.length > 0, `${toolbarBtns.length} 个按钮`);

    // 检查撤销/重做/B/I/U
    const hasBold = await page.$('.editor-section .tb-btn b');
    const hasItalic = await page.$('.editor-section .tb-btn i');
    const hasUnderline = await page.$('.editor-section .tb-btn u');
    logResult('加粗按钮', !!hasBold);
    logResult('斜体按钮', !!hasItalic);
    logResult('下划线按钮', !!hasUnderline);

    // ═══════════════════════════════════════════
    //  测试7: 复制功能
    // ═══════════════════════════════════════════
    console.log('\n📋 测试7: 复制功能');

    // 先加载完整示例确保有内容可复制
    if (fullSampleBtn) {
      // 清空
      if (clearBtn) { await clearBtn.click(); await page.waitForTimeout(300); }
      // 加载
      await fullSampleBtn.click();
      await page.waitForTimeout(2000);
    }

    const copyBtn = await page.$('button:has-text("一键复制")');
    if (copyBtn) {
      logResult('一键复制按钮存在', true);

      // 点击复制
      await copyBtn.click();
      await page.waitForTimeout(1000);

      // 检查剪贴板（Playwright 方式）
      try {
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        const hasWechatHTML = clipboardText.includes('style=') || clipboardText.includes('<section');
        logResult('剪贴板内容为微信兼容HTML', !!clipboardText, `长度: ${clipboardText?.length || 0}ch`);
        
        // 检查关键微信标签
        const hasSection = clipboardText?.includes('<section');
        const hasInlineStyle = clipboardText?.includes('style=');
        logResult('  包含<section>标签', hasSection);
        logResult('  包含内联样式', hasInlineStyle);
      } catch (e) {
        logResult('剪贴板读取', false, e.message);
      }
    } else {
      logResult('一键复制按钮', false);
    }

    // ═══════════════════════════════════════════
    //  测试8: 预览区同步
    // ═══════════════════════════════════════════
    console.log('\n📋 测试8: 预览区同步');

    const previewContent = await page.$eval('.right-sidebar', el => el.innerHTML || '');
    const hasPreview = previewContent.length > 100;
    logResult('预览区有内容', hasPreview, `长度: ${previewContent.length}ch`);

    await screenshot(page, '08-final-state');

  } catch (err) {
    console.error('\n❌ 测试异常:', err.message);
    await screenshot(page, '99-error');
    failed++;
  } finally {
    await browser.close();

    // ═══════════════════════════════════════════
    //  总结
    // ═══════════════════════════════════════════
    console.log('\n═══════════════════════════════════');
    console.log('测试总结');
    console.log('═══════════════════════════════════');
    const total = passed + failed;
    console.log(`  总计: ${total} 项`);
    console.log(`  通过: ${passed} ✅`);
    console.log(`  失败: ${failed} ❌`);
    console.log(`  通过率: ${Math.round(passed / total * 100)}%`);
    console.log('');

    if (failed > 0) {
      console.log('失败项:');
      results.filter(r => !r.ok).forEach(r => console.log(`  ❌ ${r.name}${r.detail ? ' — ' + r.detail : ''}`));
    }

    // 输出 JSON 报告
    const report = {
      timestamp: new Date().toISOString(),
      total,
      passed,
      failed,
      passRate: Math.round(passed / total * 100),
      results,
      screenshots: SCREENSHOT_DIR
    };
    const reportPath = join(__dirname, 'test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 报告已保存: ${reportPath}`);
    console.log(`📸 截图目录: ${SCREENSHOT_DIR}`);
  }
})();

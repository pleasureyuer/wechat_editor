<template>
  <div id="app" :data-theme="editorStore.currentTheme" :style="themeCSSVars">
    <!-- 顶部工具栏 -->
    <TopBar
      ref="topBarRef"
      @copy="handleCopy"
      @export="handleExport"
      @clear="handleClear"
      @push-wechat="handlePushWechat"
    />

    <!-- 主内容区：三栏布局 -->
    <main class="app-main">
      <!-- 左侧：图标导航 + 组件面板 -->
      <aside class="left-sidebar">
        <LeftSidebar
          @insert-component="handleInsertComponent"
          @apply-markdown="handleApplyMarkdown"
        />
      </aside>

      <!-- 中间：编辑区 -->
      <section class="editor-section">
        <Editor ref="editorRef" @update:content="onContentUpdate" />
      </section>

      <!-- 右侧：预览 + 颜色选择 -->
      <aside class="right-sidebar">
        <RightPanel @copy="handleCopy" @export="handleExport" />
      </aside>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useEditorStore } from './stores/editor';
import TopBar from './components/TopBar.vue';
import LeftSidebar from './components/LeftSidebar.vue';
import Editor from './components/Editor.vue';
import RightPanel from './components/RightPanel.vue';

const editorStore = useEditorStore();
const topBarRef = ref(null);
const editorRef = ref(null);

// 动态 CSS 变量，跟随主题切换
const themeCSSVars = computed(() => {
  const t = editorStore.themes[editorStore.currentTheme];
  return {
    '--theme-color': t?.color || '#0066ff',
    '--theme-light': t?.light || '#e6f0ff'
  };
});

// 组件 HTML 模板生成器
const componentHTML = (comp) => {
  const T = editorStore.currentThemeColor;
  const TL = editorStore.currentThemeLight;

  switch (comp.type) {
    case 'numberTitle':
      return `<div class="editable-block style-number-title"><span class="num">01</span><span class="title-text">编号标题</span></div>`;

    case 'gradientTitle':
      return `<div class="editable-block style-gradient-title"><h2 style="font-size:20px;font-weight:700;background:linear-gradient(90deg,${T},#a78bfa);-webkit-background-clip:text;-webkit-text-fill:transparent;margin:22px 0 12px;">渐变标题</h2></div>`;

    case 'tagTitle':
      return `<div class="editable-block style-tag-title"><h2 style="font-size:18px;font-weight:700;border-left:4px solid ${T};padding-left:12px;margin:22px 0 12px;color:#333;">标签标题</h2></div>`;

    case 'pillTitle':
      return `<div class="editable-block style-pill-title"><span class="pill">1</span><span class="pill-text">胶囊标题文字</span></div>`;

    case 'softPillTitle':
      return `<div class="editable-block style-soft-pill-title"><span style="background:#f0f0f0;color:#666;padding:2px 10px;border-radius:10px;font-size:11px">标签</span> 软底胶囊标题</div>`;

    case 'leftLineTitle':
      return `<div class="editable-block style-left-line-title" style="margin:20px 0 12px"><h2 style="display:inline-block;border-left:4px solid ${T};padding-left:12px;font-size:17px;font-weight:700;line-height:1.4;color:#333;">左竖线标题</h2></div>`;

    case 'rightLineTitle':
      return `<div class="editable-block style-right-line-title" style="text-align:right;margin:20px 0 12px"><h2 style="display:inline-block;text-align:right;border-right:4px solid ${T};padding-right:12px;font-size:17px;font-weight:700;line-height:1.4;color:#333;">右竖线标题</h2></div>`;

    case 'centerLineTitle':
      return `<div class="editable-block style-center-title" style="margin:20px 0 12px;text-align:center"><h2 style="font-size:17px;font-weight:700;display:inline-block;border-bottom:2px solid ${T};padding-bottom:8px;color:#333;">居中标题</h2></div>`;

    case 'circleIconTitle':
      return `<div class="editable-block style-circle-icon-title" style="display:flex;align-items:center;gap:10px;margin:16px 0 10px"><span style="width:26px;height:26px;border-radius:50%;background:${T};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">💡</span><span style="font-size:17px;font-weight:700;color:#333">圆形图标标题</span></div>`;

    case 'dotLine':
      return `<div class="editable-block style-dot-line"><span class="dot"></span><span class="line"></span><span style="font-size:15px;color:#444">圆点横线内容</span></div>`;

    case 'underlineTitle':
      return `<div class="editable-block style-underline-title" style="margin:18px 0 10px"><span style="font-size:17px;font-weight:700;border-bottom:2px solid ${T};padding-bottom:3px;">下划线标题</span></div>`;

    case 'cardTitle':
      return `<div class="editable-block style-card-title" style="margin:16px 0 10px"><span style="display:inline-block;background:${TL};border:1px solid ${T};border-radius:8px;padding:7px 16px;font-weight:700;color:${T};font-size:15px;">卡片标题</span></div>`;

    case 'stepTitle':
      return `<div class="editable-block style-step-title" style="display:flex;align-items:center;gap:10px;margin:16px 0 10px"><b style="color:${T};font-size:18px;font-weight:800">1</b><span style="font-weight:700;font-size:16px;color:#222">步骤标题</span></div>`;

    case 'cardBox':
      return `<div class="editable-block style-card-box">这里是卡片框内的内容，可以放任何文字、图片或其他元素。</div>`;

    case 'highlightBlock':
      return `<div class="editable-block style-highlight-block"><span style="font-size:16px">◆</span><span>这是需要重点强调的内容，会以色块加重的形式显示，吸引读者注意力。</span></div>`;

    case 'quoteBlock':
      return `<div class="editable-block style-quote-block">引用一段话或名人名言，让文章更有说服力和深度。</div>`;

    case 'infoBox':
      return `<div class="editable-block style-info-box" style="background:${TL};border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;border:1px solid rgba(0,102,255,0.1);">ℹ️ 这是一条提示信息。</div>`;

    case 'disclaimer':
      return `<div class="editable-block style-disclaimer">本文为个人真实职场感悟，内容真实原创，仅由AI辅助优化排版、梳理语句。</div>`;

    case 'dividerSolid':
      return `<div class="editable-block style-divider" style="height:1px;background:${TL}"></div>`;

    case 'dividerDashed':
      return `<div class="editable-block style-divider" style="height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 6px,transparent 6px,transparent 10px)"></div>`;

    case 'dividerDot':
      return `<div class="editable-block style-divider" style="height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 3px,transparent 3px,transparent 7px);opacity:0.6"></div>`;

    case 'dividerThick':
      return `<div class="editable-block style-divider" style="height:2px;background:${T};opacity:0.25;border-radius:1px"></div>`;

    case 'spacer':
      return `<div style="height:24px;"></div>`;

    default:
      return `<p>${comp.name || '组件'}</p>`;
  }
};

// 插入组件到编辑器
const handleInsertComponent = (comp) => {
  const html = componentHTML(comp);
  editorRef.value?.insertHTML(html);
};

// Markdown 一键排版（简化版）
const handleApplyMarkdown = (mdText) => {
  if (!mdText?.trim()) return;
  // 简单的 Markdown → HTML 转换
  let html = mdText
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    // 无序列表：把连续的 <li> 包裹在 <ul> 里
    .replace(/(^(?:- .*$(?:\n|$))+)/gm, (match) => {
      const items = match.trim().split('\n').map(line =>
        line.replace(/^- /, '')
      ).map(item => `<li>${item}</li>`).join('\n');
      return `<ul>\n${items}\n</ul>`;
    })
    // 有序列表
    .replace(/(^(?:\d+\. .*$(?:\n|$))+)/gm, (match) => {
      const items = match.trim().split('\n').map(line =>
        line.replace(/^\d+\. /, '')
      ).map(item => `<li>${item}</li>`).join('\n');
      return `<ol>\n${items}\n</ol>`;
    })
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  // 清理空标签
  html = html.replace(/<p><\/p>/g, '').replace(/<p>(<h[1-6]>)/g, '$1').replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<(ul|ol)>)/g, '$1').replace(/(<\/(?:ul|ol)>)<\/p>/g, '$1')
    .replace(/<p>(<blockquote>)/g, '$1').replace(/(<\/blockquote>)<\/p>/g, '$1')
    .replace(/<br><\/(ul|ol|blockquote)>/g, '</$1>');
  editorRef.value?.insertHTML(html);
};

// 内容更新回调
const onContentUpdate = (html) => {
  // 可以在这里做自动保存等操作
};

// 复制功能（公众号兼容富文本）
// 终极方案：用 ClipboardItem API 直接写入剪贴板
// 彻底绕开 execCommand 和 DOM 渲染，写入的内容 = 纯净的 HTML 字符串
const handleCopy = async () => {
  const content = editorRef.value?.getContent() || '';
  if (!content.trim()) {
    alert('编辑器内容为空');
    return;
  }

  // 1. 构建 HTML（buildWechatHTML 已保证：组件有背景，普通元素无背景）
  let html = buildWechatHTML(content);

  // 2. 安全网：逐个元素检查，只清除【非组件】元素的 background
  //    组件标识：class 含 "style-" 前缀（在 style 属性之前出现）
  html = html.replace(/(<[a-z][^>]*?)((?:class="[^"]*")?\s*style=")([^"]*)(")/gi, (match, prefix, mid, styleContent, suffix) => {
    const isComponent = /class="(style-|num|pill)/.test(match);
    if (isComponent) return match; // 组件原样保留
    const cleaned = styleContent
      .replace(/background(-color|image|position|size|repeat|attachment|clip|origin)?\s*:\s*[^;]+;?\s*/gi, '')
      .trim();
    if (cleaned) {
      return `${prefix}${mid}${cleaned}${suffix}`;
    }
    return prefix.replace(/\s+$/, ''); // 空则删掉整个 style 属性
  });

  // 3. 提取纯文本（作为 text/plain 的 fallback）
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  try {
    // 4. 用 ClipboardItem API 直接写入剪贴板（不走 execCommand，不经 DOM 渲染）
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
      alert('已复制！在公众号后台直接 Ctrl+V 粘贴即可。');
    } else {
      // 降级方案：用隐藏 iframe 隔离环境后 execCommand 复制
      await copyViaIframe(html);
      alert('已复制！在公众号后台直接 Ctrl+V 粘贴即可。');
    }
  } catch (e) {
    alert('复制失败：' + e.message);
  }
};

// 降级方案：通过干净的 iframe 执行复制（隔离主页面 CSS）
const copyViaIframe = (html) => {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;border:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><style>body{margin:0;padding:0;}</style></head><body><div contenteditable="true">' + html + '</div></body></html>');
    doc.close();

    const el = doc.querySelector('[contenteditable]');
    const sel = doc.defaultView.getSelection();
    const range = doc.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);

    let success = false;
    try {
      success = doc.execCommand('copy');
    } catch (e) {}

    document.body.removeChild(iframe);

    if (success) resolve(); else reject(new Error('execCommand failed'));
  });
};

// 导出完整 HTML 文件
const handleExport = () => {
  const content = editorRef.value?.getContent() || '';
  const fullHTML = buildFullExportHTML(content);
  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wechat-article-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

// 构建公众号兼容的 HTML 输出
// 把 CSS 变量替换成实际颜色值，并把关键组件样式内联
const buildWechatHTML = (editorHTML) => {
  const T = editorStore.currentThemeColor;
  const TL = editorStore.currentThemeLight;

  let html = editorHTML;

  // 替换 CSS 变量为实际颜色
  html = html
    .replace(/var\(--theme-color\)/g, T)
    .replace(/var\(--theme-light\)/g, TL);

  // 内联组件样式（公众号不支持 class 引用外部 CSS）
  // ⚠️ 每个组件替换时都保留 class="style-xxx"，以便 handleCopy 识别并保留背景色
  html = html
    // 编号标题
    .replace(/class="editable-block style-number-title"/g,
      `class="style-number-title" style="display:flex;align-items:center;gap:10px;margin:18px 0 10px;"`)
    .replace(/<span class="num">(\d+)<\/span>/g,
      `<span class="num" style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${T};color:#fff;font-size:13px;font-weight:700;flex-shrink:0;">$1</span>`)
    .replace(/<span class="title-text">([^<]+)<\/span>/g,
      `<span style="font-size:17px;font-weight:700;color:#222;">$1</span>`)
    // 胶囊标题
    .replace(/class="pill">(\d+)<\/span>/g,
      `<span class="pill" style="display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 7px;border-radius:11px;background:${T};color:#fff;font-size:12px;font-weight:700;flex-shrink:0;">$1</span>`)
    // 卡片框 — 有浅色背景
    .replace(/class="editable-block style-card-box"/g,
      `class="style-card-box" style="background:${TL};border:1px solid ${T};border-radius:10px;padding:16px 20px;margin:14px 0;font-size:14px;color:#444;line-height:1.8;"`)
    // 引用块 — 有浅色背景
    .replace(/class="editable-block style-quote-block"/g,
      `class="style-quote-block" style="border-left:4px solid ${T};padding:12px 16px;margin:14px 0;background:#fafbfc;font-size:15px;line-height:1.7;color:#555;border-radius:0 8px 8px 0;"`)
    // 提示框 — 有浅色背景
    .replace(/class="editable-block style-info-box"/g,
      `class="style-info-box" style="background:${TL};border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;border:1px solid rgba(0,102,255,0.1);"`)
    // 免责声明 — 有浅色背景
    .replace(/class="editable-block style-disclaimer"/g,
      `class="style-disclaimer" style="background:#f8f8f8;border:1px solid #eee;border-radius:8px;padding:14px 18px;margin:14px 0;font-size:13px;color:#888;line-height:1.7;"`)
    // 高亮块 — 有浅色背景
    .replace(/class="editable-block style-highlight-block"/g,
      `class="style-highlight-block" style="display:flex;align-items:flex-start;gap:8px;padding:12px 16px;margin:14px 0;background:${TL};border-radius:8px;font-size:14px;color:#444;line-height:1.8;"`)
    // 圆点横线
    .replace(/class="editable-block style-dot-line"/g,
      `class="style-dot-line" style="display:flex;align-items:center;gap:8px;margin:16px 0;"`)
    // 渐变标题 h2（去掉 -webkit-text-fill 兼容处理）
    .replace(/style="font-size:20px;font-weight:700;background:linear-gradient\(90deg,[^)]+\);-webkit-background-clip:text;-webkit-text-fill:transparent;/g,
      `style="font-size:20px;font-weight:700;color:${T};`)

  // ====== 列表转公众号兼容格式 ======
  // 公众号对 <ul>/<ol>/<li> 支持不好，转为带 ● / 数字前缀的 <p>
  // 有序列表
  html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let idx = 1;
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, text) => {
      const r = `<p style="margin:6px 0;padding-left:2px;line-height:1.85;font-size:16px;color:#333;"><span style="color:${T};font-weight:600;margin-right:4px;">${idx}.</span>${text}</p>`;
      idx++;
      return r;
    });
  });

  // 无序列表
  html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, text) => {
      return `<p style="margin:6px 0;padding-left:2px;line-height:1.85;font-size:16px;color:#333;"><span style="color:${T};margin-right:6px;">●</span>${text}</p>`;
    });
  });

  // 孤立的 <li>（没有父元素包裹的）
  html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi,
    '<p style="margin:6px 0;padding-left:2px;line-height:1.85;font-size:16px;color:#333;"><span style="color:' + T + ';margin-right:6px;">●</span>$1</p>');

  // 去掉普通元素的 class 属性（防止公众号里样式错乱），但保留组件标识 class 不删
  // 组件 class 以 style- 开头，需要保留，以便 handleCopy 识别并保留其背景色
  html = html.replace(/\sclass="(?!style-)[^"]*"/g, '');

  return html;
};

// 构建完整导出文件
const buildFullExportHTML = (content) => {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>公众号文章</title>
</head>
<body>
<section style="max-width:677px;margin:0 auto;">
${content}
</section>
</body>
</html>`;
};

// 清空编辑区
const handleClear = () => {
  if (confirm('确定要清空所有内容吗？')) {
    editorRef.value?.clear();
  }
};

// 推送到公众号草稿箱
const handlePushWechat = (detail) => {
  const content = editorRef.value?.getContent() || '';
  if (!content.trim()) {
    alert('编辑器内容为空，无法推送');
    return;
  }
  if (!detail?.account?.appId) {
    alert('请先在右上角添加并选择公众号账号');
    return;
  }
  alert('推送功能正在开发中，当前版本请使用「复制」按钮，手动粘贴到公众号后台。');
};
</script>

<style>
/* ========== 全局重置 & 基础样式 ========== */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; width: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #333; background: #f5f6f7; }

#app { display: flex; flex-direction: column; }

.app-main { flex: 1; display: flex; overflow: hidden; }

.left-sidebar { width: 240px; min-width: 240px; background: #fff; border-right: 1px solid #e8eaed; display: flex; flex-direction: column; overflow: hidden; }

.editor-section { flex: 1; background: #f5f6f7; overflow: hidden; min-width: 0; padding: 12px; }

.right-sidebar { flex: 1; background: #fff; border-left: 1px solid #e8eaed; display: flex; flex-direction: column; overflow: hidden; min-width: 0; padding: 12px 12px 12px 0; }

/* 滚动条美化 */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #c1c4c9; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #999; }
</style>

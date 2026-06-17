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
          @load-full-sample="handleLoadFullSample"
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
      return `<div class="editable-block style-number-title" data-style="numberTitle"><span class="num">01</span><span class="title-text">编号标题</span></div>`;

    case 'gradientTitle':
      return `<div class="editable-block style-gradient-title" data-style="gradientTitle"><h2 style="font-size:20px;font-weight:700;background:linear-gradient(90deg,${T},#a78bfa);-webkit-background-clip:text;-webkit-text-fill:transparent;margin:22px 0 12px;">渐变标题</h2></div>`;

    case 'tagTitle':
      return `<div class="editable-block style-tag-title" data-style="tagTitle"><h2 style="font-size:18px;font-weight:700;border-left:4px solid ${T};padding-left:12px;margin:22px 0 12px;color:#333;">标签标题</h2></div>`;

    case 'pillTitle':
      return `<div class="editable-block style-pill-title" data-style="pillTitle"><span class="pill">1</span><span class="pill-text">胶囊标题文字</span></div>`;

    case 'softPillTitle':
      return `<div class="editable-block style-soft-pill-title" data-style="softPillTitle"><span style="background:#f0f0f0;color:#666;padding:2px 10px;border-radius:10px;font-size:11px">标签</span> 软底胶囊标题</div>`;

    case 'leftLineTitle':
      return `<div class="editable-block style-left-line-title" data-style="leftLineTitle" style="margin:20px 0 12px"><h2 style="display:inline-block;border-left:4px solid ${T};padding-left:12px;font-size:17px;font-weight:700;line-height:1.4;color:#333;">左竖线标题</h2></div>`;

    case 'rightLineTitle':
      return `<div class="editable-block style-right-line-title" data-style="rightLineTitle" style="text-align:right;margin:20px 0 12px"><h2 style="display:inline-block;text-align:right;border-right:4px solid ${T};padding-right:12px;font-size:17px;font-weight:700;line-height:1.4;color:#333;">右竖线标题</h2></div>`;

    case 'centerLineTitle':
      return `<div class="editable-block style-center-title" data-style="centerLineTitle" style="margin:20px 0 12px;text-align:center"><h2 style="font-size:17px;font-weight:700;display:inline-block;border-bottom:2px solid ${T};padding-bottom:8px;color:#333;">居中标题</h2></div>`;

    case 'circleIconTitle':
      return `<div class="editable-block style-circle-icon-title" data-style="circleIconTitle" style="display:flex;align-items:center;gap:10px;margin:16px 0 10px"><span style="width:26px;height:26px;border-radius:50%;background:${T};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">💡</span><span style="font-size:17px;font-weight:700;color:#333">圆形图标标题</span></div>`;

    case 'dotLine':
      return `<div class="editable-block style-dot-line" data-style="dotLine"><span class="dot"></span><span class="line"></span><span style="font-size:15px;color:#444">圆点横线内容</span></div>`;

    case 'underlineTitle':
      return `<div class="editable-block style-underline-title" data-style="underlineTitle" style="margin:18px 0 10px"><span style="font-size:17px;font-weight:700;border-bottom:2px solid ${T};padding-bottom:3px;">下划线标题</span></div>`;

    case 'cardTitle':
      return `<div class="editable-block style-card-title" data-style="cardTitle" style="margin:16px 0 10px"><span style="display:inline-block;background:${TL};border:1px solid ${T};border-radius:8px;padding:7px 16px;font-weight:700;color:${T};font-size:15px;">卡片标题</span></div>`;

    case 'stepTitle':
      return `<div class="editable-block style-step-title" data-style="stepTitle" style="display:flex;align-items:center;gap:10px;margin:16px 0 10px"><b style="color:${T};font-size:18px;font-weight:800">1</b><span style="font-weight:700;font-size:16px;color:#222">步骤标题</span></div>`;

    case 'cardBox':
      return `<div class="editable-block style-card-box" data-style="cardBox">这里是卡片框内的内容，可以放任何文字、图片或其他元素。</div>`;

    case 'highlightBlock':
      return `<div class="editable-block style-highlight-block" data-style="highlightBlock"><span style="font-size:16px">◆</span><span>这是需要重点强调的内容，会以色块加重的形式显示，吸引读者注意力。</span></div>`;

    case 'quoteBlock':
      return `<div class="editable-block style-quote-block" data-style="quoteBlock">引用一段话或名人名言，让文章更有说服力和深度。</div>`;

    case 'infoBox':
      return `<div class="editable-block style-info-box" data-style="infoBox" style="background:${TL};border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;border:1px solid ${TL};">ℹ️ 这是一条提示信息。</div>`;

    case 'disclaimer':
      return `<div class="editable-block style-disclaimer" data-style="disclaimer">本文为个人真实职场感悟，内容真实原创，仅由AI辅助优化排版、梳理语句。</div>`;

    case 'dividerSolid':
      return `<div class="editable-block style-divider" data-style="dividerSolid" style="height:1px;background:${TL}"></div>`;

    case 'dividerDashed':
      return `<div class="editable-block style-divider" data-style="dividerDashed" style="height:0px;border-top:1px dashed ${T};margin:20px 0;"></div>`;

    case 'dividerDot':
      return `<div class="editable-block style-divider" data-style="dividerDot" style="height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 3px,transparent 3px,transparent 7px);opacity:0.6"></div>`;

    case 'dividerThick':
      return `<div class="editable-block style-divider" data-style="dividerThick" style="height:2px;background:${T};opacity:0.25;border-radius:1px"></div>`;

    case 'spacer':
      return `<div data-style="spacer" style="height:24px;"></div>`;

    default:
      return `<p>${comp.name || '组件'}</p>`;
  }
};

// 插入组件到编辑器
const handleInsertComponent = (comp) => {
  const html = componentHTML(comp);
  editorRef.value?.insertHTML(html);
};

// 加载完整示例：清空编辑器后一次性插入所有组件 HTML
const handleLoadFullSample = () => {
  const allComponents = [
    { type: 'gradientTitle' },
    { type: 'numberTitle' },
    { type: 'pillTitle' },
    { type: 'tagTitle' },
    { type: 'leftLineTitle' },
    { type: 'rightLineTitle' },
    { type: 'centerLineTitle' },
    { type: 'circleIconTitle' },
    { type: 'dotLine' },
    { type: 'underlineTitle' },
    { type: 'cardTitle' },
    { type: 'stepTitle' },
    { type: 'softPillTitle' },
    { type: 'dividerSolid' },
    { type: 'dividerDashed' },
    { type: 'dividerDot' },
    { type: 'dividerThick' },
    { type: 'highlightBlock' },
    { type: 'quoteBlock' },
    { type: 'infoBox' },
    { type: 'cardBox' },
    { type: 'disclaimer' },
    { type: 'spacer' },
  ];

  const allHTML = allComponents.map(c => componentHTML(c)).join('\n');

  // 用 setContent 直接写 DOM（内部会触发 onInput → 自动同步到 store → 预览区自动更新）
  if (editorRef.value) {
    editorRef.value.setContent(allHTML);
  }
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
const handleCopy = async () => {
  const content = editorRef.value?.getContent() || '';
  if (!content.trim()) {
    alert('编辑器内容为空');
    return;
  }

  // 调试：打印原始内容

  const innerContent = editorStore.buildWechatHTML(content);
  
  const app = editorStore.appearance;
  const fs = app.fontSize;
  const lh = (1.8 * app.lineSpacing).toFixed(1);

  const html = `<div style="background-color:${app.outerBgColor};padding:${app.outerPadding}px;border-radius:${app.outerRadius}px;"><div style="background-color:${app.contentBgColor};border-radius:${app.contentRadius}px;padding:${app.contentPadding * (fs/16)}px ${Math.max(16, app.contentPadding * 1.5) * (fs/16)}px;font-size:${fs}px;line-height:${lh};color:#262626;">${innerContent}</div></div>`;

  if (!html || html.includes('undefined')) {
    alert('生成内容异常（包含 undefined），请刷新页面后重试。');
    return;
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';

  try {
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
      alert('已复制！在公众号后台直接 Ctrl+V 粘贴即可。');
    } else {
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

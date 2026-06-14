<template>
  <div id="app" :data-theme="editorStore.currentTheme" :style="themeCSSVars">
    <!-- 顶部工具栏 -->
    <TopBar
      ref="topBarRef"
      @copy="handleCopy"
      @export="handleExport"
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
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = '<p>' + html + '</p>';
  editorRef.value?.insertHTML(html);
};

// 内容更新回调
const onContentUpdate = (html) => {
  // 可以在这里做自动保存等操作
};

// 复制功能（生成公众号兼容 HTML）
const handleCopy = () => {
  const content = editorRef.value?.getContent() || '';
  if (!content.trim()) {
    alert('编辑器内容为空');
    return;
  }
  const output = buildWechatHTML(content);
  navigator.clipboard.writeText(output).then(() => {
    alert('已复制！可直接粘贴到公众号后台。');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = output;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('已复制！');
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
const buildWechatHTML = (editorHTML) => {
  // 简化处理：直接返回编辑器内容（后期完善为公众号专用格式）
  return editorHTML;
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
</script>

<style>
/* ========== 全局重置 & 基础样式 ========== */
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; width: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #333; background: #f5f6f7; }

#app { display: flex; flex-direction: column; }

.app-main { flex: 1; display: flex; overflow: hidden; }

.left-sidebar { width: 280px; min-width: 280px; background: #fff; border-right: 1px solid #e8eaed; display: flex; flex-direction: column; overflow: hidden; }

.editor-section { flex: 1; background: #f5f6f7; overflow-y: auto; position: relative; }

.right-sidebar { width: 280px; min-width: 280px; background: #fff; border-left: 1px solid #e8eaed; display: flex; flex-direction: column; overflow: hidden; }

/* 滚动条美化 */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #c1c4c9; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #999; }
</style>

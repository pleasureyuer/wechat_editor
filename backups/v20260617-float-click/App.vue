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
        <Editor ref="editorRef" @update:content="onContentUpdate" @insert-component="onFloatInsertComponent" />
      </section>

      <!-- 右侧：预览 + 颜色选择 -->
      <aside class="right-sidebar">
        <RightPanel @copy="handleCopy" @export="handleExport" />
      </aside>
    </main>

    <!-- 推送确认弹窗（封面图选择） -->
    <div v-if="showSyncDialog" class="sync-modal-overlay" @click.self="showSyncDialog = false">
      <div class="sync-modal">
        <h3 class="sync-modal-title">📤 同步到公众号草稿箱</h3>

        <div class="sync-modal-field">
          <label>文章标题</label>
          <div class="sync-title-text">{{ syncTitle }}</div>
        </div>

        <div class="sync-modal-field">
          <label>封面图 <span class="sync-hint">（900×383，自动生成或手动上传）</span></label>
          <div class="sync-cover-preview">
            <img v-if="coverDataUrl" :src="coverDataUrl" class="sync-cover-img" />
            <div v-else class="sync-cover-empty">点击下方按钮选择或生成封面图</div>
          </div>
          <div class="sync-cover-actions">
            <label class="sync-btn-upload">
              📁 上传图片
              <input type="file" accept="image/*" @change="handleCoverFileSelect" hidden />
            </label>
            <button class="sync-btn-gen" @click="coverDataUrl = ''; generateDefaultCover(syncTitle).then(v => coverDataUrl = v)">
              🎨 自动生成
            </button>
          </div>
        </div>

        <div class="sync-modal-actions">
          <button class="sync-btn-cancel" @click="showSyncDialog = false">取消</button>
          <button class="sync-btn-confirm" @click="doSyncToWechat" :disabled="pushLoading">
            {{ pushLoading ? '⏳ 推送中...' : '✅ 确认同步到草稿箱' }}
          </button>
        </div>
      </div>
    </div>
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

// 组件 HTML 模板生成器（代理到 store，编辑区和预览区共用）
const componentHTML = (comp, text) => {
  return editorStore.componentHTML(comp, text);
};

// 插入组件到编辑器
const handleInsertComponent = (comp) => {
  const html = componentHTML(comp);
  editorRef.value?.insertHTML(html);
};

// 浮动工具栏插入组件
const onFloatInsertComponent = (comp) => {
  handleInsertComponent(comp);
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

// Markdown 一键排版（根据主题 styleMap 生成组件 HTML）
const handleApplyMarkdown = (mdText) => {
  if (!mdText?.trim()) return;

  const lines = mdText.split('\n');
  const output = [];
  let inList = false;
  let listItems = [];
  let listType = ''; // 'ul' or 'ol'

  const flushList = () => {
    if (listItems.length > 0) {
      const tag = listType === 'ol' ? 'ol' : 'ul';
      output.push(`<${tag}>${listItems.map(i => `<li>${i}</li>`).join('')}</${tag}>`);
      listItems = [];
      inList = false;
      listType = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // 空行：结束列表
    if (!line) { flushList(); continue; }

    // 标题：# ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length; // 1, 2, 3
      const text = headingMatch[2];
      const styleType = {
        1: editorStore.appearance.h1Style,
        2: editorStore.appearance.h2Style,
        3: editorStore.appearance.h3Style,
      }[level] || 'leftLineTitle';
      output.push(componentHTML({ type: styleType }, text));
      continue;
    }

    // 引用：> ...
    if (line.startsWith('>')) {
      flushList();
      const quoteText = line.replace(/^>\s?/, '');
      const qs = editorStore.appearance.quoteStyle || 'quoteBlock';
      output.push(componentHTML({ type: qs }, quoteText));
      continue;
    }

    // 分割线：---
    if (/^[-*_]{3,}$/.test(line)) {
      flushList();
      const ds = editorStore.appearance.dividerStyle || 'dividerSolid';
      output.push(componentHTML({ type: ds }));
      continue;
    }

    // 无序列表：- item
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') { flushList(); inList = true; listType = 'ul'; }
      listItems.push(ulMatch[1]);
      continue;
    }

    // 有序列表：1. item
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') { flushList(); inList = true; listType = 'ol'; }
      listItems.push(olMatch[1]);
      continue;
    }

    // 普通段落：加粗 / 斜体
    let p = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    flushList();
    output.push(`<p>${p}</p>`);
  }

  flushList();

  const html = output.join('\n');
  // 清理空标签
  const cleaned = html
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[uo]l>)/g, '$1')
    .replace(/(<\/[uo]l>)<\/p>/g, '$1');
  editorRef.value?.insertHTML(cleaned);
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
const pushLoading = ref(false);
const showSyncDialog = ref(false);
const syncTitle = ref('');
const syncContent = ref('');
const coverDataUrl = ref('');   // Canvas 生成或用户选择的封面 base64
const coverUploading = ref(false);

// 用 Canvas 生成带文章标题的默认封面图（900×383，微信封面推荐尺寸）
const generateDefaultCover = (title) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width  = 900;
    canvas.height = 383;
    const ctx = canvas.getContext('2d');

    // 取当前主题色
    const TC = editorStore.currentThemeColor || '#0066ff';
    const TL = editorStore.currentThemeLight || '#e6f0ff';

    // 背景：主题色渐变
    const grad = ctx.createLinearGradient(0, 0, 900, 383);
    grad.addColorStop(0, TC);
    grad.addColorStop(1, TL);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 383);

    // 顶部装饰弧线
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 80;
    ctx.beginPath();
    ctx.arc(450, -60, 360, 0, Math.PI * 2);
    ctx.stroke();

    // 底部装饰弧线
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 60;
    ctx.beginPath();
    ctx.arc(200, 500, 320, 0, Math.PI * 2);
    ctx.stroke();

    // 中间分割线
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(180, 198);
    ctx.lineTo(720, 198);
    ctx.stroke();

    // 文章标题（自动换行）
    let displayTitle = title || '公众号文章';
    if (displayTitle.length > 30) displayTitle = displayTitle.substring(0, 30) + '…';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 38px "PingFang SC","Microsoft YaHei",sans-serif';

    const maxChars = 16;
    const lines = [];
    for (let i = 0; i < displayTitle.length; i += maxChars) {
      lines.push(displayTitle.substring(i, i + maxChars));
    }
    if (lines.length > 3) lines.splice(3);

    const lineHeight = 52;
    const totalH = lines.length * lineHeight;
    const startY = 198 - totalH / 2 + lineHeight / 2;
    lines.forEach((line, idx) => {
      ctx.fillText(line, 450, startY + idx * lineHeight);
    });

    // 底部小字
    ctx.font = '18px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('点击阅读全文 →', 450, 320);

    // 右上角装饰圆
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(780, 80, 60, 0, Math.PI * 2);
    ctx.fill();

    resolve(canvas.toDataURL('image/png'));
  });
};

const handlePushWechat = async (detail) => {
  const content = editorRef.value?.getContent() || '';
  if (!content.trim()) {
    alert('编辑器内容为空，无法推送');
    return;
  }

  // 提取标题
  const tmp = document.createElement('div');
  tmp.innerHTML = content;
  const h = tmp.querySelector('h1, h2, h3');
  const title = h ? h.textContent.trim() : '未命名文章';
  const wechatHtml = editorStore.buildWechatHTML(content);

  syncTitle.value = title;
  syncContent.value = wechatHtml;
  coverDataUrl.value = '';
  coverUploading.value = false;

  // 自动生成默认封面预览
  coverDataUrl.value = await generateDefaultCover(title);
  showSyncDialog.value = true;
};

// 用户选择封面图片
const handleCoverFileSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    coverDataUrl.value = ev.target.result;
  };
  reader.readAsDataURL(file);
};

// 执行同步
const doSyncToWechat = async () => {
  pushLoading.value = true;
  try {
    // 先上传封面图获取 media_id
    let coverBase64 = null;
    if (coverDataUrl.value) {
      coverBase64 = coverDataUrl.value;
    }

    const res = await fetch(`/api/wechat/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: syncTitle.value,
        content: syncContent.value,
        cover_base64: coverBase64,
      }),
    });

    const data = await res.json();
    if (data.success) {
      showSyncDialog.value = false;
      alert(`✅ ${data.message}`);
    } else {
      const hint = data.hint ? `\n\n${data.hint}` : '';
      alert(`❌ ${data.error}${hint}`);
    }
  } catch (e) {
    alert('❌ 推送失败：' + e.message + '\n\n请确认后端服务已启动');
  } finally {
    pushLoading.value = false;
  }
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

/* ====== 同步弹窗 ====== */
.sync-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.sync-modal {
  background: #fff; border-radius: 14px; padding: 32px; width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}
.sync-modal-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0 0 20px; }
.sync-modal-field { margin-bottom: 18px; }
.sync-modal-field label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; }
.sync-hint { font-weight: 400; color: #999; font-size: 12px; }
.sync-title-text { padding: 10px 14px; background: #f7f8fa; border-radius: 8px; font-size: 14px; color: #333; border: 1px solid #e8eaed; }
.sync-cover-preview {
  width: 100%; aspect-ratio: 900/383; background: #f5f6f7; border-radius: 10px; overflow: hidden;
  border: 2px dashed #d9dce1; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;
}
.sync-cover-img { width: 100%; height: 100%; object-fit: cover; }
.sync-cover-empty { color: #bbb; font-size: 14px; }
.sync-cover-actions { display: flex; gap: 8px; }
.sync-btn-upload {
  flex: 1; padding: 8px 12px; border: 1px solid #d9dce1; border-radius: 6px; background: #fff;
  font-size: 13px; color: #444; cursor: pointer; text-align: center; transition: all 0.15s;
}
.sync-btn-upload:hover { border-color: var(--theme-color, #0066ff); color: var(--theme-color, #0066ff); background: #f0f7ff; }
.sync-btn-gen {
  flex: 1; padding: 8px 12px; border: 1px solid #d9dce1; border-radius: 6px; background: #fff;
  font-size: 13px; color: #444; cursor: pointer; transition: all 0.15s;
}
.sync-btn-gen:hover { border-color: #f5a623; color: #f5a623; background: #fef9f0; }
.sync-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 22px; }
.sync-btn-cancel {
  padding: 10px 20px; border: 1px solid #d9dce1; border-radius: 8px; background: #fff;
  font-size: 14px; color: #666; cursor: pointer; transition: all 0.15s;
}
.sync-btn-cancel:hover { background: #f5f5f5; }
.sync-btn-confirm {
  padding: 10px 20px; border: none; border-radius: 8px; background: #2ed573;
  color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.sync-btn-confirm:hover:not(:disabled) { background: #26b862; }
.sync-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

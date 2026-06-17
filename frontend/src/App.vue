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

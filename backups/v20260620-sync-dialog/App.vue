<template>
  <!-- ═══════════ PC 端布局（保持不变） ═══════════ -->
  <template v-if="!isMobile">
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
        <Editor ref="editorRef" @update:content="onContentUpdate" @insert-component="onFloatInsertComponent" @scroll="onEditorScroll" />
      </section>

      <!-- 右侧：预览 + 颜色选择 -->
      <aside class="right-sidebar">
        <RightPanel ref="rightPanelRef" @copy="handleCopy" @export="handleExport" @scroll="onPreviewScroll" />
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

  <!-- ═══════════ 移动端布局 ═══════════ -->
  <template v-else>
  <div id="app-mobile" :data-theme="editorStore.currentTheme" :style="themeCSSVars">
    <!-- 移动端精简 TopBar -->
    <div class="mobile-topbar">
      <span class="mobile-logo">📝 排版工具</span>
      <span class="mobile-version">v20260620-polish</span>
      <div class="mobile-tb-actions">
        <button class="m-btn" title="复制" @click="handleCopy">📋</button>
        <button class="m-btn" title="导出" @click="handleExport">📥</button>
        <button class="m-btn" title="清空" @click="handleClear">🗑</button>
        <button class="m-btn" title="推送" @click="handlePushWechat">📤</button>
      </div>
    </div>

    <!-- 主内容区：单栏切换 -->
    <main class="app-main-mobile">
      <!-- 输入 Tab -->
      <div v-show="mobileTab === 'input'" class="mobile-panel">
        <LeftSidebar
          key="input"
          :force-nav="'input'"
          @insert-component="handleMobileInsert"
          @apply-markdown="handleMobileApplyMarkdown"
          @load-full-sample="handleLoadFullSample"
        />
      </div>

        <!-- 编辑 Tab -->
      <div v-show="mobileTab === 'edit'" class="mobile-panel mobile-edit-panel">
        <Editor ref="editorRef" @update:content="onContentUpdate" @insert-component="onFloatInsertComponent" />
        <!-- 浮动球 -->
        <button class="mobile-float-ball" :class="{ open: mobileFloatOpen }" @click="mobileFloatOpen = !mobileFloatOpen" title="快捷操作">
          <span class="mfb-icon">{{ mobileFloatOpen ? '✕' : '＋' }}</span>
        </button>
        <!-- 深色侧滑抽屉 - 组件分类 -->
        <Transition name="float-panel-slide">
          <div v-if="mobileFloatOpen" class="mobile-drawer">
            <div class="md-section">
              <div class="md-label">标题</div>
              <div class="md-list">
                <div class="md-item" @click="mobileFloatInsert('numberTitle')"><span class="md-icon">🔢</span><span>编号</span></div>
                <div class="md-item" @click="mobileFloatInsert('tagTitle')"><span class="md-icon">🏷️</span><span>标签</span></div>
                <div class="md-item" @click="mobileFloatInsert('pillTitle')"><span class="md-icon">💊</span><span>胶囊</span></div>
                <div class="md-item" @click="mobileFloatInsert('leftLineTitle')"><span class="md-icon">▎</span><span>左竖线</span></div>
                <div class="md-item" @click="mobileFloatInsert('centerLineTitle')"><span class="md-icon">⬥</span><span>居中</span></div>
                <div class="md-item" @click="mobileFloatInsert('gradientTitle')"><span class="md-icon">🌈</span><span>渐变</span></div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">卡片</div>
              <div class="md-list">
                <div class="md-item" @click="mobileFloatInsert('cardBox')"><span class="md-icon">📦</span><span>卡片框</span></div>
                <div class="md-item" @click="mobileFloatInsert('quoteBlock')"><span class="md-icon">💬</span><span>引用</span></div>
                <div class="md-item" @click="mobileFloatInsert('highlightBlock')"><span class="md-icon">🎨</span><span>色块</span></div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">列表</div>
              <div class="md-list">
                <div class="md-item" @click="mobileFloatInsert('iconList')"><span class="md-icon">✦</span><span>图标列表</span></div>
                <div class="md-item" @click="mobileFloatInsert('numList')"><span class="md-icon">①</span><span>编号列表</span></div>
                <div class="md-item" @click="mobileFloatInsert('simpleTable')"><span class="md-icon">📊</span><span>表格</span></div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">分割</div>
              <div class="md-list">
                <div class="md-item" @click="mobileFloatInsert('dividerSolid')"><span class="md-icon">―</span><span>实线</span></div>
                <div class="md-item" @click="mobileFloatInsert('dividerDashed')"><span class="md-icon">┄</span><span>虚线</span></div>
                <div class="md-item" @click="mobileFloatInsert('dividerThick')"><span class="md-icon">━</span><span>粗线</span></div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">操作</div>
              <div class="md-list">
                <div class="md-item md-item-warn" @click="editorRef?.clearBlockAtCursor(); mobileFloatOpen = false">
                  <span class="md-icon">↺</span>
                  <span>清除段落样式</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 预览 Tab -->
      <div v-show="mobileTab === 'preview'" class="mobile-panel">
        <RightPanel ref="rightPanelRef" @copy="handleCopy" @export="handleExport" />
      </div>

      <!-- 设置 Tab -->
      <div v-show="mobileTab === 'settings'" class="mobile-panel">
        <LeftSidebar
          key="settings"
          :force-nav="'mytheme'"
          @insert-component="handleMobileInsert"
          @apply-markdown="handleMobileApplyMarkdown"
          @load-full-sample="handleLoadFullSample"
        />
      </div>
    </main>

    <!-- 底部 Tab -->
    <MobileTabBar v-model="mobileTab" />

    <!-- 推送弹窗（复用PC端弹窗逻辑） -->
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
            <button class="sync-btn-gen" @click="coverDataUrl = ''; generateDefaultCover(syncTitle).then(v => coverDataUrl = v)">🎨 自动生成</button>
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
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useEditorStore } from './stores/editor';
import TopBar from './components/TopBar.vue';
import LeftSidebar from './components/LeftSidebar.vue';
import Editor from './components/Editor.vue';
import RightPanel from './components/RightPanel.vue';
import MobileTabBar from './components/MobileTabBar.vue';

const editorStore = useEditorStore();
const topBarRef = ref(null);
const editorRef = ref(null);
const rightPanelRef = ref(null);

// ── 移动端检测 ──
const isMobile = ref(false);
const mobileTab = ref('input');
const mobileFloatOpen = ref(false);

function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// 移动端插入组件后自动切到编辑 Tab
const handleMobileInsert = (comp) => {
  handleInsertComponent(comp);
  mobileTab.value = 'edit';
  mobileFloatOpen.value = false;
};

// 移动端一键排版：先切到编辑 Tab，等 DOM 更新后 Editor 可见时再执行
const handleMobileApplyMarkdown = async (mdText) => {
  if (!mdText?.trim()) return;
  mobileTab.value = 'edit';
  await nextTick(); // 等待 v-show 让 Editor 变为可见
  editorRef.value?.forceSaveBeforeChange();
  handleApplyMarkdown(mdText);
};

// 浮动球内插入组件
const mobileFloatInsert = (type) => {
  handleInsertComponent({ type });
  mobileFloatOpen.value = false;
};

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
  editorRef.value?.forceSaveBeforeChange();
  const compObj = typeof comp === 'string' ? { type: comp } : comp;
  const compType = compObj.type || comp;
  const stepNum = (compType === 'stepTitle' || compType === 'circleStepBadge' || compType === 'numberTitle') ? editorStore.getNextStepNum() : undefined;
  const html = componentHTML(compObj, null, stepNum);
  editorRef.value?.insertHTML(html);
};

// 浮动工具栏插入组件
const onFloatInsertComponent = (comp) => {
  handleInsertComponent(comp);
};

// ── 同步滚动（编辑区 ⟷ 预览区） ──
let isSyncing = false

function onEditorScroll(ratio) {
  if (isSyncing) return
  isSyncing = true
  rightPanelRef.value?.scrollToRatio(ratio)
  requestAnimationFrame(() => { isSyncing = false })
}

function onPreviewScroll(ratio) {
  if (isSyncing) return
  isSyncing = true
  editorRef.value?.scrollToRatio(ratio)
  requestAnimationFrame(() => { isSyncing = false })
}

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
    editorRef.value.forceSaveBeforeChange();
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
  let inTable = false;
  let tableHeader = [];
  let tableRows = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  const flushList = () => {
    if (listItems.length > 0) {
      const tag = listType === 'ol' ? 'ol' : 'ul';
      output.push(`<${tag}>${listItems.map(i => `<li>${i}</li>`).join('')}</${tag}>`);
      listItems = [];
      inList = false;
      listType = '';
    }
  };

  // Markdown 行内格式：加粗 / 斜体
  const fmt = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<span style="font-weight:bold">$1</span>')
    .replace(/\*(.+?)\*/g, '<span style="font-style:italic">$1</span>');

  const buildTableHTML = (headers, rows, type) => {
    const T = editorStore.currentThemeColor.value;
    const TL = editorStore.currentThemeLight.value;
    switch (type) {
      case 'simpleTable': {
        const thead = headers.map(h => `<th style="padding:10px 12px;text-align:left;font-size:14px;font-weight:700;color:#fff;background:${T}">${fmt(h)}</th>`).join('');
        const tbody = rows.map(row =>
          `<tr>${row.map(cell => `<td style="padding:9px 12px;font-size:14px;color:#333;border:1px solid #e5e7eb">${fmt(cell)}</td>`).join('')}</tr>`
        ).join('');
        return `<div class="editable-block style-simple-table" data-style="simpleTable" style="margin:16px 0;overflow:hidden;border-radius:6px"><table style="width:100%;border-collapse:collapse"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      }
      case 'striTable': {
        const thead = headers.map(h => `<th style="padding:10px 12px;text-align:left;font-size:14px;font-weight:700;color:${T};background:${TL};border-bottom:2px solid ${T}">${fmt(h)}</th>`).join('');
        const tbody = rows.map((row, i) => {
          const bg = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
          return `<tr>${row.map(cell => `<td style="padding:9px 12px;font-size:14px;color:#333;background:${bg}">${fmt(cell)}</td>`).join('')}</tr>`;
        }).join('');
        return `<div class="editable-block style-stri-table" data-style="striTable" style="margin:16px 0"><table style="width:100%;border-collapse:collapse"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      }
      case 'borderTable': {
        const thead = headers.map(h => `<th style="padding:10px 12px;text-align:center;font-size:14px;font-weight:700;color:${T};border:1px solid #ddd;background:${TL}">${fmt(h)}</th>`).join('');
        const tbody = rows.map(row =>
          `<tr>${row.map(cell => `<td style="padding:9px 12px;font-size:14px;color:#444;text-align:center;border:1px solid #ddd">${fmt(cell)}</td>`).join('')}</tr>`
        ).join('');
        return `<div class="editable-block style-border-table" data-style="borderTable" style="margin:16px 0"><table style="width:100%;border-collapse:collapse"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      }
      default:
        return buildTableHTML(headers, rows, 'simpleTable');
    }
  };

  const flushTable = () => {
    if (tableHeader.length > 0 && tableRows.length > 0) {
      const tableType = editorStore.appearance.tableStyle || 'simpleTable';
      output.push(buildTableHTML(tableHeader, tableRows, tableType));
    }
    tableHeader = [];
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // 空行：结束列表和表格
    if (!line) { flushList(); flushTable(); continue; }

    // 标题：# ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      flushTable();
      const level = headingMatch[1].length; // 1, 2, 3
      const text = fmt(headingMatch[2]);
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
      flushTable();
      const quoteText = fmt(line.replace(/^>\s?/, ''));
      const qs = editorStore.appearance.quoteStyle || 'quoteBlock';
      output.push(componentHTML({ type: qs }, quoteText));
      continue;
    }

    // 分割线：---
    if (/^[-*_]{3,}$/.test(line)) {
      flushList();
      flushTable();
      const ds = editorStore.appearance.dividerStyle || 'dividerSolid';
      output.push(componentHTML({ type: ds }));
      continue;
    }

    // 无序列表：- item
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushTable();
      if (!inList || listType !== 'ul') { flushList(); inList = true; listType = 'ul'; }
      listItems.push(fmt(ulMatch[1]));
      continue;
    }

    // 有序列表：1. item
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushTable();
      if (!inList || listType !== 'ol') { flushList(); inList = true; listType = 'ol'; }
      listItems.push(fmt(olMatch[1]));
      continue;
    }

    // 代码块：``` 或 '''
    if (/^```/.test(line) || /^'''/.test(line)) {
      flushList();
      flushTable();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLines = [];
      } else {
        // 关闭代码块
        const codeText = codeBlockLines.join('\n');
        const styleType = editorStore.appearance.codeStyle || 'infoBox';
        output.push(componentHTML({ type: styleType }, codeText));
        inCodeBlock = false;
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(raw);
      continue;
    }

    // 表格检测：| col1 | col2 |
    const tableLineMatch = line.match(/^\|(.+)\|$/);
    if (tableLineMatch) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.length >= 2) {
        const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
        const nextCells = nextLine.split('|').filter(c => c.trim());
        const isSep = nextCells.length >= 2 && nextCells.every(c => /^[\s\-:]+$/.test(c));

        if (!inTable && isSep) {
          // 新表格：上一行可能未被识别（flush it），然后开始收集
          flushList();
          tableHeader = cells;
          tableRows = [];
          inTable = true;
          i++; // 跳过分隔行
          continue;
        } else if (inTable) {
          // 表格数据行
          tableRows.push(cells);
          continue;
        }
      }
    }

    // 非表格行 → 如果正在收集表格，先输出
    if (inTable) {
      flushTable();
    }

    // 普通段落：加粗 / 斜体（用 span+内联样式，微信兼容+防 contenteditable 吞掉）
    let p = fmt(line);
    flushList();
    output.push(`<p>${p}</p>`);
  }

  flushList();
  flushTable();
  // 代码块未关闭时强制输出
  if (inCodeBlock && codeBlockLines.length > 0) {
    const codeText = codeBlockLines.join('\n');
    const styleType = editorStore.appearance.codeStyle || 'infoBox';
    output.push(componentHTML({ type: styleType }, codeText));
  }

  const html = output.join('\n');
  // 清理空标签
  const cleaned = html
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[uo]l>)/g, '$1')
    .replace(/(<\/[uo]l>)<\/p>/g, '$1');
  editorRef.value?.forceSaveBeforeChange();
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

  const html = `<div style="background-color:#ffffff;font-size:${fs}px;line-height:${lh};color:#262626;">${innerContent}</div>`;

  if (!html || html.includes('undefined')) {
    alert('生成内容异常（包含 undefined），请刷新页面后重试。');
    return;
  }

  try {
    // HTTPS 环境 → 用 Clipboard API（更干净）
    if (location.protocol === 'https:' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
    } else {
      // HTTP 或浏览器不支持 Clipboard API → 用隐藏 div + execCommand 复制
      await copyViaDiv(html);
    }
    alert('已复制！在公众号后台直接 Ctrl+V 粘贴即可。');
  } catch (e) {
    console.error('Clipboard API failed, trying fallback:', e);
    try {
      await copyViaDiv(html);
      alert('已复制！在公众号后台直接 Ctrl+V 粘贴即可。');
    } catch (e2) {
      alert('复制失败：' + e2.message);
    }
  }
};

// 降级方案：通过隐藏的 contenteditable div 执行复制（兼容 HTTP 环境）
const copyViaDiv = (html) => {
  return new Promise((resolve, reject) => {
    try {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      div.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
      div.innerHTML = html;
      document.body.appendChild(div);

      // 选中 div 内容
      const sel = window.getSelection();
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(div);
      sel.addRange(range);

      // 聚焦 div
      div.focus();

      // 执行复制
      const success = document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(div);

      if (success) resolve(); else reject(new Error('execCommand copy returned false'));
    } catch (e) {
      reject(e);
    }
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
    editorRef.value?.forceSaveBeforeChange();
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

.left-sidebar { flex: 1; min-width: 220px; max-width: 380px; background: #fff; border-right: 1px solid #e8eaed; display: flex; flex-direction: column; overflow: hidden; }

.editor-section { flex: 2; background: #f5f6f7; overflow: hidden; min-width: 0; padding: 12px; }

.right-sidebar { flex: 1; min-width: 280px; max-width: 420px; background: #fff; border-left: 1px solid #e8eaed; display: flex; flex-direction: column; overflow: hidden; padding: 12px 12px 12px 0; }

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

/* ========== 移动端样式 ========== */
#app-mobile {
  display: flex; flex-direction: column;
  height: 100%; width: 100%;
  overflow: hidden;
  background: #f5f6f7;
}

.mobile-topbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  flex-shrink: 0;
  height: 44px;
}
.mobile-logo { font-size: 13px; font-weight: 700; color: #333; }
.mobile-version { font-size: 10px; color: #999; background: #f0f0f0; padding: 1px 4px; border-radius: 3px; }
.mobile-tb-actions { display: flex; gap: 4px; margin-left: auto; }
.m-btn {
  width: 32px; height: 32px; border: none; background: transparent;
  font-size: 16px; cursor: pointer; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
.m-btn:active { background: #eef0f5; }

.app-main-mobile {
  flex: 1; overflow: hidden;
  display: flex; flex-direction: column;
}
.mobile-panel {
  flex: 1; overflow-y: auto;
  background: #fff;
  height: 100%;
}

/* 编辑面板——浮动球和滑入面板 */
.mobile-edit-panel { position: relative; }

.mobile-float-ball {
  position: absolute; bottom: 16px; right: 16px;
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--theme-color, #0066ff); color: #fff;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,102,255,0.3);
  z-index: 200;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.mobile-float-ball:active { transform: scale(0.92); }
.mobile-float-ball.open { background: #555; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
.mfb-icon { font-size: 22px; line-height: 1; }

/* 深色侧滑抽屉 - 右侧四分之一 */
.mobile-drawer {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 25%; min-width: 180px; max-width: 220px;
  background: #2c2c2e;
  overflow-y: auto; z-index: 190;
  color: #e5e5e7;
}
.md-section { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.md-label {
  font-size: 12px; color: #888; margin-bottom: 8px;
  text-transform: uppercase; letter-spacing: 1px;
}
.md-list { display: flex; flex-direction: column; gap: 2px; }
.md-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px;
  cursor: pointer; transition: background 0.12s;
  font-size: 14px; -webkit-tap-highlight-color: transparent;
}
.md-item:active { background: rgba(255,255,255,0.08); }
.md-item-warn { color: #f87171; }
.md-icon {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  font-size: 16px; border-radius: 6px; flex-shrink: 0;
}

/* 移动端隐藏 PC 端浮动工具栏 */
#app-mobile .float-bar { display: none !important; }
</style>

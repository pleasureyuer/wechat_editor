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

  </div>
  </template>

  <!-- ═══════════ 移动端布局 ═══════════ -->
  <template v-else>
  <div id="app-mobile" :data-theme="editorStore.currentTheme" :style="themeCSSVars">
    <!-- 移动端精简 TopBar -->
    <div class="mobile-topbar">
      <button class="mobile-logo" :class="{on: mobileTab === 'input'}" @click="mobileTab = 'input'">📝 排版工具</button>
      <button class="m-view-btn" v-show="mobileTab !== 'edit'" :class="{on: mobileTab === 'edit'}" @click="mobileTab = 'edit'">✏️ 编辑</button>
      <div class="mobile-tb-actions">
        <button class="m-btn" :class="{on:showThemePopup}" title="主题" @click="showThemePopup=!showThemePopup;showMobilePreview=false">🎨</button>
        <button class="m-btn" :class="{on:showMobilePreview}" :title="showMobilePreview?'编辑':'预览'" @click="toggleMobilePreview">{{ showMobilePreview ? '✏️' : '👁' }}</button>
        <button class="m-btn" title="复制" @click="handleCopy">📋</button>
        <button class="m-btn" title="导出" @click="handleExport">📥</button>
        <button class="m-btn" title="推送" @click="handlePushWechat">📤</button>
      </div>
      <!-- 主题色板弹窗 -->
      <Transition name="theme-popup-slide">
        <div v-if="showThemePopup" class="mobile-theme-popup" @click.stop>
          <div class="mtp-header">主题色</div>
          <div class="mtp-swatches">
            <button
              v-for="t in editorStore.themeList"
              :key="t.id"
              class="mtp-swatch"
              :class="{active: t.isActive}"
              :style="{ background: t.color }"
              :title="t.name"
              @click="editorStore.setTheme(t.id)"
            >
              <span v-if="t.isActive" class="mtp-check">✓</span>
            </button>
          </div>
          <div class="mtp-current">{{ editorStore.themes[editorStore.currentTheme]?.name || '默认' }}</div>
        </div>
      </Transition>
    </div>
    <!-- 点击外部关闭主题弹窗 -->
    <div v-if="showThemePopup" class="mtp-overlay" @click="showThemePopup=false"></div>

    <!-- 主内容区：单栏切换 -->
    <main class="app-main-mobile">
      <!-- 输入 Tab（LeftSidebar 全导航：内容输入/组件/主题/推送配置） -->
      <div v-show="mobileTab === 'input'" class="mobile-panel">
        <LeftSidebar
          key="input"
          @insert-component="handleMobileInsert"
          @apply-markdown="handleMobileApplyMarkdown"
          @load-full-sample="handleLoadFullSample"
        />
      </div>

        <!-- 编辑 Tab -->
      <div v-show="mobileTab === 'edit'" class="mobile-panel mobile-edit-panel">
        <Editor v-show="!showMobilePreview" ref="editorRef" @update:content="onContentUpdate" @insert-component="onFloatInsertComponent" @float-change="onFloatChange" @clear="handleClear" />
        <!-- 预览覆盖层 -->
        <div v-if="showMobilePreview" class="mobile-preview-overlay">
          <div class="mpo-bar">
            <span class="mpo-label">预览效果（公众号渲染）</span>
          </div>
          <div class="mpo-content" v-html="editorStore.previewHTML"></div>
        </div>
        <!-- 浮动球（预览时隐藏） -->
        <button v-show="!showMobilePreview" class="mobile-float-ball" :class="{ open: mobileFloatOpen }" @click="mobileFloatOpen = !mobileFloatOpen" title="快捷操作">
          <span class="mfb-icon">{{ mobileFloatOpen ? '✕' : '＋' }}</span>
        </button>
        <!-- 深色侧滑抽屉 - 组件分类 -->
        <Transition name="float-panel-slide">
          <div v-if="mobileFloatOpen" class="mobile-drawer">
            <div class="md-section">
              <div class="md-label">标题</div>
              <div class="md-list">
                <div class="md-item" v-for="c in TITLE_COMPONENTS" :key="c.type" @click="mobileFloatInsert(c.type)">
                  <span class="md-icon">{{ c.icon }}</span><span>{{ c.name }}</span>
                </div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">卡片</div>
              <div class="md-list">
                <div class="md-item" v-for="c in cardComponentsFiltered" :key="c.type" @click="mobileFloatInsert(c.type)">
                  <span class="md-icon">{{ c.icon }}</span><span>{{ c.name }}</span>
                </div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">互动</div>
              <div class="md-list">
                <div class="md-item" v-for="c in interactiveComponents" :key="c.type" @click="mobileFloatInsert(c.type)">
                  <span class="md-icon">{{ c.icon }}</span><span>{{ c.name }}</span>
                </div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">列表</div>
              <div class="md-list">
                <div class="md-item" v-for="c in LIST_COMPONENTS" :key="c.type" @click="mobileFloatInsert(c.type)">
                  <span class="md-icon">{{ c.icon }}</span><span>{{ c.name }}</span>
                </div>
                <div class="md-item" v-for="c in TABLE_COMPONENTS" :key="c.type" @click="mobileFloatInsert(c.type)">
                  <span class="md-icon">{{ c.icon }}</span><span>{{ c.name }}</span>
                </div>
              </div>
            </div>
            <div class="md-section">
              <div class="md-label">分割</div>
              <div class="md-list">
                <div class="md-item" v-for="c in DIVIDER_COMPONENTS" :key="c.type" @click="mobileFloatInsert(c.type)">
                  <span class="md-icon">{{ c.icon }}</span><span>{{ c.name }}</span>
                </div>
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

    </main>

  </div>
  </template>

  <!-- ═══════════ PC/移动端共用：同步到公众号弹窗 ═══════════ -->
  <div v-if="showSyncDialog" class="sync-modal-overlay" @click.self="showSyncDialog = false">
    <div class="sync-modal" :class="{ 'sync-modal-mobile': isMobile }">
      <h3 class="sync-modal-title">📤 同步到公众号草稿箱</h3>

      <!-- 标题 -->
      <div class="sync-modal-field">
        <label>文章标题 <span class="sync-hint">（必填）</span></label>
        <input
          v-model="syncTitle"
          class="sync-input"
          placeholder="请输入文章标题"
          maxlength="64"
          @input="onSyncTitleChange"
        />
        <div class="sync-char-count">{{ syncTitle.length }}/64</div>
      </div>

      <!-- 简介 / 摘要 -->
      <div class="sync-modal-field">
        <label>简介 <span class="sync-hint">（选填，不填则抓取正文前54字）</span></label>
        <textarea
          v-model="syncDigest"
          class="sync-textarea"
          placeholder="文章摘要，将在推送列表中展示"
          maxlength="120"
          rows="2"
        ></textarea>
        <div class="sync-char-count">{{ syncDigest.length }}/120</div>
      </div>

      <!-- 作者 -->
      <div class="sync-modal-field">
        <label>作者 <span class="sync-hint">（选填）</span></label>
        <input
          v-model="syncAuthor"
          class="sync-input sync-input-short"
          placeholder="署名作者"
          maxlength="8"
        />
      </div>

      <!-- 原文链接 -->
      <div class="sync-modal-field">
        <label>原文链接 <span class="sync-hint">（选填，阅读原文跳转）</span></label>
        <input
          v-model="syncSourceUrl"
          class="sync-input"
          placeholder="https://..."
          type="url"
        />
      </div>

      <!-- 留言设置 -->
      <div class="sync-modal-field sync-field-row">
        <label>留言设置</label>
        <label class="sync-toggle">
          <input type="checkbox" v-model="syncOpenComment" />
          <span class="sync-toggle-text">开启留言</span>
        </label>
      </div>

      <!-- 发布设置（原创/广告/创作来源为微信发布时设置，草稿接口不支持，仅作发布前提醒） -->
      <div class="sync-section-note">📌 以下为微信「发布」时设置项，草稿接口不支持预置，已按常用值默认勾选，群发时请在微信后台确认</div>

      <div class="sync-modal-field sync-field-row">
        <label>原创声明</label>
        <label class="sync-toggle">
          <input type="checkbox" v-model="syncOriginal" />
          <span class="sync-toggle-text">声明原创</span>
        </label>
      </div>

      <div class="sync-modal-field sync-field-row">
        <label>文中广告</label>
        <label class="sync-toggle">
          <input type="checkbox" v-model="syncAds" />
          <span class="sync-toggle-text">开启广告（流量主）</span>
        </label>
      </div>

      <div class="sync-modal-field">
        <label>创作来源 <span class="sync-hint">（微信发布时填写，仅供参考）</span></label>
        <input
          v-model="syncCreativeSource"
          class="sync-input"
          placeholder="个人观点，仅供参考"
          maxlength="30"
        />
      </div>

      <!-- 封面图 -->
      <div class="sync-modal-field">
        <label>封面图 <span class="sync-hint">（推荐 900×383，可裁剪）</span></label>
        <div class="sync-cover-preview" @click="coverDataUrl && openCropModal()" :title="coverDataUrl ? '点击裁剪封面' : ''">
          <img v-if="coverDataUrl" :src="coverDataUrl" class="sync-cover-img" />
          <div v-else class="sync-cover-empty">点击下方按钮选择或生成封面图</div>
          <div v-if="coverDataUrl" class="sync-cover-crop-hint">✂️ 点击封面可裁剪</div>
        </div>
        <div class="sync-cover-actions">
          <label class="sync-btn-upload">
            📁 上传图片
            <input type="file" accept="image/*" @change="handleCoverFileSelect" hidden />
          </label>
          <button class="sync-btn-gen" @click="regenerateCover">🎨 自动生成</button>
          <button v-if="coverDataUrl" class="sync-btn-crop" @click="openCropModal">✂️ 裁剪</button>
        </div>
      </div>

      <div class="sync-modal-actions">
        <button class="sync-btn-cancel" @click="showSyncDialog = false">取消</button>
        <button class="sync-btn-confirm" @click="doSyncToWechat" :disabled="pushLoading || !syncTitle.trim()">
          {{ pushLoading ? '⏳ 推送中...' : '✅ 确认同步到草稿箱' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ═══════════ 封面裁剪弹窗 ═══════════ -->
  <div v-if="showCropModal" class="crop-overlay" @click.self="cancelCrop">
    <div class="crop-modal">
      <h3 class="crop-title">✂️ 裁剪封面图（900×383）</h3>
      <div class="crop-canvas-wrap" ref="cropWrapRef">
        <canvas ref="cropCanvasRef" class="crop-canvas"></canvas>
      </div>
      <p class="crop-desc">拖拽选择框调整裁剪区域 | 滚轮缩放 | 保持 900:383 比例</p>
      <div class="crop-preview-row" v-if="cropPreviewDataUrl">
        <span class="crop-preview-label">裁剪预览：</span>
        <img :src="cropPreviewDataUrl" class="crop-preview-img" />
      </div>
      <div class="crop-actions">
        <button class="crop-btn-reset" @click="resetCrop">↺ 重置</button>
        <button class="sync-btn-cancel" @click="cancelCrop">取消</button>
        <button class="sync-btn-confirm" @click="applyCrop">✅ 确认裁剪</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useEditorStore, lightenToWhite } from './stores/editor';
import { TITLE_COMPONENTS, CARD_COMPONENTS, LIST_COMPONENTS, TABLE_COMPONENTS, DIVIDER_COMPONENTS, INTERACTIVE_COMPONENTS } from './constants/catalog.js';
import TopBar from './components/TopBar.vue';
import LeftSidebar from './components/LeftSidebar.vue';
import Editor from './components/Editor.vue';
import RightPanel from './components/RightPanel.vue';

const editorStore = useEditorStore();
const topBarRef = ref(null);
const editorRef = ref(null);
const rightPanelRef = ref(null);

// 卡片面板：排除互动组件（互动组件归入「互动」分组单独展示）
const cardComponentsFiltered = CARD_COMPONENTS.filter(
  c => c.type !== 'qaBox' && c.type !== 'nextPreview' && c.type !== 'zenQuote'
);
const interactiveComponents = INTERACTIVE_COMPONENTS;

// ── 移动端检测 ──
const isMobile = ref(false);
const mobileTab = ref('input');
const mobileFloatOpen = ref(false);
const showThemePopup = ref(false);
const showMobilePreview = ref(false);

// 切换预览/编辑
const toggleMobilePreview = () => {
  showMobilePreview.value = !showMobilePreview.value;
  if (showMobilePreview.value) {
    showThemePopup.value = false;
    mobileFloatOpen.value = false;
  }
};

// 切换 Tab 时关闭弹窗
watch(mobileTab, () => {
  showThemePopup.value = false;
  showMobilePreview.value = false;
});

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

// float-bar 可见性变化 → 联动关闭浮动球抽屉（避免两者同时显示）
const onFloatChange = (visible) => {
  if (visible) mobileFloatOpen.value = false;
};

// 动态 CSS 变量，跟随主题切换
const themeCSSVars = computed(() => {
  const t = editorStore.themes[editorStore.currentTheme];
  return {
    '--theme-color': t?.color || '#0066ff',
    '--theme-light': t?.light || '#e6f0ff',
    '--theme-faint': lightenToWhite(t?.light || '#e6f0ff', 0.7),
    '--volume-color': t?.volumeColor || t?.color || '#C8A15A',
    '--volume-light': t?.volumeLight || t?.light || '#F7F1E6'
  };
});

// 组件 HTML 模板生成器（代理到 store，编辑区和预览区共用）
const componentHTML = (comp, text, stepNum) => {
  return editorStore.componentHTML(comp, text, stepNum);
};

// 插入组件到编辑器
const handleInsertComponent = (comp) => {
  editorRef.value?.forceSaveBeforeChange();
  const compObj = typeof comp === 'string' ? { type: comp } : comp;
  const compType = compObj.type || comp;
  const stepNum = (compType === 'circleStepBadge' || compType === 'numberTitle') ? editorStore.getNextStepNum() : undefined;
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
    { type: 'tagTitle' },
    { type: 'leftLineTitle' },
    { type: 'rightLineTitle' },
    { type: 'centerLineTitle' },
    { type: 'circleIconTitle' },
    { type: 'dotLine' },
    { type: 'underlineTitle' },
    { type: 'cardTitle' },
    { type: 'dividerSolid' },
    { type: 'dividerDashed' },
    { type: 'dividerDot' },
    { type: 'dividerThick' },
    { type: 'highlightBlock' },
    { type: 'quoteBlock' },
    { type: 'cardVolume' },
    { type: 'cardBox' },
    { type: 'seriesOpening' },
    { type: 'spacer' },
  ];

  const allHTML = allComponents.map(c => componentHTML(c)).join('\n');

  // 用 setContent 直接写 DOM（内部会触发 onInput → 自动同步到 store → 预览区自动更新）
  if (editorRef.value) {
    editorRef.value.forceSaveBeforeChange();
    editorRef.value.setContent(allHTML);
  }
};

// Markdown / HTML 一键排版（根据主题 styleMap 生成组件 HTML）
const handleApplyMarkdown = (mdText) => {
  if (!mdText?.trim()) return;

  // 同步编辑器最新内容到 store，确保 getNextStepNum 扫描到最新状态
  const currentContent = editorRef.value?.getContent?.() || '';
  if (currentContent) editorStore.editorContent = currentContent;

  // ── HTML 输入自动转成 Markdown，再复用现有解析器 ──
  const looksLikeHTML = (s) => {
    const t = s.trim();
    return /^<(!DOCTYPE|html|body|section|div|p|h[1-6]|blockquote|ul|ol|li|span|strong|em|b|i|br|hr|meta|link)/i.test(t) ||
           (t.includes('<') && /<\/[a-z][a-z0-9]*>/i.test(t));
  };
  const htmlToMarkdown = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const extractInline = (node) => {
      let text = '';
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName.toLowerCase();
          if (tag === 'br') text += '\n';
          else if (tag === 'strong' || tag === 'b') text += '**' + extractInline(child) + '**';
          else if (tag === 'em' || tag === 'i') text += '*' + extractInline(child) + '*';
          else text += extractInline(child);
        }
      });
      return text.replace(/\s+/g, ' ').trim();
    };
    const lines = [];
    const pushBlock = (prefix, text) => {
      if (!text) return;
      text.split(/\n/).map(s => s.trim()).filter(Boolean).forEach(part => lines.push(prefix + part));
    };
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) lines.push(text);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'meta' || tag === 'link' || tag === 'head') return;
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        pushBlock('#'.repeat(parseInt(tag[1])) + ' ', extractInline(node));
      } else if (tag === 'blockquote') {
        pushBlock('> ', extractInline(node));
      } else if (tag === 'p' || tag === 'section' || tag === 'div') {
        pushBlock('', extractInline(node));
      } else if (tag === 'hr') {
        lines.push('---');
      } else if (tag === 'ul') {
        Array.from(node.children).forEach(li => {
          if (li.tagName.toLowerCase() === 'li') pushBlock('- ', extractInline(li));
        });
      } else if (tag === 'ol') {
        let idx = 1;
        Array.from(node.children).forEach(li => {
          if (li.tagName.toLowerCase() === 'li') pushBlock(`${idx++}. `, extractInline(li));
        });
      } else {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    Array.from(body.childNodes).forEach(walk);
    return lines.join('\n');
  };
  if (looksLikeHTML(mdText)) {
    try {
      mdText = htmlToMarkdown(mdText);
    } catch (e) {
      console.warn('HTML 转 Markdown 失败，按原样继续', e);
    }
  }

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
  let stepCounter = editorStore.getNextStepNum(); // 编号标题序号递增

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
  // 兼容半角（* _）与中文输入法打出的全角（＊ ＿），否则全角符号无法识别、原样保留成普通文本
  const fmt = (s) => s
    .replace(/＊/g, '*')                      // 全角星号 → 半角
    .replace(/＿/g, '_')                      // 全角下划线 → 半角
    .replace(/\*\*(.+?)\*\*/g, '<span style="font-weight:bold">$1</span>')
    .replace(/__(.+?)__/g, '<span style="font-weight:bold">$1</span>')
    .replace(/\*(.+?)\*/g, '<span style="font-style:italic">$1</span>')
    .replace(/_(.+?)_/g, '<span style="font-style:italic">$1</span>');

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
    if (headingMatch && editorStore.currentStylePreset !== 'yiming') {
      flushList();
      flushTable();
      const level = headingMatch[1].length; // 1, 2, 3
      const text = fmt(headingMatch[2]);
      const styleTypeMap = {
        1: editorStore.appearance.h1Style,
        2: editorStore.appearance.h2Style,
        3: editorStore.appearance.h3Style,
      };
      const styleType = styleTypeMap[level] || 'leftLineTitle';
      const stepTypes = ['numberTitle', 'circleStepBadge'];
      const stepNum = stepTypes.includes(styleType) ? stepCounter++ : undefined;
      output.push(componentHTML({ type: styleType }, text, stepNum));
      continue;
    }

    // 引用：> ...
    if (line.startsWith('>') && editorStore.currentStylePreset !== 'yiming') {
      flushList();
      flushTable();
      const quoteText = fmt(line.replace(/^>\s?/, ''));
      const qs = editorStore.appearance.quoteStyle || 'quoteBlock';
      output.push(componentHTML({ type: qs }, quoteText));
      continue;
    }

    // 分割线：---
    if (/^[-*_]{3,}$/.test(line) && editorStore.currentStylePreset !== 'yiming') {
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
        const styleType = editorStore.appearance.codeStyle || 'cardBox';
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

    // ── 易命术预设：单遍顺序扫描，按文章流即时输出组件 ──
    // 修复：① 首行 # 曾被标题分支 continue 掉导致整段不执行；
    //       ② 旧逻辑「分类桶」固定顺序会打散阅读流；
    //       ③ 旧逻辑缺小标题（##）识别，示例 vol-block 出不来。
    // 现改为：逐行分类、即时 push，顺序与文章一致；自动注入开头/结尾署名。
    if (editorStore.currentStylePreset === 'yiming') {
      const out = [];
      let metaTitle = '', metaDigest = '', metaSeries = '';
      let pastMeta = false;
      let foundSeriesLabel = false;
      let k = 0;
      while (k < lines.length) {
        const raw = lines[k];
        const norm = raw.replace(/＊/g, '*').trim();
        if (!norm) { k++; continue; }

        // ① 元数据（跳过正文，仅同步弹窗）
        if (!pastMeta && /^(标题|摘要|系列)\s*[:：]/.test(norm)) {
          if (/^标题/.test(norm)) metaTitle = norm.replace(/^标题\s*[:：]\s*/, '');
          if (/^摘要/.test(norm)) metaDigest = norm.replace(/^摘要\s*[:：]\s*/, '');
          if (/^系列/.test(norm)) metaSeries = norm.replace(/^系列\s*[:：]\s*/, '');
          k++; continue;
        }
        pastMeta = true;
        const inner = norm.replace(/^\*+/, '').replace(/\*+$/, '').trim();

        // ② 术名段：易命X术 · 术名（# 标题 或 独立加粗行）
        const h1 = norm.match(/^#\s+(.+)$/);
        if (h1 && /^易命[\w\W]{0,6}术\s*[·・\-–]\s*.+/.test(h1[1].replace(/^\*+/, '').replace(/\*+$/, '').trim())) {
          out.push(componentHTML({ type: 'titleShuName' }, h1[1].replace(/^\*+/, '').replace(/\*+$/, '').trim()));
          k++; continue;
        }
        if (/^\*+.+$/.test(norm) && /^易命[\w\W]{0,6}术\s*[·・\-–]\s*.+/.test(inner)) {
          out.push(componentHTML({ type: 'titleShuName' }, inner));
          k++; continue;
        }
        // ②-2 术名段：纯文本行"易命X术 · 术名"（常见于 HTML 转换后）
        if (/^易命[\w\W]{0,6}术\s*[·・\-–]\s*.+/.test(norm) && !/手记/.test(norm)) {
          out.push(componentHTML({ type: 'titleShuName' }, norm));
          k++; continue;
        }

        // （主标题自动识别已移除：术名后的短句按普通正文处理）

        // ④ 板块小标题：## / ### → 卷色方块小标题
        const hm = norm.match(/^#{2,3}\s+(.+)$/);
        if (hm) { out.push(componentHTML({ type: 'titleVolBlock' }, fmt(hm[1]))); k++; continue; }

        // ⑤ 分割线
        if (/^[-*_]{3,}$/.test(norm)) { out.push(componentHTML({ type: 'dividerDots' })); k++; continue; }

        // ⑥ 引用行（> 开头）：预告块 / 免责声明 / 普通引用卡
        if (norm.startsWith('>')) {
          const qt = norm.replace(/^>\s?/, '').trim();
          const qInner = qt.replace(/^\*+/, '').replace(/\*+$/, '').trim();
          if (/预告/.test(qInner)) {
            const block = [qInner];
            k++;
            while (k < lines.length && lines[k].trim().startsWith('>')) {
              const n2 = lines[k].replace(/＊/g, '*').trim().replace(/^>\s?/, '').trim();
              if (/（[^）]*出自小说|（[^）]*不涉及小说/.test(n2)) break;
              const c = n2.replace(/^\*+/, '').replace(/\*+$/, '').trim();
              if (c) block.push(c);
              k++;
            }
            out.push(componentHTML({ type: 'cardVolume' }, block.join('<br>')));
            continue;
          }
          out.push(componentHTML({ type: 'quoteBlock' }, fmt(qt)));
          k++; continue;
        }

        // ⑦ 手记署名：易命X术手记 · 卷X（**加粗** 或纯文本，HTML 转换后常见）
        if ((/^\*+.+$/.test(norm) && /易命[\w\W]{0,6}术\s*手记\s*[·・\-–]\s*卷/.test(inner)) ||
            /易命[\w\W]{0,6}术\s*手记\s*[·・\-–]\s*卷/.test(norm)) {
          const label = inner || norm;
          out.push(componentHTML({ type: 'seriesLabel' }, label));
          foundSeriesLabel = true;
          k++; continue;
        }

        // ⑧ 整行加粗（术名已在②捕获，手记已在⑦捕获）→ 普通加粗正文，保留 ** 加粗
        if (/^\*+.+\*+$/.test(norm)) {
          out.push(`<p>${fmt(norm)}</p>`);
          k++; continue;
        }

        // ⑨ 引用性段落（六祖/古人云/有诗为证 等显式引用标记）→ 宣纸引用卡
        if (/(六祖|古人云|有诗为证)/.test(inner) && inner.length > 20) {
          out.push(componentHTML({ type: 'quoteBlock' }, fmt(norm)));
          k++; continue;
        }

        // ⑩ 普通正文（用 norm 保留行内加粗 **，inner 会剥掉行尾 * 导致闭合符丢失）
        out.push(`<p>${fmt(norm)}</p>`);
        k++; continue;
      }
      const html = [
        componentHTML({ type: 'seriesOpening' }, metaSeries || null),
        ...out,
        ...(foundSeriesLabel ? [] : [componentHTML({ type: 'seriesLabel' }, null)])
      ].join('\n');
      if (metaTitle) syncTitle.value = metaTitle;
      if (metaDigest) syncDigest.value = metaDigest;
      editorRef.value?.forceSaveBeforeChange();
      editorRef.value?.insertHTML(html);
      return; // ← yiming 预设单遍处理完毕，直接返回
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
    const styleType = editorStore.appearance.codeStyle || 'cardBox';
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
const syncDigest = ref('');
const syncAuthor = ref('');
const syncSourceUrl = ref('');
const syncOpenComment = ref(true);   // 留言默认开启
const syncOriginal = ref(true);    // 原创默认开启（微信发布时设置，草稿接口不支持，仅作发布前提醒）
const syncAds = ref(true);         // 广告默认全开（微信发布时设置，草稿接口不支持，仅作发布前提醒）
const syncCreativeSource = ref('个人观点，仅供参考'); // 创作来源默认文案
const syncContent = ref('');
const coverDataUrl = ref('');   // Canvas 生成或用户选择的封面 base64
const coverUploading = ref(false);

// ── 封面裁剪状态 ──
const showCropModal = ref(false);
const cropCanvasRef = ref(null);
const cropWrapRef = ref(null);
const cropPreviewDataUrl = ref('');

// 裁剪参数
let cropImage = null;
let cropScale = 1;           // 缩放（初始适应容器）
let cropOffsetX = 0, cropOffsetY = 0;  // 图片在 canvas 中的偏移
let cropBoxX = 0, cropBoxY = 0;        // 裁剪框左上角（相对于图片原始尺寸）
let cropBoxW = 0, cropBoxH = 0;        // 裁剪框宽高（相对于图片原始尺寸）
let cropDragMode = '';       // '' | 'move' | 'resize-bl' | ... 
let cropDragStart = { x: 0, y: 0 };

// 同步标题变更时重新生成封面
const onSyncTitleChange = () => {
  // 标题变更后不自动重新生成封面，由用户手动触发
};

const regenerateCover = async () => {
  coverDataUrl.value = '';
  coverDataUrl.value = await generateDefaultCover(syncTitle.value);
};

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

  // 提取标题和摘要 — 解析开头"标题：""摘要："纯文本段落
  const tmp = document.createElement('div');
  tmp.innerHTML = content;

  let title = '';
  let digest = '';

  // 方法1：遍历所有块级子元素（不限于 <p>）
  const allBlocks = tmp.querySelectorAll('p, div, section, .editable-block, li, span');
  for (const el of allBlocks) {
    const raw = el.textContent.trim();
    if (!raw || raw.length > 200) continue; // 跳过空元素和长容器
    if (!title && /^标题[：:]/.test(raw)) {
      title = raw.replace(/^标题[：:]/, '').trim();
      continue;
    }
    if (!digest && /^摘要[：:]/.test(raw)) {
      digest = raw.replace(/^摘要[：:]/, '').trim();
      continue;
    }
    if (title && digest) break;
  }

  // 方法2（兜底）：直接从整个 innerText 用正则提取
  if (!title || !digest) {
    const fullText = tmp.innerText || '';
    if (!title) {
      const mTitle = fullText.match(/标题[：:]\s*(.+?)(?:\n|$)/);
      if (mTitle) title = mTitle[1].trim();
    }
    if (!digest) {
      const mDigest = fullText.match(/摘要[：:]\s*(.+?)(?:\n|$)/);
      if (mDigest) digest = mDigest[1].trim();
    }
  }

  // 最终兜底：h1/h2/h3
  if (!title) {
    const h = tmp.querySelector('h1, h2, h3');
    title = h ? h.textContent.trim() : '未命名文章';
  }

  const wechatHtml = editorStore.buildWechatHTML(content);

  syncTitle.value = title;
  syncDigest.value = digest;
  syncAuthor.value = detail?.account?.name || '';
  syncSourceUrl.value = '';
  syncOpenComment.value = true;            // 留言默认开启
  syncOriginal.value = true;             // 原创默认开启
  syncAds.value = true;                  // 广告默认全开
  syncCreativeSource.value = '个人观点，仅供参考'; // 创作来源默认文案
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
  if (!syncTitle.value.trim()) {
    alert('请输入文章标题');
    return;
  }
  pushLoading.value = true;
  try {
    let coverBase64 = coverDataUrl.value || null;

    const res = await fetch(`/api/wechat/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: syncTitle.value,
        content: syncContent.value,
        author: syncAuthor.value || undefined,
        digest: syncDigest.value || undefined,
        content_source_url: syncSourceUrl.value || undefined,
        need_open_comment: syncOpenComment.value ? 1 : 0,
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

// ═══════════════ 封面裁剪功能 ═══════════════

const CROP_RATIO = 900 / 383; // 微信封面推荐比例

function openCropModal() {
  if (!coverDataUrl.value) return;
  showCropModal.value = true;
  
  // 等待 DOM 渲染
  nextTick(() => {
    if (!cropCanvasRef.value) return;
    
    // 绑定事件
    const canvas = cropCanvasRef.value;
    canvas.addEventListener('mousedown', onCropPointerDown);
    canvas.addEventListener('touchstart', onCropPointerDown, { passive: false });
    canvas.addEventListener('wheel', onCropWheel, { passive: false });
    
    // 加载图片
    const img = new Image();
    img.onload = () => {
      cropImage = img;
      resetCrop();
    };
    img.src = coverDataUrl.value;
  });
}

function resetCrop() {
  if (!cropImage || !cropCanvasRef.value || !cropWrapRef.value) return;
  
  const canvas = cropCanvasRef.value;
  const wrap = cropWrapRef.value;
  
  // 初始显示：让图片适配容器宽度
  const maxW = wrap.clientWidth - 8;
  const maxH = Math.min(wrap.clientHeight - 8, 500);
  
  const imgW = cropImage.width;
  const imgH = cropImage.height;
  
  cropScale = Math.min(maxW / imgW, maxH / imgH, 1);
  const displayW = imgW * cropScale;
  const displayH = imgH * cropScale;
  
  canvas.width = displayW;
  canvas.height = displayH;
  cropOffsetX = 0;
  cropOffsetY = 0;
  
  // 默认裁剪框：尽量取 900:383 比例的最大区域
  const boxDisplayH = displayH;
  const boxDisplayW = boxDisplayH * CROP_RATIO;
  
  if (boxDisplayW <= displayW) {
    cropBoxW = imgW;
    cropBoxH = imgW / CROP_RATIO;
    if (cropBoxH > imgH) {
      cropBoxH = imgH;
      cropBoxW = imgH * CROP_RATIO;
    }
  } else {
    cropBoxH = imgH;
    cropBoxW = imgH * CROP_RATIO;
    if (cropBoxW > imgW) {
      cropBoxW = imgW;
      cropBoxH = imgW / CROP_RATIO;
    }
  }
  
  cropBoxX = (imgW - cropBoxW) / 2;
  cropBoxY = (imgH - cropBoxH) / 2;
  cropDragMode = '';
  
  drawCropCanvas();
}

function drawCropCanvas() {
  if (!cropImage || !cropCanvasRef.value) return;
  
  const canvas = cropCanvasRef.value;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  // 清空
  ctx.clearRect(0, 0, w, h);
  
  // 绘制底图
  ctx.drawImage(cropImage, 0, 0, w, h);
  
  // 半透明遮罩
  const bx = cropBoxX * cropScale;
  const by = cropBoxY * cropScale;
  const bw = cropBoxW * cropScale;
  const bh = cropBoxH * cropScale;
  
  // 四边半透明黑色
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, by);                    // 上
  ctx.fillRect(0, by + bh, w, h - by - bh);     // 下
  ctx.fillRect(0, by, bx, bh);                  // 左
  ctx.fillRect(bx + bw, by, w - bx - bw, bh);   // 右
  
  // 裁剪框边框
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.setLineDash([]);
  
  // 四角把手
  const handleSize = 10;
  ctx.fillStyle = '#fff';
  const corners = [
    [bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]
  ];
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
  });
  
  // 尺寸提示
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = '12px sans-serif';
  const dimText = `${Math.round(cropBoxW)}×${Math.round(cropBoxH)}`;
  const txtW = ctx.measureText(dimText).width;
  ctx.fillRect(bx + bw - txtW - 8, by + bh - 22, txtW + 16, 18);
  ctx.fillStyle = '#fff';
  ctx.fillText(dimText, bx + bw - txtW - 2, by + bh - 7);
  
  // 生成裁剪预览
  generateCropPreview();
}

function generateCropPreview() {
  if (!cropImage) return;
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 900;
  previewCanvas.height = 383;
  const pctx = previewCanvas.getContext('2d');
  pctx.drawImage(
    cropImage,
    cropBoxX, cropBoxY, cropBoxW, cropBoxH,
    0, 0, 900, 383
  );
  cropPreviewDataUrl.value = previewCanvas.toDataURL('image/jpeg', 0.9);
}

function applyCrop() {
  if (!cropImage) return;
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = 900;
  resultCanvas.height = 383;
  const ctx = resultCanvas.getContext('2d');
  ctx.drawImage(
    cropImage,
    cropBoxX, cropBoxY, cropBoxW, cropBoxH,
    0, 0, 900, 383
  );
  coverDataUrl.value = resultCanvas.toDataURL('image/jpeg', 0.92);
  showCropModal.value = false;
  cropPreviewDataUrl.value = '';
}

function cancelCrop() {
  showCropModal.value = false;
  cropPreviewDataUrl.value = '';
}

// ── 裁剪交互：鼠标/触摸 ──

function getEventPos(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function getHandleAt(pos) {
  if (!cropImage) return '';
  const margin = 14;
  const bx = cropBoxX * cropScale;
  const by = cropBoxY * cropScale;
  const bw = cropBoxW * cropScale;
  const bh = cropBoxH * cropScale;
  
  // 四角
  const corners = { tl: [bx, by], tr: [bx + bw, by], bl: [bx, by + bh], br: [bx + bw, by + bh] };
  for (const [key, [cx, cy]] of Object.entries(corners)) {
    if (Math.abs(pos.x - cx) < margin && Math.abs(pos.y - cy) < margin) return key;
  }
  // 四边中点
  const edges = {
    'top':    [bx + bw / 2, by],
    'bottom': [bx + bw / 2, by + bh],
    'left':   [bx, by + bh / 2],
    'right':  [bx + bw, by + bh / 2],
  };
  for (const [key, [cx, cy]] of Object.entries(edges)) {
    if (Math.abs(pos.x - cx) < margin + 6 && Math.abs(pos.y - cy) < margin + 6) return key;
  }
  
  // 框内 = 拖动
  if (pos.x >= bx && pos.x <= bx + bw && pos.y >= by && pos.y <= by + bh) return 'move';
  
  return '';
}

function onCropPointerDown(e) {
  if (!cropCanvasRef.value || !cropImage) return;
  e.preventDefault();
  const pos = getEventPos(e, cropCanvasRef.value);
  cropDragMode = getHandleAt(pos);
  cropDragStart = { x: pos.x, y: pos.y };
  
  if (cropDragMode) {
    document.addEventListener('mousemove', onCropPointerMove);
    document.addEventListener('mouseup', onCropPointerUp);
    document.addEventListener('touchmove', onCropPointerMove, { passive: false });
    document.addEventListener('touchend', onCropPointerUp);
  }
}

function onCropPointerMove(e) {
  if (!cropDragMode || !cropImage) return;
  e.preventDefault();
  const pos = getEventPos(e, cropCanvasRef.value);
  const dx = (pos.x - cropDragStart.x) / cropScale;
  const dy = (pos.y - cropDragStart.y) / cropScale;
  
  const minW = Math.max(50, cropImage.width * 0.1);
  const minH = Math.max(22, cropImage.height * 0.1);
  
  const imgW = cropImage.width;
  const imgH = cropImage.height;
  
  let { x: bx, y: by, w: bw, h: bh } = { x: cropBoxX, y: cropBoxY, w: cropBoxW, h: cropBoxH };
  
  switch (cropDragMode) {
    case 'move':
      bx = Math.max(0, Math.min(imgW - bw, bx + dx));
      by = Math.max(0, Math.min(imgH - bh, by + dy));
      break;
    case 'tl':
      bx = Math.max(0, Math.min(bx + bw - minW, bx + dx));
      by = Math.max(0, Math.min(by + bh - minH, by + dy));
      bw = (cropDragStart.x / cropScale) - bx + (cropBoxW - (cropDragStart.x / cropScale - cropBoxX));
      bh = (cropDragStart.y / cropScale) - by + (cropBoxH - (cropDragStart.y / cropScale - cropBoxY));
      // 保持比例
      bh = bw / CROP_RATIO;
      if (by + bh > imgH) { bh = imgH - by; bw = bh * CROP_RATIO; }
      break;
    case 'tr':
      bw = Math.max(minW, Math.min(imgW - bx, bw + dx));
      by = Math.max(0, Math.min(by + bh - minH, by + dy));
      bh = bw / CROP_RATIO;
      if (by + bh > imgH) { bh = imgH - by; bw = bh * CROP_RATIO; }
      break;
    case 'bl':
      bx = Math.max(0, Math.min(bx + bw - minW, bx + dx));
      bh = Math.max(minH, Math.min(imgH - by, bh + dy));
      bw = bh * CROP_RATIO;
      if (bx + bw > imgW) { bw = imgW - bx; bh = bw / CROP_RATIO; }
      break;
    case 'br':
      bw = Math.max(minW, Math.min(imgW - bx, bw + dx));
      bh = Math.max(minH, Math.min(imgH - by, bw / CROP_RATIO));
      bw = bh * CROP_RATIO;
      if (bx + bw > imgW) { bw = imgW - bx; bh = bw / CROP_RATIO; }
      break;
    case 'left':
      bx = Math.max(0, Math.min(bx + bw - minW, bx + dx));
      bw = (cropDragStart.x / cropScale) - bx + (cropBoxW - (cropDragStart.x / cropScale - cropBoxX));
      break;
    case 'right':
      bw = Math.max(minW, Math.min(imgW - bx, bw + dx));
      break;
    case 'top':
      by = Math.max(0, Math.min(by + bh - minH, by + dy));
      bh = (cropDragStart.y / cropScale) - by + (cropBoxH - (cropDragStart.y / cropScale - cropBoxY));
      break;
    case 'bottom':
      bh = Math.max(minH, Math.min(imgH - by, bh + dy));
      break;
  }
  
  cropBoxX = bx;
  cropBoxY = by;
  cropBoxW = bw;
  cropBoxH = bh;
  cropDragStart = pos;
  
  drawCropCanvas();
}

function onCropPointerUp() {
  cropDragMode = '';
  document.removeEventListener('mousemove', onCropPointerMove);
  document.removeEventListener('mouseup', onCropPointerUp);
  document.removeEventListener('touchmove', onCropPointerMove);
  document.removeEventListener('touchend', onCropPointerUp);
}

function onCropWheel(e) {
  if (!cropImage || !cropCanvasRef.value) return;
  e.preventDefault();
  
  const canvas = cropCanvasRef.value;
  const pos = getEventPos(e, canvas);
  
  // 鼠标位置的图片坐标
  const imgX = pos.x / cropScale;
  const imgY = pos.y / cropScale;
  
  // 缩放
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = cropScale * zoomFactor;
  
  // 限制缩放范围
  if (newScale < 0.1 || newScale > 5) return;
  
  cropScale = newScale;
  
  // 调整尺寸
  const displayW = cropImage.width * cropScale;
  const displayH = cropImage.height * cropScale;
  canvas.width = displayW;
  canvas.height = displayH;
  
  drawCropCanvas();
}
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
  background: #fff; border-radius: 14px; padding: 28px 32px; width: 520px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
}
.sync-modal-mobile {
  width: 95vw; max-width: 95vw; padding: 20px 16px; border-radius: 12px;
}
.sync-modal-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0 0 20px; }
.sync-modal-field { margin-bottom: 16px; position: relative; }
.sync-modal-field label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; }
.sync-hint { font-weight: 400; color: #999; font-size: 12px; }
.sync-field-row { display: flex; align-items: center; justify-content: space-between; }
.sync-field-row label { margin-bottom: 0; }

/* 输入字段 */
.sync-input {
  width: 100%; padding: 9px 12px; border: 1px solid #d9dce1; border-radius: 8px;
  font-size: 14px; color: #333; outline: none; transition: border 0.15s;
  background: #fafbfc; font-family: inherit;
}
.sync-input:focus { border-color: var(--theme-color, #0066ff); background: #fff; box-shadow: 0 0 0 3px rgba(0,102,255,0.08); }
.sync-input-short { width: 200px; }

.sync-textarea {
  width: 100%; padding: 9px 12px; border: 1px solid #d9dce1; border-radius: 8px;
  font-size: 13px; color: #333; outline: none; resize: vertical;
  background: #fafbfc; font-family: inherit; transition: border 0.15s;
}
.sync-textarea:focus { border-color: var(--theme-color, #0066ff); background: #fff; box-shadow: 0 0 0 3px rgba(0,102,255,0.08); }

.sync-char-count {
  position: absolute; right: 8px; bottom: -18px;
  font-size: 11px; color: #bbb;
}

/* 留言开关 */
.sync-toggle {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
  font-weight: 400 !important;
}
.sync-toggle input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: var(--theme-color, #0066ff); cursor: pointer;
}
.sync-toggle-text { font-size: 13px; color: #555; }

/* 发布设置提示条 */
.sync-section-note {
  font-size: 12px; color: #8a6d3; background: #f3eefe;
  border: 1px solid #e6dcfa; border-radius: 8px; padding: 8px 10px;
  margin: 4px 0 10px; line-height: 1.5;
}

/* 封面预览 */
.sync-cover-preview {
  width: 100%; aspect-ratio: 900/383; background: #f5f6f7; border-radius: 10px; overflow: hidden;
  border: 2px dashed #d9dce1; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;
  position: relative; cursor: pointer; transition: border 0.15s;
}
.sync-cover-preview:hover { border-color: var(--theme-color, #0066ff); }
.sync-cover-img { width: 100%; height: 100%; object-fit: cover; }
.sync-cover-empty { color: #bbb; font-size: 14px; }
.sync-cover-crop-hint {
  position: absolute; bottom: 8px; right: 10px;
  background: rgba(0,0,0,0.55); color: #fff; font-size: 11px;
  padding: 3px 8px; border-radius: 4px; pointer-events: none;
}

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
.sync-btn-crop {
  flex: 1; padding: 8px 12px; border: 1px solid #d9dce1; border-radius: 6px; background: #fff;
  font-size: 13px; color: #9b59b6; cursor: pointer; transition: all 0.15s;
}
.sync-btn-crop:hover { border-color: #9b59b6; color: #9b59b6; background: #faf5fc; }

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

/* ====== 裁剪弹窗 ====== */
.crop-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1100;
}
.crop-modal {
  background: #1e1e20; border-radius: 14px; padding: 24px 28px; width: 700px; max-width: 95vw; max-height: 95vh;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5); color: #e5e5e7; display: flex; flex-direction: column;
}
.crop-title { font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 16px; }
.crop-desc { font-size: 12px; color: #888; margin: 10px 0 8px; text-align: center; }
.crop-canvas-wrap {
  flex: 1; overflow: auto; max-height: 50vh; background: #111;
  border-radius: 8px; display: flex; align-items: flex-start; justify-content: center;
  padding: 4px;
}
.crop-canvas { max-width: 100%; cursor: crosshair; display: block; }

.crop-preview-row {
  display: flex; align-items: center; gap: 10px; margin-top: 12px;
  background: #2a2a2e; border-radius: 8px; padding: 8px 12px;
}
.crop-preview-label { font-size: 12px; color: #aaa; white-space: nowrap; }
.crop-preview-img { width: 180px; height: auto; border-radius: 4px; border: 1px solid #444; }

.crop-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.crop-btn-reset {
  padding: 10px 20px; border: 1px solid #555; border-radius: 8px; background: transparent;
  color: #ccc; font-size: 14px; cursor: pointer; transition: all 0.15s; margin-right: auto;
}
.crop-btn-reset:hover { background: #333; border-color: #777; }

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
.mobile-logo {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 13px; font-weight: 600; color: #333;
  border: 1px solid #d9dce1; background: #fff; cursor: pointer;
  height: 34px; padding: 0 12px; border-radius: 7px;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}
.mobile-logo:hover { border-color: var(--theme-color,#0066ff); color: var(--theme-color,#0066ff); background: var(--theme-light,#f0f7ff); }
.mobile-logo.on { background: var(--theme-light, #e6f0ff); color: var(--theme-color, #0066ff); border-color: var(--theme-color, #0066ff); }
.m-view-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 13px; font-weight: 600; color: #333;
  border: 1px solid #d9dce1; background: #fff; cursor: pointer;
  height: 34px; padding: 0 12px; border-radius: 7px;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}
.m-view-btn:hover { border-color: var(--theme-color,#0066ff); color: var(--theme-color,#0066ff); background: var(--theme-light,#f0f7ff); }
.m-view-btn.on { background: var(--theme-light, #e6f0ff); color: var(--theme-color, #0066ff); border-color: var(--theme-color, #0066ff); }
.mobile-version { font-size: 10px; color: #999; background: #f0f0f0; padding: 1px 4px; border-radius: 3px; }
.mobile-tb-actions { display: flex; gap: 4px; margin-left: auto; }
.m-btn {
  width: 32px; height: 32px; border: none; background: transparent;
  font-size: 16px; cursor: pointer; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  -webkit-tap-highlight-color: transparent;
}
.m-btn:active { background: #eef0f5; }
.m-btn.on { background: var(--theme-color, #e6f0ff); color: var(--theme-color, #0066ff); }

/* 主题色板弹窗 */
.mobile-theme-popup {
  position: absolute;
  top: 44px; right: 8px;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  padding: 12px;
  z-index: 9999;
  min-width: 200px;
}
.mtp-header {
  font-size: 12px; color: #999; margin-bottom: 8px;
  font-weight: 600;
}
.mtp-swatches {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.mtp-swatch {
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #e0e0e0;
  cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
  -webkit-tap-highlight-color: transparent;
  padding: 0;
}
.mtp-swatch.active {
  box-shadow: 0 0 0 2px var(--theme-color, #0066ff);
  transform: scale(1.1);
}
.mtp-check { color: #fff; font-size: 14px; font-weight: 700; }
.mtp-current {
  font-size: 12px; color: #666; margin-top: 8px;
  text-align: center;
}
.theme-popup-slide-enter-active, .theme-popup-slide-leave-active {
  transition: all 0.18s ease;
}
.theme-popup-slide-enter-from, .theme-popup-slide-leave-to {
  opacity: 0; transform: translateY(-8px);
}
.mtp-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9998;
}

/* 预览覆盖层 */
.mobile-preview-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #fff;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.mpo-bar {
  flex-shrink: 0;
  padding: 8px 14px;
  background: #f5f6f7;
  border-bottom: 1px solid #e8eaed;
}
.mpo-label {
  font-size: 12px; color: #666;
}
.mpo-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

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

/* 移动端 float-bar：右侧抽屉弹窗（窄宽度，悬浮球触发） */
#app-mobile .float-bar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: auto;
  width: 25%;
  max-width: 140px;
  max-height: 100vh;
  border-radius: 0;
  padding: 0;
  background: #1f2937;
  color: #fff;
  box-shadow: -4px 0 20px rgba(0,0,0,0.25);
}
</style>

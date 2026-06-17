<template>
  <div class="left-sidebar-inner">
    <!-- 左侧图标导航 -->
    <nav class="icon-nav">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="nav-btn"
        :class="{ active: activeNav === item.key }"
        @click="activeNav = item.key"
        :title="item.label"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>

    <!-- 右侧：组件面板内容区 -->
    <div class="panel-content">
      <!-- 内容输入面板 -->
      <div v-if="activeNav === 'input'" class="panel-section">
        <h3 class="panel-title">内容输入</h3>
        <textarea
          v-model="markdownInput"
          class="md-textarea"
          placeholder="在这里粘贴或输入 Markdown 文本..."
          rows="8"
          @input="handleMdInput"
        ></textarea>
        <div class="panel-actions">
          <button class="panel-btn panel-btn-outline" @click="triggerFileInput">📂 导入MD</button>
          <input ref="fileInputRef" type="file" accept=".md,.txt,.markdown" style="display:none" @change="handleFileImport" />
          <button class="panel-btn" @click="applyMarkdown">一键排版</button>
      <button class="panel-btn panel-btn-outline" @click="loadFullSample">完整示例</button>
          <button class="panel-btn panel-btn-outline" @click="clearInput">清空</button>
        </div>
      </div>

      <!-- 标题样式面板 -->
      <div v-else-if="activeNav === 'title'" class="panel-section">
        <h3 class="panel-title">标题样式</h3>

        <!-- 子分类 Tab -->
        <div class="sub-tabs">
          <button
            v-for="(cat, key) in titleCategories"
            :key="key"
            class="sub-tab"
            :class="{ active: activeTitleCat === key }"
            @click="activeTitleCat = key"
          >{{ cat.name }}</button>
        </div>

        <!-- 组件列表 -->
        <div class="component-grid">
          <button
            v-for="comp in titleCategories[activeTitleCat]?.items || []"
            :key="comp.type"
            class="comp-card"
            @click="insertComponent(comp)"
          >
            <div class="comp-preview" v-html="comp.preview"></div>
            <span class="comp-name">{{ comp.name }}</span>
          </button>
        </div>
      </div>

      <!-- 卡片样式面板 -->
      <div v-else-if="activeNav === 'card'" class="panel-section">
        <h3 class="panel-title">卡片 & 引用</h3>
        <div class="component-list-vertical">
          <button
            v-for="comp in cardComponents"
            :key="comp.type"
            class="comp-item"
            @click="insertComponent(comp)"
          >
            <span class="comp-icon-lg">{{ comp.icon }}</span>
            <span>{{ comp.name }}</span>
          </button>
        </div>
      </div>

      <!-- 分割线面板 -->
      <div v-else-if="activeNav === 'divider'" class="panel-section">
        <h3 class="panel-title">分割线 & 装饰</h3>
        <div class="component-list-vertical">
          <button
            v-for="comp in dividerComponents"
            :key="comp.type"
            class="comp-item"
            @click="insertComponent(comp)"
          >
            <span class="comp-icon-lg">{{ comp.icon }}</span>
            <span>{{ comp.name }}</span>
          </button>
        </div>
      </div>

      <!-- 互动组件面板 -->
      <div v-else-if="activeNav === 'interactive'" class="panel-section">
        <h3 class="panel-title">互动元素</h3>
        <p class="panel-hint">（后期扩展：投票、留言等）</p>
      </div>

      <!-- 我的主题面板（配色 + 定制） -->
      <div v-else-if="activeNav === 'mytheme'" class="panel-section">
        <h3 class="panel-title">我的主题</h3>

        <!-- 主题色选择 -->
        <div class="theme-group">
          <div class="tg-label">主题色</div>
          <div class="color-dots">
            <button
              v-for="(theme, key) in editorStore.themes"
              :key="key"
              class="cd-btn"
              :class="{ active: editorStore.currentTheme === key }"
              :style="{ '--dot-bg': theme.color }"
              :title="theme.name"
              @click="editorStore.setTheme(key)"
            >
              <span class="cd-dot"></span>
              <span class="cd-name">{{ theme.name }}</span>
            </button>
          </div>
        </div>

        <!-- 正文参数 -->
        <div class="theme-group">
          <div class="tg-label">正文</div>
          <div class="tg-row">
            <label>字号</label>
            <input type="range" min="12" max="22" step="1"
              :value="editorStore.appearance.fontSize"
              @input="editorStore.setAppearance('fontSize', +$event.target.value)" />
            <span class="tg-val">{{ editorStore.appearance.fontSize }}px</span>
          </div>
          <div class="tg-row">
            <label>段间距</label>
            <input type="range" min="0.5" max="3" step="0.1"
              :value="editorStore.appearance.lineSpacing"
              @input="editorStore.setAppearance('lineSpacing', +$event.target.value)" />
            <span class="tg-val">{{ editorStore.appearance.lineSpacing.toFixed(1) }}</span>
          </div>
        </div>

        <!-- 内容区背景 -->
        <div class="theme-group">
          <div class="tg-label">内容区</div>
          <div class="color-dots">
            <button v-for="p in editorStore.bgPresets.content" :key="p.color"
              class="cd-dot-btn"
              :class="{ active: editorStore.appearance.contentBgColor === p.color }"
              :style="{ background: p.color }" :title="p.name"
              @click="editorStore.setAppearance('contentBgColor', p.color)"></button>
            <input type="color" :value="editorStore.appearance.contentBgColor"
              @input="editorStore.setAppearance('contentBgColor', $event.target.value)"
              class="cd-picker" />
          </div>
          <div class="tg-row tg-row-sm">
            <label>间距</label>
            <input type="range" min="0" max="30" step="1"
              :value="editorStore.appearance.contentPadding"
              @input="editorStore.setAppearance('contentPadding', +$event.target.value)" />
            <span class="tg-val">{{ editorStore.appearance.contentPadding }}</span>
          </div>
          <div class="tg-row tg-row-sm">
            <label>圆角</label>
            <input type="range" min="0" max="30" step="1"
              :value="editorStore.appearance.contentRadius"
              @input="editorStore.setAppearance('contentRadius', +$event.target.value)" />
            <span class="tg-val">{{ editorStore.appearance.contentRadius }}</span>
          </div>
        </div>

        <!-- 外层背景 -->
        <div class="theme-group">
          <div class="tg-label">外层容器</div>
          <div class="color-dots">
            <button v-for="p in editorStore.bgPresets.outer" :key="p.color"
              class="cd-dot-btn"
              :class="{ active: editorStore.appearance.outerBgColor === p.color }"
              :style="{ background: p.color }" :title="p.name"
              @click="editorStore.setAppearance('outerBgColor', p.color)"></button>
            <input type="color" :value="editorStore.appearance.outerBgColor"
              @input="editorStore.setAppearance('outerBgColor', $event.target.value)"
              class="cd-picker" />
          </div>
          <div class="tg-row tg-row-sm">
            <label>边距</label>
            <input type="range" min="0" max="40" step="1"
              :value="editorStore.appearance.outerPadding"
              @input="editorStore.setAppearance('outerPadding', +$event.target.value)" />
            <span class="tg-val">{{ editorStore.appearance.outerPadding }}</span>
          </div>
          <div class="tg-row tg-row-sm">
            <label>圆角</label>
            <input type="range" min="0" max="30" step="1"
              :value="editorStore.appearance.outerRadius"
              @input="editorStore.setAppearance('outerRadius', +$event.target.value)" />
            <span class="tg-val">{{ editorStore.appearance.outerRadius }}</span>
          </div>
        </div>

        <!-- 标题样式映射 -->
        <div class="theme-group">
          <div class="tg-label">标题样式</div>
          <div class="tg-select-row">
            <label>H<sub>1</sub></label>
            <select :value="editorStore.appearance.h1Style"
              @change="editorStore.setAppearance('h1Style', $event.target.value)">
              <option v-for="t in editorStore.titleStylePresets" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option>
            </select>
          </div>
          <div class="tg-select-row">
            <label>H<sub>2</sub></label>
            <select :value="editorStore.appearance.h2Style"
              @change="editorStore.setAppearance('h2Style', $event.target.value)">
              <option v-for="t in editorStore.titleStylePresets" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option>
            </select>
          </div>
          <div class="tg-select-row">
            <label>H<sub>3</sub></label>
            <select :value="editorStore.appearance.h3Style"
              @change="editorStore.setAppearance('h3Style', $event.target.value)">
              <option v-for="t in editorStore.titleStylePresets" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useEditorStore } from '../stores/editor';

const editorStore = useEditorStore();
const emit = defineEmits(['insert-component', 'apply-markdown', 'load-full-sample']);

const activeNav = ref('input');
const markdownInput = ref('');
const activeTitleCat = ref('number');
const fileInputRef = ref(null);

// 导航项
const navItems = [
  { key: 'input', label: '内容输入', icon: '✏️' },
  { key: 'title', label: '标题', icon: '🔤' },
  { key: 'card', label: '卡片', icon: '📦' },
  { key: 'divider', label: '分割线', icon: '➖' },
  { key: 'interactive', label: '互动', icon: '💬' },
  { key: 'mytheme', label: '我的主题', icon: '🎨' }
];

// 标题分类
const titleCategories = reactive({
  number: {
    name: '编号标题',
    items: [
      { type: 'numberTitle', name: '编号标题', preview: '<b style="color:var(--theme-color,#0066ff)">01</b> 编号标题' },
      { type: 'gradientTitle', name: '渐变标题', preview: '<span style="background:linear-gradient(90deg,var(--theme-color,#0066ff),#a78bfa);-webkit-background-clip:text;-webkit-text-fill:transparent;font-weight:bold">渐变标题</span>' },
      { type: 'tagTitle', name: '标签标题', preview: '<span style="border-left:4px solid var(--theme-color,#0066ff);padding-left:10px;font-weight:bold">标签标题</span>' }
    ]
  },
  pill: {
    name: '胶囊标题',
    items: [
      { type: 'pillTitle', name: '胶囊标题', preview: '<span style="background:var(--theme-light,#e6f0ff);color:var(--theme-color,#0066ff);padding:2px 12px;border-radius:12px;font-size:12px;font-weight:bold">1</span> 胶囊标题' },
      { type: 'softPillTitle', name: '软底胶囊标题', preview: '<span style="background:#f0f0f0;color:#666;padding:2px 10px;border-radius:10px;font-size:11px">标签</span> 软底胶囊' }
    ]
  },
  line: {
    name: '竖线标题',
    items: [
      { type: 'leftLineTitle', name: '左竖线标题', preview: '<span style="display:inline-block;border-left:4px solid var(--theme-color,#0066ff);padding-left:10px;font-weight:bold;line-height:1.4">左竖线标题</span>' },
      { type: 'rightLineTitle', name: '右竖线标题', preview: '<span style="display:inline-block;text-align:right;border-right:4px solid var(--theme-color,#0066ff);padding-right:10px;font-weight:bold;line-height:1.4">右竖线标题</span>' },
      { type: 'centerLineTitle', name: '居中标题', preview: '<span style="display:block;text-align:center;font-weight:bold;border-bottom:2px solid var(--theme-color,#0066ff);padding-bottom:6px">居中标题</span>' }
    ]
  },
  circle: {
    name: '引导/圆点',
    items: [
      { type: 'circleIconTitle', name: '圆形图标标题', preview: '<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--theme-color,#0066ff);color:#fff;font-size:12px;font-weight:bold;margin-right:8px">💡</span>圆形图标标题' },
      { type: 'dotLine', name: '圆点横线', preview: '<span>●————————————— 圆点横线</span>' },
      { type: 'underlineTitle', name: '下划线标题', preview: '<span style="font-weight:bold;border-bottom:2px solid var(--theme-color,#0066ff);padding-bottom:2px">下划线标题</span>' }
    ]
  },
  special: {
    name: '特殊标题',
    items: [
      { type: 'cardTitle', name: '卡片标题', preview: '<span style="display:inline-block;background:var(--theme-light,#e6f0ff);border:1px solid var(--theme-color,#0066ff);border-radius:6px;padding:6px 14px;font-weight:bold;color:var(--theme-color,#0066ff)">卡片标题</span>' },
      { type: 'stepTitle', name: '步骤标题', preview: '<b style="color:var(--theme-color,#0066ff);font-size:16px">1</b><span style="margin-left:6px;font-weight:bold">步骤标题</span>' }
    ]
  }
});

// 卡片组件
const cardComponents = [
  { type: 'cardBox', name: '卡片框', icon: '📦' },
  { type: 'highlightBlock', name: '色块加重', icon: '🎨' },
  { type: 'quoteBlock', name: '引用块', icon: '💬' },
  { type: 'infoBox', name: '提示框', icon: 'ℹ️' },
  { type: 'disclaimer', name: '原创声明', icon: '📌' }
];

// 分割线组件
const dividerComponents = [
  { type: 'dividerSolid', name: '实线分割线', icon: '―' },
  { type: 'dividerDashed', name: '虚线分割线', icon: '┄' },
  { type: 'dividerDot', name: '点状分割线', icon: '⋯' },
  { type: 'dividerThick', name: '粗分割线', icon: '━' },
  { type: 'spacer', name: '留白间距', icon: '⤵' }
];

const insertComponent = (comp) => {
  emit('insert-component', comp);
};

const handleMdInput = () => {};
const applyMarkdown = () => {
  emit('apply-markdown', markdownInput.value);
};
const loadFullSample = () => {
  // 先清空 markdown 输入框
  markdownInput.value = '';
  // 通知 App.vue 加载完整示例（插入所有组件）
  emit('load-full-sample');
};
const clearInput = () => { markdownInput.value = ''; };

// 导入 MD 文件
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileImport = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    markdownInput.value = evt.target.result || '';
    // 自动切换到内容输入面板
    activeNav.value = 'input';
  };
  reader.onerror = () => {
    alert('文件读取失败，请重试');
  };
  reader.readAsText(file, 'UTF-8');
  // 重置 input，允许重复选择同一文件
  e.target.value = '';
};
</script>

<style scoped>
.left-sidebar-inner {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ====== 图标导航栏 ====== */
.icon-nav {
  width: 50px;
  background: #fafbfc;
  border-right: 1px solid #e8eaed;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 2px;
  flex-shrink: 0;
}

.nav-btn {
  width: 42px;
  height: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.15s ease;
  color: #666;
}

.nav-btn:hover {
  background: #eef1f5;
  color: var(--theme-color, #0066ff);
}

.nav-btn.active {
  background: var(--theme-light, #e6f0ff);
  color: var(--theme-color, #0066ff);
}

.nav-icon {
  font-size: 20px;
  line-height: 1;
}

.nav-label {
  font-size: 10px;
  line-height: 1;
  max-width: 48px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ====== 面板内容区 ====== */
.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
}

.panel-section {
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.panel-hint {
  font-size: 12px;
  color: #aaa;
  text-align: center;
  padding: 30px 0;
}

/* Markdown 输入 */
.md-textarea {
  width: 100%;
  border: 1px solid #e0e2e5;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  line-height: 1.7;
  color: #444;
}
.md-textarea:focus {
  border-color: var(--theme-color, #0066ff);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.08);
}
.md-textarea::placeholder {
  color: #ccc;
}

.panel-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 8px;
}

.panel-btn {
  flex: 1;
  padding: 7px 0;
  border: none;
  border-radius: 6px;
  background: var(--theme-color, #0066ff);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;
}
.panel-btn:hover { opacity: 0.9; }

.panel-btn-outline {
  background: #fff;
  color: #666;
  border: 1px solid #d9dce1;
}
.panel-btn-outline:hover {
  background: #f8f9fa;
  opacity: 1;
}

/* 子分类 Tab */
.sub-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.sub-tab {
  padding: 4px 10px;
  border: 1px solid #e0e2e5;
  border-radius: 14px;
  background: #fff;
  font-size: 11px;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;
}
.sub-tab:hover {
  border-color: var(--theme-color, #0066ff);
  color: var(--theme-color, #0066ff);
}
.sub-tab.active {
  background: var(--theme-color, #0066ff);
  color: #fff;
  border-color: var(--theme-color, #0066ff);
}

/* 组件网格 */
.component-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comp-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.comp-card:hover {
  border-color: var(--theme-color, #0066ff);
  background: var(--theme-light, #f8fbff);
  box-shadow: 0 1px 4px rgba(0, 102, 255, 0.08);
}

.comp-preview {
  min-width: 0;
  max-width: 100%;
  flex: 1;
  font-size: 12px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comp-name {
  font-size: 12px;
  color: #888;
  flex-shrink: 0;
}

/* 垂直列表 */
.component-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #444;
  transition: all 0.15s;
}
.comp-item:hover {
  border-color: var(--theme-color, #0066ff);
  background: var(--theme-light, #f8fbff);
}

.comp-icon-lg {
  font-size: 18px;
}

/* ========== 我的主题面板样式 ========== */
.theme-group {
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.theme-group:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.tg-label {
  font-size: 11px;
  font-weight: 700;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

/* 主题色选择 */
.color-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.cd-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border: 1.5px solid #e0e0e0;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  font-size: 11px;
  color: #666;
  transition: all 0.15s ease;
}
.cd-btn:hover { border-color: var(--theme-color,#0066ff); }
.cd-btn.active {
  border-color: #333;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.cd-dot {
  width: 14px; height: 14px;
  border-radius: 50%;
  display: block;
  background: var(--dot-bg);
}

.cd-name { white-space: nowrap; }

.cd-dot-btn {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 1.5px solid transparent;
  cursor: pointer; padding: 0;
  transition: all 0.12s ease; flex-shrink: 0;
}
.cd-dot-btn:hover { transform: scale(1.2); }
.cd-dot-btn.active {
  border-color: #555;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.cd-picker {
  width: 22px; height: 22px;
  border: none; border-radius: 50%;
  cursor: pointer; padding: 0;
  background: transparent; flex-shrink: 0;
}
.cd-picker::-webkit-color-swatch-wrapper { padding: 0; }
.cd-picker::-webkit-color-swatch {
  border: 1.5px solid #ddd;
  border-radius: 50%;
}

/* 滑块行 */
.tg-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.tg-row label {
  font-size: 12px; color: #666;
  white-space: nowrap; width: 28px; flex-shrink: 0;
}
.tg-row input[type="range"] {
  flex: 1; height: 4px;
  -webkit-appearance: none; appearance: none;
  background: #ddd; border-radius: 2px; outline: none;
}
.tg-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--theme-color,#0066ff);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
.tg-row-sm label { width: 26px; }

.tg-val {
  font-size: 11px; color: #888;
  min-width: 32px; text-align: right;
  font-variant-numeric: tabular-nums; flex-shrink: 0;
}

/* 下拉选择 */
.tg-select-row {
  display: flex; align-items: center;
  gap: 8px; margin-top: 6px;
}
.tg-select-row label {
  font-size: 12px; color: #666;
  white-space: nowrap; flex-shrink: 0;
}
.tg-select-row select {
  flex: 1; font-size: 12px; padding: 4px 6px;
  border: 1px solid #ddd; border-radius: 6px;
  background: #fff; color: #444; outline: none; cursor: pointer;
}
.tg-select-row select:focus { border-color: var(--theme-color,#0066ff); }
</style>

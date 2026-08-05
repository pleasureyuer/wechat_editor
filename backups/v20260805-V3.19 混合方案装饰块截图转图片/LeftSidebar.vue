<template>
  <div class="left-sidebar-inner">
    <!-- 左侧图标导航（分组） -->
    <nav class="icon-nav">
      <!-- 第1组：内容 -->
      <div class="nav-group">
        <div class="nav-group-label">内容</div>
        <button
          v-for="item in navGroup1"
          :key="item.key"
          class="nav-btn"
          :class="{ active: activeNav === item.key }"
          @click="activeNav = item.key"
          :title="item.label"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </div>
      <div class="nav-divider"></div>
      <!-- 第2组：组件 -->
      <div class="nav-group">
        <div class="nav-group-label">组件</div>
        <button
          v-for="item in navGroup2"
          :key="item.key"
          class="nav-btn"
          :class="{ active: activeNav === item.key }"
          @click="activeNav = item.key"
          :title="item.label"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- 右侧：组件面板内容区 -->
    <div class="panel-content">
      <!-- 内容输入面板 -->
      <div v-if="activeNav === 'input'" class="panel-section">
        <h3 class="panel-title">内容输入</h3>
        <textarea
          v-model="markdownInput"
          class="md-textarea"
          placeholder="在这里粘贴或输入 Markdown / HTML 文本..."
          rows="8"
          @input="handleMdInput"
        ></textarea>
        <div v-if="htmlPreview" class="html-preview-box">
          <div class="html-preview-label">HTML 实时预览（确认后点上方「导入为 HTML」）</div>
          <div class="html-preview" v-html="htmlPreview"></div>
        </div>
        <div class="panel-actions">
          <!-- 样式预设快捷选择 -->
          <div class="quick-style-row">
            <span class="qs-label">🎨 排版风格</span>
            <select
              :value="editorStore.currentStylePreset"
              @change="editorStore.setStylePreset($event.target.value)"
              class="qs-select"
            >
              <option v-for="sp in editorStore.stylePresetList" :key="sp.id" :value="sp.id">
                {{ sp.name }}{{ sp.isCustom ? ' ✓' : '' }}
              </option>
            </select>
          </div>
          <div class="panel-btns-grid">
          <button class="panel-btn panel-btn-outline" @click="triggerFileInput">📂 导入文件</button>
          <input ref="fileInputRef" type="file" accept=".md,.txt,.markdown,.html" style="display:none" @change="handleFileImport" />
          <button class="panel-btn" @click="applyMarkdown">一键排版</button>
          <button class="panel-btn" @click="applyHtml">导入为 HTML</button>
          <button class="panel-btn panel-btn-outline" @click="loadFullSample">完整示例</button>
          <button class="panel-btn panel-btn-outline" @click="clearInput">清空</button>
          </div>
        </div>
      </div>

      <!-- 标题样式面板 -->
      <div v-else-if="activeNav === 'title'" class="panel-section">
        <h3 class="panel-title">标题样式</h3>

        <!-- 组件列表（平铺，无分类） -->
        <div class="component-grid">
          <button
            v-for="comp in allTitleComponents"
            :key="comp.type"
            class="comp-card"
            @click="insertComponent(comp)"
          >
            <div class="comp-preview" v-html="comp.preview"></div>
          </button>
        </div>
      </div>

      <!-- 卡片样式面板 -->
      <div v-else-if="activeNav === 'card'" class="panel-section">
        <h3 class="panel-title">卡片 & 引用</h3>
        <div class="component-grid">
          <button
            v-for="comp in cardComponents"
            :key="comp.type"
            class="comp-card"
            @click="insertComponent(comp)"
          >
            <div class="comp-preview" v-html="comp.preview"></div>
          </button>
        </div>
      </div>

      <!-- 分割线面板 -->
      <div v-else-if="activeNav === 'divider'" class="panel-section">
        <h3 class="panel-title">分割线 & 装饰</h3>
        <div class="component-grid">
          <button
            v-for="comp in dividerComponents"
            :key="comp.type"
            class="comp-card"
            @click="insertComponent(comp)"
          >
            <div class="comp-preview" v-html="comp.preview"></div>
          </button>
        </div>
      </div>

      <!-- 列表 & 表格面板 -->
      <div v-else-if="activeNav === 'list'" class="panel-section">
        <h3 class="panel-title">列表样式</h3>
        <div class="component-grid">
          <button
            v-for="comp in listComponents"
            :key="comp.type"
            class="comp-card"
            @click="insertComponent(comp)"
          >
            <div class="comp-preview" v-html="comp.preview"></div>
          </button>
        </div>
        <h3 class="panel-title" style="margin-top:16px">表格样式</h3>
        <div class="component-list-vertical">
          <button
            v-for="comp in tableComponents"
            :key="comp.type"
            class="comp-item comp-item-desc"
            @click="insertComponent(comp)"
          >
            <span class="comp-icon-lg">{{ comp.icon }}</span>
            <div class="comp-item-info">
              <span class="comp-item-name">{{ comp.name }}</span>
              <span class="comp-item-desc-text">{{ comp.desc }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- 互动组件面板 -->
      <div v-else-if="activeNav === 'interactive'" class="panel-section">
        <h3 class="panel-title">互动元素</h3>
        <div class="component-grid">
          <button
            v-for="comp in interactiveComponents"
            :key="comp.type"
            class="comp-card"
            @click="insertComponent(comp)"
          >
            <div class="comp-preview" v-html="comp.preview"></div>
          </button>
        </div>
      </div>

      <!-- 主题样式面板（组件映射预设） -->
      <div v-else-if="activeNav === 'mytheme'" class="panel-section">
        <h3 class="panel-title">主题样式</h3>

        <!-- 样式预设选择 -->
        <div class="theme-group">
          <div class="tg-label">样式预设</div>
          <div class="style-preset-cards">
            <div
              v-for="sp in editorStore.stylePresetList"
              :key="sp.id"
              class="sp-row"
              :class="{ active: sp.isActive }"
            >
              <div class="sp-row-info" @click="editorStore.setStylePreset(sp.id)">
                <span class="sp-row-name">{{ sp.name }}</span>
                <span class="sp-row-badge" :class="{ preset: sp.isPreset, custom: sp.isCustom, edited: sp.hasOverride }">
                  {{ sp.hasOverride ? '已编辑' : (sp.isPreset ? '预设' : '自定义') }}
                </span>
              </div>
              <div class="sp-row-actions">
                <button class="sp-row-btn edit" title="编辑" @click.stop="openSPEditDialog(sp)">✏️</button>
                <button v-if="sp.isCustom" class="sp-row-btn del" title="删除" @click.stop="promptDeleteSP(sp)">✕</button>
              </div>
            </div>
          </div>
          <div class="sp-actions">
            <button class="panel-btn panel-btn-outline sp-btn-sm" @click="openSPCreateDialog">＋ 新建样式</button>
            <span class="sp-hint">点击预设名称切换 · 自定义预设可编辑 ✏️</span>
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

        <!-- 全文背景 -->
        <div class="theme-group">
          <div class="tg-label">全文背景</div>
          <div class="bg-mode-row">
            <button
              v-for="opt in editorStore.PAGE_BG_OPTIONS"
              :key="opt.id"
              class="bg-mode-btn"
              :class="{ active: editorStore.pageBgMode === opt.id }"
              @click="editorStore.setPageBgMode(opt.id)"
            >{{ opt.name }}</button>
          </div>
          <div class="sp-hint">颜色随当前主题：背景=页底色，线条=边框色</div>
        </div>

        <!-- 组件样式映射（默认展开） -->
        <div class="theme-group">
          <button class="sp-toggle" type="button" @click="showStyleMap = !showStyleMap">
            <span>🎯 组件样式映射</span>
            <span class="sp-toggle-arrow" :class="{ open: showStyleMap }">▾</span>
          </button>
          <div v-if="showStyleMap" class="sp-mappings">
            <!-- 标题 -->
            <div class="tg-select-row"><label>H<sub>1</sub></label>
              <select :value="editorStore.appearance.h1Style"
                @change="onStyleMapChange('h1Style', $event.target.value)">
                <option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>H<sub>2</sub></label>
              <select :value="editorStore.appearance.h2Style"
                @change="onStyleMapChange('h2Style', $event.target.value)">
                <option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>H<sub>3</sub></label>
              <select :value="editorStore.appearance.h3Style"
                @change="onStyleMapChange('h3Style', $event.target.value)">
                <option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>H<sub>4</sub></label>
              <select :value="editorStore.appearance.h4Style"
                @change="onStyleMapChange('h4Style', $event.target.value)">
                <option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option>
              </select></div>
            <!-- 引用/卡片 -->
            <div class="tg-select-row"><label>引用</label>
              <select :value="editorStore.appearance.quoteStyle"
                @change="onStyleMapChange('quoteStyle', $event.target.value)">
                <option v-for="s in editorStore.QUOTE_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>卡片</label>
              <select :value="editorStore.appearance.cardStyle"
                @change="onStyleMapChange('cardStyle', $event.target.value)">
                <option v-for="s in editorStore.CARD_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>分割线</label>
              <select :value="editorStore.appearance.dividerStyle"
                @change="onStyleMapChange('dividerStyle', $event.target.value)">
                <option v-for="s in editorStore.DIVIDER_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>列表</label>
              <select :value="editorStore.appearance.listStyle"
                @change="onStyleMapChange('listStyle', $event.target.value)">
                <option v-for="s in editorStore.LIST_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>代码块</label>
              <select :value="editorStore.appearance.codeStyle"
                @change="onStyleMapChange('codeStyle', $event.target.value)">
                <option v-for="s in editorStore.CODE_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
              </select></div>
            <div class="tg-select-row"><label>强调</label>
              <select :value="editorStore.appearance.emphasisStyle"
                @change="onStyleMapChange('emphasisStyle', $event.target.value)">
                <option v-for="s in editorStore.EMPHASIS_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option>
              </select></div>
          </div>
        </div>
      </div>

      <!-- 推送配置面板 -->
      <div v-else-if="activeNav === 'pushconfig'" class="panel-section">
        <h3 class="panel-title">推送配置</h3>

        <!-- 账号列表 -->
        <div class="pc-account-list">
          <div
            v-for="acc in accounts"
            :key="acc.id"
            class="pc-account-item"
            :class="{ active: acc.id === currentAccountId }"
          >
            <div class="pc-acc-info" @click="selectAccount(acc.id)">
              <span class="pc-acc-star">{{ acc.id === currentAccountId ? '★' : '☆' }}</span>
              <div class="pc-acc-text">
                <span class="pc-acc-name">{{ acc.name }}</span>
                <span class="pc-acc-id">{{ acc.appIdMasked }}</span>
              </div>
              <span v-if="acc.id === currentAccountId" class="pc-acc-default">默认</span>
            </div>
            <div class="pc-acc-actions">
              <button class="pc-acc-btn" title="编辑昵称" @click.stop="editAccount(acc)">✏️</button>
              <button class="pc-acc-btn" title="设为默认" :disabled="acc.id === currentAccountId" @click.stop="selectAccount(acc.id)">⭐</button>
              <button class="pc-acc-btn pc-acc-del" :disabled="accounts.length <= 1" :title="accounts.length <= 1 ? '至少保留一个账号' : '删除'" @click.stop="deleteAccount(acc)">🗑️</button>
            </div>
          </div>
        </div>

        <button class="panel-btn panel-btn-outline pc-add-btn" @click="showAddDialog = true">＋ 添加新账号</button>

        <!-- 添加/编辑账号弹窗 -->
        <div v-if="showAddDialog" class="tm-overlay" @click.self="showAddDialog = false">
          <div class="tm-dialog">
            <div class="tm-dialog-title">{{ editingAccount ? '编辑账号' : '添加公众号账号' }}</div>
            <label class="tm-field-label">账号昵称</label>
            <input v-model="formName" class="tm-input" placeholder="如：我的公众号" />
            <label class="tm-field-label">AppID</label>
            <input v-model="formAppId" class="tm-input" placeholder="微信公众号 AppID" :disabled="!!editingAccount" />
            <label class="tm-field-label" v-if="!editingAccount">AppSecret</label>
            <input v-if="!editingAccount" v-model="formSecret" type="password" class="tm-input" placeholder="输入 AppSecret" />
            <label class="tm-field-label" v-if="editingAccount">AppSecret（留空不修改）</label>
            <input v-if="editingAccount" v-model="formSecret" type="password" class="tm-input" placeholder="输入新 AppSecret（可选）" />
            <div class="tm-dialog-btn-row">
              <button class="tm-dialog-btn cancel" @click="showAddDialog = false">取消</button>
              <button class="tm-dialog-btn confirm" @click="submitAccount" :disabled="!formName || (!editingAccount && (!formAppId || !formSecret)) || saving">
                {{ saving ? '保存中...' : (editingAccount ? '保存' : '确认添加') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 新建/编辑 样式预设弹窗 -->
      <div v-if="spDialogVisible" class="tm-overlay" @click.self="spDialogVisible = false">
        <div class="tm-dialog tm-dialog-wide">
          <div class="tm-dialog-title">{{ spEditing ? '编辑样式' : '新建样式预设' }}</div>

          <label class="tm-field-label">预设名称</label>
          <input v-model="spFormName" class="tm-input" placeholder="例如：我的风格1" maxlength="8" />

          <label class="tm-field-label">组件样式映射</label>
          <div class="sp-form-mappings">
            <div class="tg-select-row"><label>H<sub>1</sub></label>
              <select v-model="spFormH1"><option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option></select></div>
            <div class="tg-select-row"><label>H<sub>2</sub></label>
              <select v-model="spFormH2"><option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option></select></div>
            <div class="tg-select-row"><label>H<sub>3</sub></label>
              <select v-model="spFormH3"><option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option></select></div>
            <div class="tg-select-row"><label>H<sub>4</sub></label>
              <select v-model="spFormH4"><option v-for="t in editorStore.TITLE_STYLE_OPTIONS" :key="t.id" :value="t.id">{{ t.icon }} {{ t.name }}</option></select></div>
            <div class="tg-select-row"><label>引用</label>
              <select v-model="spFormQuote"><option v-for="s in editorStore.QUOTE_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option></select></div>
            <div class="tg-select-row"><label>卡片</label>
              <select v-model="spFormCard"><option v-for="s in editorStore.CARD_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option></select></div>
            <div class="tg-select-row"><label>分割线</label>
              <select v-model="spFormDivider"><option v-for="s in editorStore.DIVIDER_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option></select></div>
            <div class="tg-select-row"><label>列表</label>
              <select v-model="spFormList"><option v-for="s in editorStore.LIST_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option></select></div>
            <div class="tg-select-row"><label>代码块</label>
              <select v-model="spFormCode"><option v-for="s in editorStore.CODE_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option></select></div>
            <div class="tg-select-row"><label>强调</label>
              <select v-model="spFormEmphasis"><option v-for="s in editorStore.EMPHASIS_STYLE_OPTIONS" :key="s.id" :value="s.id">{{ s.icon }} {{ s.name }}</option></select></div>
          </div>

          <label class="tm-field-label">关键字映射</label>
          <p class="sp-kw-hint">以某关键字开头的段落，自动套用映射组件。勾选「不显示」则正文里去掉该关键字前缀。</p>
          <div class="sp-kw-list">
            <div class="sp-kw-row" v-for="(m, idx) in spKwMaps" :key="m.id">
              <input class="sp-kw-key" v-model="m.keyword" placeholder="关键字，如 文章标题：" />
              <select class="sp-kw-comp" v-model="m.component">
                <optgroup v-for="g in groupedComponents" :key="g.group" :label="g.group">
                  <option v-for="o in g.items" :key="o.type" :value="o.type">{{ o.name }}</option>
                </optgroup>
              </select>
              <label class="sp-kw-hide"><input type="checkbox" v-model="m.hideKeyword" /> 不显示</label>
              <label class="sp-kw-en"><input type="checkbox" v-model="m.enabled" /> 启用</label>
              <button class="sp-kw-del" @click="removeKw(idx)" title="删除">✕</button>
            </div>
          </div>
          <button class="sp-kw-add" @click="addKw">＋ 新增映射</button>

          <div class="tm-dialog-btn-row">
            <button v-if="spEditing && editorStore.hasStylePresetOverride(spEditingId)" class="tm-dialog-btn reset-sp" @click="resetSPOverride">↺ 恢复预设</button>
            <button class="tm-dialog-btn cancel" @click="spDialogVisible = false">取消</button>
            <button class="tm-dialog-btn confirm" @click="submitStylePreset" :disabled="!spFormName">
              {{ spEditing ? '保存' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { useEditorStore, convertHtmlToWechatCompatible } from '../stores/editor';
import { TITLE_COMPONENTS, CARD_COMPONENTS, DIVIDER_COMPONENTS, LIST_COMPONENTS, TABLE_COMPONENTS, INTERACTIVE_COMPONENTS, ALL_COMPONENT_OPTIONS } from '../constants/catalog.js';

const editorStore = useEditorStore();
const emit = defineEmits(['insert-component', 'apply-markdown', 'apply-html', 'load-full-sample']);
const props = defineProps({
  forceNav: { type: String, default: '' }
});

const activeNav = ref('input');

// 移动端外部强制切换导航
watch(() => props.forceNav, (val) => {
  if (val) activeNav.value = val;
});
const markdownInput = ref('');
const fileInputRef = ref(null);

// 导航项
const navGroup1 = [
  { key: 'input', label: '内容输入', icon: '✏️' },
];

const navGroup2 = [
  { key: 'title', label: '标题', icon: '🔤' },
  { key: 'card', label: '卡片', icon: '📦' },
  { key: 'list', label: '列表', icon: '📋' },
  { key: 'divider', label: '分割线', icon: '➖' },
  { key: 'interactive', label: '互动', icon: '💬' },
  { key: 'mytheme', label: '我的主题', icon: '🎨' },
  { key: 'pushconfig', label: '推送配置', icon: '📤' }
];

// 所有标题组件（平铺展示）
// 以下组件目录统一从 src/constants/catalog.js 派生，保证与 PC/移动端弹窗、主题预设完全一致
const allTitleComponents = TITLE_COMPONENTS;
// 卡片面板：排除互动组件（互动组件归入左侧「互动」分组单独展示）
const cardComponents = CARD_COMPONENTS.filter(
  c => c.type !== 'qaBox' && c.type !== 'nextPreview' && c.type !== 'zenQuote'
);
const interactiveComponents = INTERACTIVE_COMPONENTS;
const dividerComponents = DIVIDER_COMPONENTS;
const listComponents = LIST_COMPONENTS;
const tableComponents = TABLE_COMPONENTS;

const insertComponent = (comp) => {
  emit('insert-component', comp);
};

// 修改当前样式预设的组件映射 — 自动同步到自定义预设
const STYLE_KEY_MAP = {
  h1Style:'h1', h2Style:'h2', h3Style:'h3', h4Style:'h4',
  quoteStyle:'quote', cardStyle:'card', dividerStyle:'divider',
  listStyle:'list', codeStyle:'code', emphasisStyle:'emphasis'
};

const showStyleMap = ref(true);

const onStyleMapChange = (key, value) => {
  editorStore.setAppearance(key, value);
  // 如果当前使用的是自定义预设，同步更新
  const presetId = editorStore.currentStylePreset;
  const sp = editorStore.allStylePresets[presetId];
  const smKey = STYLE_KEY_MAP[key];
  if (sp && !sp.isPreset && smKey) {
    const newMap = { ...sp.map, [smKey]: value };
    editorStore.updateStylePreset(presetId, { map: newMap });
  }
};

// ── 样式预设 CRUD 弹窗 ──
const spDialogVisible = ref(false);
const spEditing = ref(false);
const spEditingId = ref('');
const spFormName = ref('');
const spFormH1 = ref('gradientTitle');
const spFormH2 = ref('leftLineTitle');
const spFormH3 = ref('tagTitle');
const spFormH4 = ref('tagTitle');
const spFormQuote = ref('quoteBlock');
const spFormCard = ref('cardBox');
const spFormDivider = ref('dividerSolid');
const spFormList = ref('default');
const spFormCode = ref('cardBox');
const spFormEmphasis = ref('default');

// 关键字映射（按样式预设隔离，与组件样式映射同维度）
const spKwMaps = ref([]);
const groupedComponents = computed(() => {
  const map = {};
  for (const o of ALL_COMPONENT_OPTIONS) {
    (map[o.group] = map[o.group] || []).push(o);
  }
  return Object.entries(map).map(([group, items]) => ({ group, items }));
});

function setSPFormFromMap(m) {
  spFormH1.value = m.h1 || 'gradientTitle';
  spFormH2.value = m.h2 || 'leftLineTitle';
  spFormH3.value = m.h3 || 'tagTitle';
  spFormH4.value = m.h4 || 'tagTitle';
  spFormQuote.value = m.quote || 'quoteBlock';
  spFormCard.value = m.card || 'cardBox';
  spFormDivider.value = m.divider || 'dividerSolid';
  spFormList.value = m.list || 'default';
  spFormCode.value = m.code || 'cardBox';
  spFormEmphasis.value = m.emphasis || 'default';
}

function getSPFormMap() {
  return {
    h1: spFormH1.value, h2: spFormH2.value, h3: spFormH3.value, h4: spFormH4.value,
    quote: spFormQuote.value, card: spFormCard.value, divider: spFormDivider.value,
    list: spFormList.value, code: spFormCode.value, emphasis: spFormEmphasis.value,
  };
}

function openSPCreateDialog() {
  spEditing.value = false;
  spEditingId.value = '';
  spFormName.value = '';
  // 继承当前 appearance 的样式
  setSPFormFromMap({
    h1: editorStore.appearance.h1Style,
    h2: editorStore.appearance.h2Style,
    h3: editorStore.appearance.h3Style,
    h4: editorStore.appearance.h4Style,
    quote: editorStore.appearance.quoteStyle,
    card: editorStore.appearance.cardStyle,
    divider: editorStore.appearance.dividerStyle,
    list: editorStore.appearance.listStyle,
    code: editorStore.appearance.codeStyle,
    emphasis: editorStore.appearance.emphasisStyle,
  });
  spKwMaps.value = [];
  spDialogVisible.value = true;
}

function openSPEditDialog(sp) {
  spEditing.value = true;
  spEditingId.value = sp.id;
  spFormName.value = sp.name;
  setSPFormFromMap(sp.map || editorStore.DEFAULT_STYLE_MAP);
  spKwMaps.value = editorStore.getKeywordMaps(sp.id).map(m => ({ ...m }));
  spDialogVisible.value = true;
}

function submitStylePreset() {
  if (!spFormName.value) return;
  const map = getSPFormMap();
  if (spEditing.value) {
    const isPresetSp = !!editorStore.allStylePresets[spEditingId.value]?.isPreset;
    if (isPresetSp) {
      // 预设样式：写入覆盖层，不污染源码
      editorStore.saveStylePresetOverride(spEditingId.value, { name: spFormName.value, map });
    } else {
      editorStore.updateStylePreset(spEditingId.value, { name: spFormName.value, map });
    }
    editorStore.saveKeywordMaps(spEditingId.value, spKwMaps.value);
    // 如果编辑的是当前使用的，重新触发同步
    if (spEditingId.value === editorStore.currentStylePreset) {
      editorStore.setStylePreset(spEditingId.value);
    }
  } else {
    const id = editorStore.createStylePreset(spFormName.value, map);
    editorStore.saveKeywordMaps(id, spKwMaps.value);
    editorStore.setStylePreset(id);
  }
  spDialogVisible.value = false;
}

function resetSPOverride() {
  if (!spEditingId.value) return;
  editorStore.resetStylePresetOverride(spEditingId.value);
  // 重新加载原始预设数据到表单
  const original = editorStore.allStylePresets[spEditingId.value];
  if (original) {
    spFormName.value = original.name;
    setSPFormFromMap(original.map || editorStore.DEFAULT_STYLE_MAP);
  }
}

function addKw() {
  spKwMaps.value = [...spKwMaps.value, { id: 'kw_' + Date.now(), keyword: '', component: '', hideKeyword: false, enabled: true }];
}
function removeKw(idx) {
  spKwMaps.value.splice(idx, 1);
}

function promptDeleteSP(sp) {
  if (confirm(`确定要删除样式预设「${sp.name}」吗？`)) {
    editorStore.deleteStylePreset(sp.id);
  }
}

const handleMdInput = () => {};
const applyMarkdown = () => {
  emit('apply-markdown', markdownInput.value);
};
// 把当前输入框的 HTML 原样渲染到编辑器（保留内联样式）
const applyHtml = () => {
  if (!markdownInput.value?.trim()) return;
  emit('apply-html', markdownInput.value);
};
const loadFullSample = () => {
  // 先清空 markdown 输入框
  markdownInput.value = '';
  // 通知 App.vue 加载完整示例（插入所有组件）
  emit('load-full-sample');
};
const clearInput = () => { markdownInput.value = ''; htmlPreview.value = ''; };

// 判断是否像 HTML（含标签）
const looksLikeHTML = (s) => {
  const t = (s || '').trim();
  return /^<(!DOCTYPE|html|body|section|div|p|h[1-6]|blockquote|ul|ol|li|span|strong|em|b|i|br|hr|meta|link|table|img)/i.test(t) ||
         (t.includes('<') && /<\/[a-z][a-z0-9]*>/i.test(t));
};

// 粘贴 HTML 时实时预览（防抖）
const htmlPreview = ref('');
let htmlPreviewTimer = null;
watch(markdownInput, (val) => {
  clearTimeout(htmlPreviewTimer);
  htmlPreviewTimer = setTimeout(() => {
    if (val && looksLikeHTML(val)) {
      htmlPreview.value = convertHtmlToWechatCompatible(val);
    } else {
      htmlPreview.value = '';
    }
  }, 300);
});

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
    // 不直接覆盖编辑器：HTML 在下方实时预览，用户确认后点「导入为 HTML」；
    // Markdown 用户点「一键排版」。避免误清空已有正文。
  };
  reader.onerror = () => {
    alert('文件读取失败，请重试');
  };
  reader.readAsText(file, 'UTF-8');
  // 重置 input，允许重复选择同一文件
  e.target.value = '';
};

// ── 推送配置：多账号管理（逻辑和 PC 端 TopBar.vue 一致） ──
const accounts = ref([]);
const currentAccountId = ref('');
const showAddDialog = ref(false);
const editingAccount = ref(null);
const formName = ref('');
const formAppId = ref('');
const formSecret = ref('');
const saving = ref(false);

const loadAccounts = () => {
  try {
    const raw = localStorage.getItem('wechat_accounts');
    if (raw) accounts.value = JSON.parse(raw);
    const savedCurrent = localStorage.getItem('wechat_current_account');
    if (savedCurrent && accounts.value.find(a => a.id === savedCurrent)) {
      currentAccountId.value = savedCurrent;
    } else if (accounts.value.length > 0) {
      currentAccountId.value = accounts.value[0].id;
    }
  } catch {}
};

const saveAccountsLocal = () => {
  const safe = accounts.value.map(({ id, name, appId, appIdMasked }) => ({ id, name, appId, appIdMasked }));
  localStorage.setItem('wechat_accounts', JSON.stringify(safe));
  localStorage.setItem('wechat_current_account', currentAccountId.value);
};

const loadCredentialsStatus = async () => {
  try {
    const res = await fetch('/api/settings/wechat');
    const data = await res.json();
    if (data.accounts && data.accounts.length > 0) {
      data.accounts.forEach(acc => {
        const existing = accounts.value.find(a => a.appId === acc.appId);
        if (!existing) {
          accounts.value.push({
            id: 'acc_srv_' + acc.appId.slice(-8),
            name: acc.name,
            appId: acc.appId,
            appIdMasked: acc.appIdMasked,
          });
        } else {
          existing.appIdMasked = acc.appIdMasked;
          if (acc.name && acc.name !== '未命名账号') existing.name = acc.name;
        }
      });
      if (data.activeAppId) {
        const localMatch = accounts.value.find(a => a.appId === data.activeAppId);
        if (localMatch) currentAccountId.value = localMatch.id;
      }
      saveAccountsLocal();
    } else if (data.configured && data.appId && accounts.value.length === 0) {
      const masked = data.appId.length > 8 ? data.appId.slice(0, 6) + '___' + data.appId.slice(-4) : data.appId;
      accounts.value.push({ id: 'acc_synced', name: data.name || '已配置的公众号', appId: data.appId, appIdMasked: masked });
      currentAccountId.value = 'acc_synced';
      saveAccountsLocal();
    }
  } catch {}
};

const selectAccount = async (id) => {
  const acc = accounts.value.find(a => a.id === id);
  if (!acc) return;
  if (acc.appId) {
    try {
      const res = await fetch('/api/settings/wechat/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: acc.appId }),
      });
      const data = await res.json();
      if (!data.success) {
        const secret = prompt(`请输入「${acc.name}」的 AppSecret：`);
        if (!secret) return;
        await syncToBackend(acc.name, acc.appId, secret);
      }
    } catch {}
  }
  currentAccountId.value = id;
  saveAccountsLocal();
};

const editAccount = (acc) => {
  editingAccount.value = acc;
  formName.value = acc.name;
  formAppId.value = acc.appId;
  formSecret.value = '';
  showAddDialog.value = true;
};

const deleteAccount = async (acc) => {
  if (accounts.value.length <= 1) { alert('至少需要保留一个账号'); return; }
  if (!confirm(`确定要删除账号「${acc.name}」吗？`)) return;
  try { await fetch(`/api/settings/wechat/${encodeURIComponent(acc.appId)}`, { method: 'DELETE' }); } catch {}
  accounts.value = accounts.value.filter(a => a.id !== acc.id);
  if (currentAccountId.value === acc.id) currentAccountId.value = accounts.value[0]?.id || '';
  saveAccountsLocal();
};

const syncToBackend = async (name, appId, appSecret) => {
  try {
    const res = await fetch('/api/settings/wechat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, appId, appSecret }),
    });
    const data = await res.json();
    if (!data.success) { alert('保存失败：' + (data.error || '未知错误')); return false; }
    return true;
  } catch { alert('无法连接服务器'); return false; }
};

const submitAccount = async () => {
  if (!formName.value) return;
  if (editingAccount.value) {
    // 编辑现有账号
    const acc = editingAccount.value;
    acc.name = formName.value.trim();
    saveAccountsLocal();
    // 如果有新 secret，同步到后端
    if (formSecret.value) {
      await syncToBackend(acc.name, acc.appId, formSecret.value);
    } else {
      // 只改名
      fetch('/api/settings/wechat/rename', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: acc.appId, name: acc.name }),
      }).catch(() => {});
    }
  } else {
    // 新增账号
    if (!formAppId.value || !formSecret.value) return;
    saving.value = true;
    const ok = await syncToBackend(formName.value.trim(), formAppId.value.trim(), formSecret.value.trim());
    if (ok) {
      const id = 'acc_' + Date.now();
      const masked = formAppId.value.length > 8 ? formAppId.value.slice(0, 6) + '___' + formAppId.value.slice(-4) : formAppId.value;
      accounts.value.push({ id, name: formName.value.trim(), appId: formAppId.value.trim(), appIdMasked: masked });
      currentAccountId.value = id;
      saveAccountsLocal();
    }
    saving.value = false;
  }
  showAddDialog.value = false;
  editingAccount.value = null;
  formName.value = '';
  formAppId.value = '';
  formSecret.value = '';
};

// 初始化加载
loadAccounts();
loadCredentialsStatus();
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

.nav-group { display: flex; flex-direction: column; align-items: center; gap: 1px; }

.nav-group-label {
  font-size: 9px;
  color: #b0b0b0;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 4px 0 1px;
  font-weight: 600;
}

.nav-divider {
  width: 28px;
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
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

.html-preview-box {
  margin-top: 10px;
  border: 1px dashed #d3d6da;
  border-radius: 8px;
  background: #fafbfc;
  padding: 8px 10px;
}
.html-preview-label {
  font-size: 12px;
  color: #8a8f99;
  margin-bottom: 6px;
  letter-spacing: .3px;
}
.html-preview {
  max-height: 240px;
  overflow: auto;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  word-break: break-word;
}
.html-preview :deep(img) {
  max-width: 100%;
  height: auto;
}

.panel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

/* 样式预设快捷选择 */
.quick-style-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.qs-label {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}
.qs-select {
  flex: 1;
  padding: 5px 8px;
  font-size: 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 6px;
  background: #fafafa;
  color: #444;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.qs-select:focus {
  border-color: var(--theme-color, #0066ff);
  background: #fff;
}

.panel-btns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
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

/* 组件网格 */
.component-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comp-card {
  display: flex;
  align-items: center;
  padding: 6px 10px;
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
  padding: 8px 12px;
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

/* 带描述的列表/表格组件条目 */
.comp-item.comp-item-desc {
  align-items: flex-start;
}
.comp-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}
.comp-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.comp-item-desc-text {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
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

/* ═══════════ 样式预设卡片 ═══════════ */
.style-preset-cards {
  display: flex; flex-direction: column; gap: 3px;
}

.sp-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 6px; cursor: default;
  transition: all 0.12s;
  border: 1px solid transparent;
}
.sp-row:hover { background: #f0f2f5; }
.sp-row.active {
  background: #eef2ff; border-color: var(--theme-color, #0066ff);
}

.sp-row-info {
  display: flex; align-items: center; gap: 6px;
  flex: 1; min-width: 0; cursor: pointer;
}

.sp-row-name {
  font-size: 12px; font-weight: 600; color: #333;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.sp-row-badge {
  font-size: 9px; padding: 0 5px; border-radius: 3px;
  line-height: 15px; white-space: nowrap; flex-shrink: 0;
}
.sp-row-badge.preset { background: #fff3e0; color: #e6a700; }
.sp-row-badge.custom { background: #e6f7e6; color: #389e0d; }
.sp-row-badge.edited { background: #e8f0fe; color: #1a56db; }

.sp-row-actions { display: flex; gap: 2px; flex-shrink: 0; margin-left: 6px; }
.sp-row-btn {
  width: 22px; height: 22px; border-radius: 4px; border: none;
  background: transparent; cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  color: #999; transition: all 0.12s;
}
.sp-row-btn:hover { background: rgba(0,0,0,0.06); color: #333; }
.sp-row-btn.del:hover { background: #ffe6e6; color: #e53935; }

.sp-actions { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
.sp-btn-sm { font-size: 11px; padding: 4px 10px; width: auto; }
.sp-hint { font-size: 10px; color: #bbb; white-space: nowrap; }

/* ═══════════ 全文背景模式选择 ═══════════ */
.bg-mode-row { display: flex; gap: 6px; margin-top: 4px; }
.bg-mode-btn {
  flex: 1; padding: 7px 0; font-size: 12px; cursor: pointer;
  border: 1px solid #e3e3e3; background: #fafafa; color: #777; border-radius: 6px;
  transition: all .15s;
}
.bg-mode-btn:hover { border-color: #c8c8c8; }
.bg-mode-btn.active {
  background: var(--theme-color, #0066ff); color: #fff; border-color: var(--theme-color, #0066ff);
}

/* ═══════════ 组件映射折叠面板 ═══════════ */
.sp-toggle {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0; border: none; background: none; cursor: pointer;
  font-size: 12px; font-weight: 600; color: #666;
  transition: color 0.15s;
}
.sp-toggle:hover { color: var(--theme-color, #0066ff); }
.sp-toggle-arrow {
  font-size: 14px; transition: transform 0.2s;
}
.sp-toggle-arrow.open { transform: rotate(180deg); }

.sp-mappings {
  display: flex; flex-direction: column; gap: 4px;
  padding: 4px 0;
  animation: fadeIn 0.12s ease;
}

/* ═══════════ 样式预设弹窗 ═══════════ */
.tm-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35); z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}
.tm-dialog {
  background: #fff; border-radius: 12px; padding: 24px;
  width: 380px; max-height: 85vh; overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
}
.tm-dialog-wide { width: 440px; max-width: 92vw; }
.tm-dialog-title { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 16px; }
.tm-field-label {
  display: block; font-size: 12px; color: #666; margin-bottom: 4px; margin-top: 12px;
}
.tm-field-label:first-of-type { margin-top: 0; }
.tm-input {
  width: 100%; padding: 7px 10px; border: 1px solid #ddd;
  border-radius: 6px; font-size: 14px; box-sizing: border-box;
  outline: none;
}
.tm-input:focus { border-color: var(--theme-color, #0066ff); box-shadow: 0 0 0 2px rgba(0,102,255,0.1); }

.sp-form-mappings {
  display: flex; flex-direction: column; gap: 5px;
  margin-top: 2px;
}

/* 关键字映射（与组件样式映射同维度，按样式预设隔离） */
.sp-kw-hint { font-size: 12px; color: #999; line-height: 1.6; margin: 4px 0 10px; }
.sp-kw-list { display: flex; flex-direction: column; gap: 8px; }
.sp-kw-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sp-kw-key { flex: 1 1 120px; min-width: 100px; padding: 5px 8px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.sp-kw-comp { flex: 1 1 130px; min-width: 120px; padding: 5px 6px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; max-width: 160px; box-sizing: border-box; }
.sp-kw-hide, .sp-kw-en { font-size: 11px; color: #666; display: flex; align-items: center; gap: 2px; white-space: nowrap; }
.sp-kw-del { width: 22px; height: 22px; border: 1px solid #eee; background: #fafafa; border-radius: 4px; cursor: pointer; color: #999; flex-shrink: 0; }
.sp-kw-del:hover { background: #ffecec; color: #c0392b; border-color: #f0c0c0; }
.sp-kw-add {
  margin-top: 10px; width: 100%; padding: 8px 0; font-size: 13px; cursor: pointer; border: 1px dashed var(--theme-color, #0066ff);
  background: #fff; color: var(--theme-color, #0066ff); border-radius: 6px; box-sizing: border-box;
}
.sp-kw-add:hover { background: var(--theme-light, #e6f0ff); }

.tm-dialog-btn-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.tm-dialog-btn {
  padding: 7px 18px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.tm-dialog-btn.cancel { background: #f0f0f0; color: #666; }
.tm-dialog-btn.cancel:hover { background: #e0e0e0; }
.tm-dialog-btn.confirm { background: var(--theme-color, #0066ff); color: #fff; }
.tm-dialog-btn.confirm:hover { opacity: 0.85; }
.tm-dialog-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }
.tm-dialog-btn.reset-sp { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
.tm-dialog-btn.reset-sp:hover { background: #ffe0b2; }

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

/* ═══════════ 推送配置面板 ═══════════ */
.pc-account-list {
  display: flex; flex-direction: column; gap: 4px;
  margin-bottom: 10px;
}
.pc-account-item {
  border: 1px solid #eef0f2; border-radius: 8px; background: #fff;
  padding: 8px 10px; transition: all 0.15s;
}
.pc-account-item.active {
  border-color: var(--theme-color, #0066ff);
  background: var(--theme-light, #f0f7ff);
}
.pc-acc-info {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
}
.pc-acc-star { font-size: 14px; color: #ccc; flex-shrink: 0; }
.pc-account-item.active .pc-acc-star { color: #f5a623; }
.pc-acc-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.pc-acc-name { font-size: 13px; font-weight: 600; color: #333; }
.pc-acc-id { font-size: 11px; color: #aaa; }
.pc-acc-default {
  font-size: 10px; padding: 1px 6px; border-radius: 3px;
  background: var(--theme-color, #0066ff); color: #fff; flex-shrink: 0;
}
.pc-acc-actions { display: flex; gap: 4px; margin-top: 6px; }
.pc-acc-btn {
  width: 28px; height: 28px; border: 1px solid transparent; background: #f3f4f6;
  border-radius: 6px; cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center; transition: all 0.12s;
}
.pc-acc-btn:hover { background: #e8eaed; }
.pc-acc-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pc-acc-del:hover { background: #fee2e2; border-color: #fecaca; }
.pc-add-btn { width: 100%; margin-top: 4px; }
</style>

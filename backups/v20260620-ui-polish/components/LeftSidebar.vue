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
          placeholder="在这里粘贴或输入 Markdown 文本..."
          rows="8"
          @input="handleMdInput"
        ></textarea>
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
          <button class="panel-btn panel-btn-outline" @click="triggerFileInput">📂 导入MD</button>
          <input ref="fileInputRef" type="file" accept=".md,.txt,.markdown" style="display:none" @change="handleFileImport" />
          <button class="panel-btn" @click="applyMarkdown">一键排版</button>
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

      <!-- 列表 & 表格面板 -->
      <div v-else-if="activeNav === 'list'" class="panel-section">
        <h3 class="panel-title">列表样式</h3>
        <div class="component-list-vertical">
          <button
            v-for="comp in listComponents"
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
        <p class="panel-hint">（后期扩展：投票、留言等）</p>
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
                <span class="sp-row-badge" :class="{ preset: sp.isPreset, custom: sp.isCustom }">
                  {{ sp.isPreset ? '预设' : '自定义' }}
                </span>
              </div>
              <div class="sp-row-actions" v-if="sp.isCustom">
                <button class="sp-row-btn edit" title="编辑" @click.stop="openSPEditDialog(sp)">✏️</button>
                <button class="sp-row-btn del" title="删除" @click.stop="promptDeleteSP(sp)">✕</button>
              </div>
            </div>
          </div>
          <div class="sp-actions">
            <button class="panel-btn panel-btn-outline sp-btn-sm" @click="openSPCreateDialog">＋ 新建样式</button>
          </div>
        </div>

        <!-- 组件样式映射（可折叠） -->
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
      </div>

      <!-- 新建/编辑 样式预设弹窗 -->
      <div v-if="spDialogVisible" class="tm-overlay" @click.self="spDialogVisible = false">
        <div class="tm-dialog">
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

          <div class="tm-dialog-btn-row">
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
import { ref, reactive } from 'vue';
import { useEditorStore } from '../stores/editor';

const editorStore = useEditorStore();
const emit = defineEmits(['insert-component', 'apply-markdown', 'load-full-sample']);

const activeNav = ref('input');
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
  { key: 'mytheme', label: '我的主题', icon: '🎨' }
];

// 所有标题组件（平铺展示）
const allTitleComponents = [
  { type: 'numberTitle', name: '编号标题', preview: '<b style="color:var(--theme-color,#0066ff)">01</b> 编号标题' },
  { type: 'gradientTitle', name: '渐变标题', preview: '<span style="background:linear-gradient(90deg,var(--theme-color,#0066ff),#a78bfa);-webkit-background-clip:text;-webkit-text-fill:transparent;font-weight:bold">渐变标题</span>' },
  { type: 'tagTitle', name: '标签标题', preview: '<span style="border-left:4px solid var(--theme-color,#0066ff);padding-left:10px;font-weight:bold">标签标题</span>' },
  { type: 'pillTitle', name: '胶囊标题', preview: '<span style="background:var(--theme-light,#e6f0ff);color:var(--theme-color,#0066ff);padding:2px 12px;border-radius:12px;font-size:12px;font-weight:bold">1</span> 胶囊标题' },
  { type: 'softPillTitle', name: '软底胶囊标题', preview: '<span style="background:#f0f0f0;color:#666;padding:2px 10px;border-radius:10px;font-size:11px">标签</span> 软底胶囊' },
  { type: 'leftLineTitle', name: '左竖线标题', preview: '<span style="display:inline-block;border-left:4px solid var(--theme-color,#0066ff);padding-left:10px;font-weight:bold;line-height:1.4">左竖线标题</span>' },
  { type: 'rightLineTitle', name: '右竖线标题', preview: '<span style="display:inline-block;text-align:right;border-right:4px solid var(--theme-color,#0066ff);padding-right:10px;font-weight:bold;line-height:1.4">右竖线标题</span>' },
  { type: 'centerLineTitle', name: '居中标题', preview: '<span style="display:block;text-align:center;font-weight:bold;border-bottom:2px solid var(--theme-color,#0066ff);padding-bottom:6px">居中标题</span>' },
  { type: 'circleIconTitle', name: '圆形图标标题', preview: '<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--theme-color,#0066ff);color:#fff;font-size:12px;font-weight:bold;margin-right:8px">💡</span>圆形图标标题' },
  { type: 'dotLine', name: '圆点横线', preview: '<span>●————————————— 圆点横线</span>' },
  { type: 'underlineTitle', name: '下划线标题', preview: '<span style="font-weight:bold;border-bottom:2px solid var(--theme-color,#0066ff);padding-bottom:2px">下划线标题</span>' },
  { type: 'cardTitle', name: '卡片标题', preview: '<span style="display:inline-block;background:var(--theme-light,#e6f0ff);border:1px solid var(--theme-color,#0066ff);border-radius:6px;padding:6px 14px;font-weight:bold;color:var(--theme-color,#0066ff)">卡片标题</span>' },
  { type: 'stepTitle', name: '步骤标题', preview: '<b style="color:var(--theme-color,#0066ff);font-size:16px">1</b><span style="margin-left:6px;font-weight:bold">步骤标题</span>' },
  { type: 'arrowTitle', name: '箭头标题', preview: '<span style="color:var(--theme-color,#0066ff);font-weight:bold">→</span> 箭头标题' },
  { type: 'doubleLineTitle', name: '双竖线标题', preview: '<span style="display:inline-block;border-left:3px solid var(--theme-color,#0066ff);border-right:3px solid var(--theme-color,#0066ff);padding:2px 8px;font-weight:bold">双竖线</span>' },
  { type: 'diamondTitle', name: '菱形标题', preview: '<span style="color:var(--theme-color,#0066ff)">◆</span> 菱形标题' },
  // ── 2026-06-18 新增标题组件（参考截图）──
  { type: 'dotLineTitle', name: '圆点框线标题', preview: '<span style="border:2px solid var(--theme-color,#0066ff);border-radius:4px;padding:3px 10px;display:inline-block;font-size:12px;position:relative"><span style="position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:5px;height:5px;background:var(--theme-color);border-radius:50%"></span> 输入标题</span>' },
  { type: 'accentUnderline', name: '彩色下划线标题', preview: '<span style="font-weight:bold">输入标题</span><span style="display:block;height:2px;background:var(--theme-color,#ff6b9d);width:40px;margin-top:1px"></span>' },
  { type: 'solidBarTitle', name: '深色底条标题', preview: '<span style="background:#444;color:#fff;padding:2px 10px;border-radius:3px;font-size:11px;font-weight:bold">输入标题</span>' },
  { type: 'diamondLineTitle', name: '菱形延伸线标题', preview: '<span style="color:var(--theme-color)">◇</span><span style="font-weight:bold"> 输入标题 </span><span style="color:var(--theme-color)">◇</span>' },
  { type: 'circleStepBadge', name: '圆形步骤徽章', preview: '<span style="display:inline-block;width:22px;height:22px;line-height:20px;background:#ff8c42;color:#fff;font-size:12px;font-weight:800;border-radius:50%;text-align:center;vertical-align:middle">1</span>' }
];

// 卡片组件
const cardComponents = [
  { type: 'cardBox', name: '卡片框', icon: '📦' },
  { type: 'highlightBlock', name: '色块加重', icon: '🎨' },
  { type: 'quoteBlock', name: '引用块', icon: '💬' },
  { type: 'infoBox', name: '提示框', icon: 'ℹ️' },
  { type: 'leadParagraph', name: '导语段落', icon: '📝' },
  { type: 'goldenQuote', name: '金句卡片', icon: '✨' },
  { type: 'timelineItem', name: '时间线条目', icon: '🕐' },
  { type: 'checklistBox', name: '清单卡片', icon: '☑️' },
  { type: 'disclaimer', name: '原创声明', icon: '📌' }
];

// 分割线组件
const dividerComponents = [
  { type: 'dividerSolid', name: '实线分割线', icon: '―' },
  { type: 'dividerDashed', name: '虚线分割线', icon: '┄' },
  { type: 'dividerDot', name: '点状分割线', icon: '⋯' },
  { type: 'dividerOrnate', name: '花体分割线', icon: '✽' },
  { type: 'dividerThick', name: '粗分割线', icon: '━' },
  { type: 'spacer', name: '留白间距', icon: '⤵' }
];

// 列表组件
const listComponents = [
  { type: 'iconList', name: '图标列表', icon: '✦', desc: '带前缀图标的要点列表' },
  { type: 'numList', name: '大字编号列表', icon: '①', desc: '大号数字+要点描述' },
  { type: 'colorCardList', name: '色卡列表', icon: '🎨', desc: '左侧彩色竖条标注' },
  { type: 'twoColList', name: '双栏对比列表', icon: '⇌', desc: '左右两列并排对比' },
];

// 表格组件
const tableComponents = [
  { type: 'simpleTable', name: '简约表格', icon: '📊', desc: '深色表头，清晰简洁' },
  { type: 'striTable', name: '斑马纹表格', icon: '🦓', desc: '隔行换色，阅读轻松' },
  { type: 'borderTable', name: '全边框表格', icon: '⊞', desc: '格线清晰，方案对比' },
  { type: 'statCard', name: '数据统计卡', icon: '📈', desc: '大数字展示核心指标' },
];

const insertComponent = (comp) => {
  emit('insert-component', comp);
};

// 修改当前样式预设的组件映射 — 自动同步到自定义预设
const STYLE_KEY_MAP = {
  h1Style:'h1', h2Style:'h2', h3Style:'h3', h4Style:'h4',
  quoteStyle:'quote', cardStyle:'card', dividerStyle:'divider',
  listStyle:'list', codeStyle:'code', emphasisStyle:'emphasis'
};

const showStyleMap = ref(false);

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
const spFormH3 = ref('softPillTitle');
const spFormH4 = ref('softPillTitle');
const spFormQuote = ref('quoteBlock');
const spFormCard = ref('cardBox');
const spFormDivider = ref('dividerSolid');
const spFormList = ref('default');
const spFormCode = ref('infoBox');
const spFormEmphasis = ref('default');

function setSPFormFromMap(m) {
  spFormH1.value = m.h1 || 'gradientTitle';
  spFormH2.value = m.h2 || 'leftLineTitle';
  spFormH3.value = m.h3 || 'softPillTitle';
  spFormH4.value = m.h4 || 'softPillTitle';
  spFormQuote.value = m.quote || 'quoteBlock';
  spFormCard.value = m.card || 'cardBox';
  spFormDivider.value = m.divider || 'dividerSolid';
  spFormList.value = m.list || 'default';
  spFormCode.value = m.code || 'infoBox';
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
  spDialogVisible.value = true;
}

function openSPEditDialog(sp) {
  spEditing.value = true;
  spEditingId.value = sp.id;
  spFormName.value = sp.name;
  setSPFormFromMap(sp.map || editorStore.DEFAULT_STYLE_MAP);
  spDialogVisible.value = true;
}

function submitStylePreset() {
  if (!spFormName.value) return;
  const map = getSPFormMap();
  if (spEditing.value) {
    editorStore.updateStylePreset(spEditingId.value, { name: spFormName.value, map });
    // 如果编辑的是当前使用的，重新触发同步
    if (spEditingId.value === editorStore.currentStylePreset) {
      editorStore.setStylePreset(spEditingId.value);
    }
  } else {
    const id = editorStore.createStylePreset(spFormName.value, map);
    editorStore.setStylePreset(id);
  }
  spDialogVisible.value = false;
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
.sp-row:hover { background: #f5f6f8; }
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

.sp-row-actions { display: flex; gap: 2px; flex-shrink: 0; margin-left: 6px; }
.sp-row-btn {
  width: 20px; height: 20px; border-radius: 4px; border: none;
  background: transparent; cursor: pointer; font-size: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #999; transition: all 0.12s;
}
.sp-row-btn:hover { background: rgba(0,0,0,0.06); color: #333; }
.sp-row-btn.del:hover { background: #ffe6e6; color: #e53935; }

.sp-actions { margin-top: 6px; }
.sp-btn-sm { font-size: 11px; padding: 4px 10px; width: auto; }

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

.tm-dialog-btn-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.tm-dialog-btn {
  padding: 7px 18px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.tm-dialog-btn.cancel { background: #f0f0f0; color: #666; }
.tm-dialog-btn.cancel:hover { background: #e0e0e0; }
.tm-dialog-btn.confirm { background: var(--theme-color, #0066ff); color: #fff; }
.tm-dialog-btn.confirm:hover { opacity: 0.85; }
.tm-dialog-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }

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

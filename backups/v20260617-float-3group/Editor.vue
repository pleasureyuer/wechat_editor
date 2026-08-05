<template>
  <div class="editor-shell">
    <!-- 格式工具栏 -->
    <div class="toolbar">
      <div class="tb-group">
        <button class="tb-btn" title="撤销" @click="run('undo')">↶</button>
        <button class="tb-btn" title="重做" @click="run('redo')">↷</button>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group">
        <select class="tb-sel" v-model="fontSize" @change="applyFontSize">
          <option v-for="s in sizeList" :key="s">{{ s }}</option>
        </select>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group">
        <select class="tb-sel tb-sel-sm" title="字间距" v-model="letterSpacing" @change="applyLetterSpacing">
          <option value="">A↔</option>
          <option value="-0.5px">-0.5</option>
          <option value="0px">0</option>
          <option value="0.5px">0.5</option>
          <option value="1px">1</option>
          <option value="1.5px">1.5</option>
          <option value="2px">2</option>
          <option value="3px">3</option>
          <option value="4px">4</option>
          <option value="6px">6</option>
          <option value="8px">8</option>
        </select>
        <select class="tb-sel tb-sel-sm" title="行间距" v-model="lineHeight" @change="applyLineHeight">
          <option value="">A≡</option>
          <option value="1">1.0</option>
          <option value="1.2">1.2</option>
          <option value="1.4">1.4</option>
          <option value="1.6">1.6</option>
          <option value="1.75">1.75</option>
          <option value="1.85">1.85</option>
          <option value="2">2.0</option>
          <option value="2.2">2.2</option>
          <option value="2.5">2.5</option>
          <option value="3">3.0</option>
        </select>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group">
        <button class="tb-btn" :class="{on:st.b}" @click="run('bold')"><b>B</b></button>
        <button class="tb-btn" :class="{on:st.i}" @click="run('italic')"><i>I</i></button>
        <button class="tb-btn" :class="{on:st.u}" @click="run('underline')"><u>U</u></button>
        <button class="tb-btn" :class="{on:st.s}" @click="run('strikeThrough')"><s>S</s></button>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group">
        <button class="tb-btn" @click="run('justifyLeft')" title="左对齐">
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="0" y="1" width="14" height="2" rx="0.5" fill="currentColor"/><rect x="0" y="6" width="9" height="2" rx="0.5" fill="currentColor"/><rect x="0" y="11" width="12" height="2" rx="0.5" fill="currentColor"/></svg>
        </button>
        <button class="tb-btn" @click="run('justifyCenter')" title="居中">
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="0" y="1" width="14" height="2" rx="0.5" fill="currentColor"/><rect x="2" y="6" width="10" height="2" rx="0.5" fill="currentColor"/><rect x="1" y="11" width="12" height="2" rx="0.5" fill="currentColor"/></svg>
        </button>
        <button class="tb-btn" @click="run('justifyRight')" title="右对齐">
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="0" y="1" width="14" height="2" rx="0.5" fill="currentColor"/><rect x="5" y="6" width="9" height="2" rx="0.5" fill="currentColor"/><rect x="2" y="11" width="12" height="2" rx="0.5" fill="currentColor"/></svg>
        </button>
        <button class="tb-btn" @click="run('justifyFull')" title="两端对齐">
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="0" y="1" width="14" height="2" rx="0.5" fill="currentColor"/><rect x="0" y="6" width="14" height="2" rx="0.5" fill="currentColor"/><rect x="0" y="11" width="14" height="2" rx="0.5" fill="currentColor"/></svg>
        </button>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group">
        <button class="tb-btn" @click="run('insertUnorderedList')" title="无序列表">
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="1.5" cy="2.5" r="1.2" fill="currentColor"/><rect x="4.5" y="1.5" width="9.5" height="1.8" rx="0.5" fill="currentColor"/><circle cx="1.5" cy="7.5" r="1.2" fill="currentColor"/><rect x="4.5" y="6.5" width="9.5" height="1.8" rx="0.5" fill="currentColor"/><circle cx="1.5" cy="12.5" r="1.2" fill="currentColor"/><rect x="4.5" y="11.5" width="7" height="1.8" rx="0.5" fill="currentColor"/></svg>
        </button>
        <button class="tb-btn" @click="run('insertOrderedList')" title="有序列表">
          <svg width="14" height="14" viewBox="0 0 14 14"><text x="0" y="3.8" font-size="4.5" fill="currentColor" font-family="Arial,sans-serif" font-weight="bold">1</text><rect x="5" y="2" width="9" height="1.8" rx="0.5" fill="currentColor"/><text x="0" y="9.2" font-size="4.5" fill="currentColor" font-family="Arial,sans-serif" font-weight="bold">2</text><rect x="5" y="7" width="9" height="1.8" rx="0.5" fill="currentColor"/><text x="0" y="14.5" font-size="4.5" fill="currentColor" font-family="Arial,sans-serif" font-weight="bold">3</text><rect x="5" y="12" width="7" height="1.8" rx="0.5" fill="currentColor"/></svg>
        </button>
        <button class="tb-btn" @click="run('outdent')">⇠</button>
        <button class="tb-btn" @click="run('indent')">⇢</button>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group">
        <button class="tb-btn" @click="insertLink">🔗</button>
        <button class="tb-btn" @click="insertImg">🖼️</button>
        <button class="tb-btn" @click="showTableGrid=!showTableGrid;showEmj=false">⊞</button>
        <!-- 表格网格选择弹出 -->
        <div v-show="showTableGrid" class="pop-table-grid">
          <div class="table-grid-hint">{{ tableGridRows }}列 × {{ tableGridCols }}行</div>
          <div class="table-grid-cells">
            <template v-for="r in 6" :key="'r'+r">
              <button
                v-for="c in 6"
                :key="'r'+r+'c'+c"
                class="tg-cell"
                :class="{ active: c <= tableGridCols && r <= tableGridRows }"
                @mouseenter="tableGridCols = c; tableGridRows = r"
                @click="insertTableGrid(tableGridRows, tableGridCols)"
              ></button>
            </template>
          </div>
        </div>
        <button class="tb-btn" @click="insertQuote">"</button>
        <button class="tb-btn" @click="insertHR">—</button>
        <button class="tb-btn" @click="insertCode">&lt;/&gt;</button>
        <button class="tb-btn" @click="showEmj=!showEmj">😊</button>
      </div>
      <!-- 表情弹出 -->
      <div v-show="showEmj" class="pop-emj">
        <button v-for="e in emjList" :key="e" class="emj-item" @click="doEmj(e)">{{ e }}</button>
      </div>
    </div>

    <!-- 编辑区 -->
    <div
      ref="edRef"
      class="editor"
      contenteditable="true"
      @input="onInput"
      @keyup="onKey"
      @mouseup="onSelect"
      @scroll="onEditorScroll"
    ></div>

    <!-- 浮动快捷工具栏 -->
    <div v-show="floatOn" class="float-bar" :style="floatPos">
      <!-- 模式1: 选中文字 → 文字格式化 -->
      <template v-if="floatMode === 'text'">
        <div class="fl-label">文字:</div>
        <select class="fl-sel" :value="selFontSize" @change="applyFloatFontSize($event.target.value)">
          <option value="">字号</option>
          <option v-for="s in sizeList" :key="s" :value="s">{{ s.replace('px','') }}</option>
        </select>
        <!-- 一键主题色（点击即应用） -->
        <button class="fl-btn fl-tc-btn" @click="applyThemeColor" title="一键主题色">
          <span class="fl-dot" :style="{background:store.currentThemeColor}"></span> 主题色
        </button>
        <span class="fl-sep">|</span>
        <!-- 文字颜色色板 -->
        <button class="fl-btn fl-pal-btn" title="文字颜色" @click.stop="showTextPal=!showTextPal;showBgPal=false">
          <span class="fl-pal-label">A</span> 字色
        </button>
        <div v-if="showTextPal" class="fl-pop fl-pop-pal">
          <button v-for="c in textColors" :key="c" class="fl-swatch"
            :style="{background:c}" @click="applyTextColor(c);showTextPal=false"
            :title="c"></button>
        </div>
        <!-- 背景色色板 -->
        <button class="fl-btn fl-pal-btn" title="文字背景色" @click.stop="showBgPal=!showBgPal;showTextPal=false">
          <span class="fl-pal-label" style="background:#ffe082">A</span> 底色
        </button>
        <div v-if="showBgPal" class="fl-pop fl-pop-pal">
          <button v-for="c in bgColors" :key="c" class="fl-swatch"
            :style="{background:c}" @click="applyBgColor(c);showBgPal=false"
            :title="c"></button>
        </div>
        <span class="fl-sep">|</span>
        <button class="fl-btn" :class="{on:st.b}" @click="run('bold')" title="加粗"><b>B</b></button>
        <button class="fl-btn" :class="{on:st.i}" @click="run('italic')" title="斜体"><i>I</i></button>
        <button class="fl-btn" :class="{on:st.u}" @click="run('underline')" title="下划线"><u>U</u></button>
      </template>

      <!-- 模式2: 光标在段落 → 3组分类（左键应用样式，右键插入新组件） -->
      <template v-else-if="floatMode === 'block'">
        <!-- 第1组：标题（13个，与左侧「标题样式」面板一一对应） -->
        <div class="fl-group">
          <span class="fl-g-label">标题</span>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('numberTitle')" @contextmenu.prevent="emitInsert('numberTitle')">01 编号</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('gradientTitle')" @contextmenu.prevent="emitInsert('gradientTitle')">🌈 渐变</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('tagTitle')" @contextmenu.prevent="emitInsert('tagTitle')">🏷️ 标签</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('pillTitle')" @contextmenu.prevent="emitInsert('pillTitle')">💊 胶囊</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('softPillTitle')" @contextmenu.prevent="emitInsert('softPillTitle')">🫧 软胶囊</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('leftLineTitle')" @contextmenu.prevent="emitInsert('leftLineTitle')">◀ 左竖线</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('rightLineTitle')" @contextmenu.prevent="emitInsert('rightLineTitle')">▶ 右竖线</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('centerLineTitle')" @contextmenu.prevent="emitInsert('centerLineTitle')">⬥ 居中</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('circleIconTitle')" @contextmenu.prevent="emitInsert('circleIconTitle')">⭕ 圆形</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('dotLine')" @contextmenu.prevent="emitInsert('dotLine')">● 圆点横线</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('underlineTitle')" @contextmenu.prevent="emitInsert('underlineTitle')">_̲ 下划线</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('cardTitle')" @contextmenu.prevent="emitInsert('cardTitle')">📛 卡片标题</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('stepTitle')" @contextmenu.prevent="emitInsert('stepTitle')">① 步骤</button>
        </div>
        <!-- 第2组：卡片（5个，与左侧「卡片」面板一一对应） -->
        <div class="fl-group">
          <span class="fl-g-label">卡片</span>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('cardBox')" @contextmenu.prevent="emitInsert('cardBox')">📦 卡片框</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('highlightBlock')" @contextmenu.prevent="emitInsert('highlightBlock')">🎨 色块</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('quoteBlock')" @contextmenu.prevent="emitInsert('quoteBlock')">💬 引用</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('infoBox')" @contextmenu.prevent="emitInsert('infoBox')">ℹ️ 提示</button>
          <button class="fl-btn fl-comp" @click="applyBlockStyle('disclaimer')" @contextmenu.prevent="emitInsert('disclaimer')">📌 声明</button>
        </div>
        <!-- 第3组：分割线（5个，与左侧「分割线」面板一一对应） -->
        <div class="fl-group">
          <span class="fl-g-label">分割</span>
          <button class="fl-btn fl-comp" @click="emitInsert('dividerSolid')" @contextmenu.prevent="emitInsert('dividerSolid')">― 实线</button>
          <button class="fl-btn fl-comp" @click="emitInsert('dividerDashed')" @contextmenu.prevent="emitInsert('dividerDashed')">┄ 虚线</button>
          <button class="fl-btn fl-comp" @click="emitInsert('dividerDot')" @contextmenu.prevent="emitInsert('dividerDot')">⋯ 点状</button>
          <button class="fl-btn fl-comp" @click="emitInsert('dividerThick')" @contextmenu.prevent="emitInsert('dividerThick')">━ 粗线</button>
          <button class="fl-btn fl-comp" @click="emitInsert('spacer')" @contextmenu.prevent="emitInsert('spacer')">⤵ 留白</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()
const edRef = ref(null)
const fontSize = ref('17px')
const letterSpacing = ref('')
const lineHeight = ref('')
const showEmj = ref(false)
const showTableGrid = ref(false)
const tableGridCols = ref(3)
const tableGridRows = ref(3)
const floatOn = ref(false)
const floatPos = ref({})
const floatMode = ref('text') // 'text' | 'block'（block 已合并3组：标题/卡片/分割）
const showTextPal = ref(false)
const showBgPal = ref(false)
const selFontSize = ref('')
const selDisplaySize = ref('333')
const sizeList = ['12px','13px','14px','15px','16px','17px','18px','20px','24px','28px','32px']

// 文字颜色预设（色板）
const textColors = [
  '#e60012','#ff4d4f','#fa8c16','#faad14','#fadb14',
  '#a0d911','#52c41a','#13c2c2','#1890ff','#2f54eb',
  '#722ed1','#eb2f96','#333333','#666666','#999999',
]

// 背景色预设（色板）
const bgColors = [
  '#fff9c4','#f8bbd0','#bbdefb','#c8e6c9',
  '#e1bee7','#ffe0b2','#b3e5fc','#ffccbc',
  '#dcedc8','#f5f5f5','#e0e0e0','#ffffff',
]

const st = reactive({ b:false, i:false, u:false, s:false })

const emjList = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😇',
  '🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛',
  '😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨',
  '😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌',
  '😔','😪','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶',
  '🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','👍'
]

function run(cmd, val) {
  document.execCommand(cmd, false, val || null)
  edRef.value?.focus()
  onInput()
  sync()
}

function sync() {
  st.b = document.queryCommandState('bold')
  st.i = document.queryCommandState('italic')
  st.u = document.queryCommandState('underline')
  st.s = document.queryCommandState('strikeThrough')
}

function onInput() {
  if (!edRef.value) return
  store.editorContent = edRef.value.innerHTML
}

function onKey(e) {
  if (e.ctrlKey || e.metaKey) {
    const k = e.key.toLowerCase()
    if (k==='b') { e.preventDefault(); run('bold') }
    if (k==='i') { e.preventDefault(); run('italic') }
    if (k==='u') { e.preventDefault(); run('underline') }
    if (k==='z') { e.preventDefault(); e.shiftKey ? run('redo') : run('undo') }
    if (k==='y') { e.preventDefault(); run('redo') }
  }
  if (e.key==='Tab') {
    e.preventDefault()
    e.shiftKey ? run('outdent') : run('indent')
  }
}

function onSelect() {
  const sel = window.getSelection()
  const txt = sel?.toString().trim()
  
  // 关闭所有弹出
  showTextPal.value = false
  showBgPal.value = false

  if (txt && edRef.value?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    // 有选中文字 → 文字模式
    floatMode.value = 'text'
    floatOn.value = true
    const r = sel.getRangeAt(0)
    const rect = r.getBoundingClientRect()
    floatPos.value = {
      position: 'fixed',
      left: Math.min(rect.left + rect.width/2 - 200, window.innerWidth-540) + 'px',
      top: (rect.top - 50) + 'px',
      zIndex: 10000
    }
    // 检测当前字号
    detectFontSize(sel)
  } else if (edRef.value && edRef.value.contains(sel?.focusNode)) {
    // 光标在编辑器内，没有选文字 → 块模式
    floatMode.value = 'block'
    floatOn.value = true
    try {
      const r = sel.getRangeAt(0)
      const rect = r.getBoundingClientRect()
      floatPos.value = {
        position: 'fixed',
        left: Math.min(rect.left, window.innerWidth-770) + 'px',
        top: (rect.bottom + 8) + 'px',
        zIndex: 10000
      }
    } catch {
      floatPos.value = { position:'fixed', left:'10px', top:'60px', zIndex:10000 }
    }
  } else {
    floatOn.value = false
  }
  sync()
}

// 检测选中文字的字号
function detectFontSize(sel) {
  if (!sel || !sel.rangeCount) return
  let size = ''
  try {
    const node = sel.anchorNode
    let el = node.nodeType === 1 ? node : node.parentElement
    while (el && el !== edRef.value) {
      if (el.style && el.style.fontSize) { size = el.style.fontSize; break; }
      el = el.parentElement
    }
  } catch {}
  selFontSize.value = size || ''
  selDisplaySize.value = size ? size.replace('px','') : (store.appearance.fontSize || 16)
}

function applyFontSize() {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return
  const span = document.createElement('span')
  span.style.fontSize = fontSize.value
  try { sel.getRangeAt(0).surroundContents(span) } catch {}
  onInput()
}

function applyLetterSpacing() {
  wrapSelection('letter-spacing', letterSpacing.value)
}

function applyLineHeight() {
  wrapSelection('line-height', lineHeight.value)
}

// 通用：给选中文字包裹 span 并设置样式
function wrapSelection(prop, value) {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || sel.toString().trim() === '') return
  const range = sel.getRangeAt(0)
  // 检查是否已经在一个 span 内
  let startNode = range.startContainer
  while (startNode && startNode !== edRef.value) {
    if (startNode.nodeType === 1 && startNode.tagName === 'SPAN' && startNode.style[prop]) {
      // 已有样式，直接修改
      startNode.style[prop] = value
      onInput()
      return
    }
    startNode = startNode.parentNode
  }

  const span = document.createElement('span')
  span.style[prop] = value
  try { range.surroundContents(span) } catch {}
  onInput()
}

// ── 浮动栏专用函数 ──

// 字号（浮动栏用）
function applyFloatFontSize(size) {
  if (!size) return
  wrapSelection('fontSize', size)
}

// 一键主题色：直接应用当前主题色到选中文字
function applyThemeColor() {
  wrapSelection('color', store.currentThemeColor)
}

// 文字颜色
function applyTextColor(color) {
  wrapSelection('color', color)
}

// 背景色（色板）
function applyBgColor(color) {
  wrapSelection('backgroundColor', color)
}

// 发射组件插入事件（通知父组件 App.vue）
const emit = defineEmits(['insert-component', 'scroll'])

// 左键：把当前段落转换成对应组件格式
function applyBlockStyle(compType) {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return

  // 找到光标所在的块级元素
  let container = sel.focusNode
  if (!container) return
  let el = container.nodeType === 1 ? container : container.parentElement
  if (!el) return

  // 向上找到 editable-block 组件容器（优先找 data-style，再降级到 P/H1-H6）
  let targetEl = null
  let walk = el
  while (walk && walk !== edRef.value) {
    // 优先找组件容器（editable-block 且带 data-style）
    if (walk.classList?.contains('editable-block') && walk.dataset?.style) {
      targetEl = walk
      break
    }
    walk = walk.parentElement
  }

  // 没找到组件容器，再找普通块级元素（P/H1-H6）
  if (!targetEl) {
    walk = el
    while (walk && walk !== edRef.value) {
      const tag = walk.tagName?.toUpperCase()
      if (['P','H1','H2','H3','H4','H5','H6','DIV','SECTION','BLOCKQUOTE'].includes(tag)) {
        targetEl = walk
        break
      }
      walk = walk.parentElement
    }
  }

  // 还没找到就用编辑器内的第一个 p
  if (!targetEl) {
    targetEl = edRef.value?.querySelector('p')
  }

  if (!targetEl) {
    // 没找到段落，直接插入新组件
    emitInsert(compType)
    return
  }

  // 获取当前段落的纯文本（用作组件文字）
  const currentText = targetEl.textContent?.trim() || ''
  
  // 根据组件类型，生成组件 HTML（调用 store 的 componentHTML）
  const compHTML = store.componentHTML({ type: compType }, currentText)

  if (!compHTML) {
    emitInsert(compType)
    return
  }

  // 替换当前元素为组件 HTML
  // 方案：把组件 HTML 插入到目标元素前面，然后删除目标元素
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = compHTML
  const compNode = tempDiv.firstElementChild

  if (compNode && edRef.value) {
    edRef.value.insertBefore(compNode, targetEl)
    targetEl.remove()
    onInput()
    // 把光标移到新组件后面
    const range = document.createRange()
    range.setStartAfter(compNode)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    edRef.value.focus()
  }

  floatOn.value = false
}

function emitInsert(compType) {
  floatOn.value = false
  emit('insert-component', { type: compType })
}

// 插入正文段落
function emitInsertText() {
  floatOn.value = false
  insertHTML('<p style="font-size:16px;line-height:1.85;color:#333;padding:8px 0;">在此输入正文内容...</p>')
}

// 清除当前行的格式
function clearCurrentLine() {
  floatOn.value = false
  run('removeFormat')
}

function insertLink() {
  const url = prompt('链接地址：', 'https://')
  if (url) run('createLink', url)
}

function insertImg() {
  const url = prompt('图片地址：\n\n⚠️ 请使用微信公众平台素材库的图片链接（已上传至公众号的图片），外部链接在公众号后台可能无法显示。', '')
  if (!url) return
  // 检测是否是微信 CDN 链接
  if (!url.includes('mmbiz.qpic.cn') && !url.includes('mp.weixin.qq.com')) {
    if (!confirm('⚠️ 该图片链接不是微信 CDN 地址，粘贴到公众号后台后可能无法显示。\n\n是否继续插入？')) return
  }
  run('insertImage', url)
}

function insertTable() {
  const r = parseInt(prompt('行数（默认3）','3')) || 3
  const c = parseInt(prompt('列数（默认3）','3')) || 3
  insertTableGrid(r, c)
}

function insertTableGrid(rows, cols) {
  showTableGrid.value = false
  let h = '<table style="width:100%;border-collapse:collapse;margin:12px 0;">'
  for (let i = 0; i < rows; i++) {
    h += '<tr>'
    for (let j = 0; j < cols; j++) {
      const tag = i === 0 ? 'th' : 'td'
      const fw = i === 0 ? 'font-weight:700;' : ''
      h += '<' + tag + ' style="border:1px solid #ddd;padding:8px 12px;text-align:center;' + fw + '">' + (i === 0 ? '标题' + (j + 1) : '内容') + '</' + tag + '>'
    }
    h += '</tr>'
  }
  h += '</table><p><br></p>'
  insertHTML(h)
}

function insertQuote() {
  const txt = window.getSelection().toString().trim()
  insertHTML('<blockquote class="st-quote">'+(txt||'引用内容')+'</blockquote><p><br></p>')
}

function insertHR() {
  insertHTML('<hr class="st-hr"><p><br></p>')
}

function insertCode() {
  const txt = window.getSelection().toString().trim()
  insertHTML('<pre class="st-code"><code>'+(txt||'// code')+'</code></pre><p><br></p>')
}

function doEmj(e) {
  insertHTML(e)
  showEmj.value = false
}

function insertHTML(html) {
  if (!edRef.value) return
  edRef.value.focus()
  document.execCommand('insertHTML', false, html)
  onInput()
}

function clearAll() {
  if (edRef.value) { edRef.value.innerHTML=''; onInput() }
}
function getHTML() {
  return edRef.value?.innerHTML || ''
}
function setContent(html) {
  if (!edRef.value) return
  edRef.value.innerHTML = html
  onInput()
}

// ── 同步滚动 ──
function onEditorScroll() {
  if (!edRef.value) return
  const ratio = getScrollRatio()
  emit('scroll', ratio)
}

/** 获取当前滚动比例 0~1 */
function getScrollRatio() {
  const el = edRef.value
  if (!el) return 0
  const max = el.scrollHeight - el.clientHeight
  return max > 0 ? el.scrollTop / max : 0
}

/** 设置滚动比例 0~1 */
function scrollToRatio(ratio) {
  const el = edRef.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  el.scrollTop = Math.round(ratio * max)
}

defineExpose({ insertHTML, clear: clearAll, getContent: getHTML, setContent, getScrollRatio, scrollToRatio })

function onClick(e) {
  if (showEmj.value && !e.target.closest('.pop-emj') && !e.target.closest('.tb-btn')) {
    showEmj.value = false
  }
  if (showTableGrid.value && !e.target.closest('.pop-table-grid') && !e.target.closest('.tb-btn')) {
    showTableGrid.value = false
  }
  if (floatOn.value && !e.target.closest('.float-bar') && !e.target.closest('.editor')) {
    floatOn.value = false
    showTextPal.value = false
    showBgPal.value = false
  }
  // 点击浮动栏外部关闭弹出
  if (!e.target.closest('.fl-pop') && !e.target.closest('.fl-pal-btn') && !e.target.closest('.fl-tc-btn')) {
    showTextPal.value = false
  }
  if (!e.target.closest('.fl-pop') && !e.target.closest('.fl-pal-btn') && !e.target.closest('.fl-tc-btn')) {
    showBgPal.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClick))
</script>

<style scoped>
.editor-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.toolbar {
  width: 100%;
  max-width: 677px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  background: #fafbfc;
  border: 2px solid #e8eaed;
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  position: relative;
  flex-shrink: 0;
}
.tb-group { display: flex; align-items: center; gap: 1px; }
.tb-sep { width: 1px; height: 22px; background: #e0e2e5; margin: 0 4px; flex-shrink: 0; }
.tb-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 28px; padding: 0 6px;
  border: none; border-radius: 5px; background: none;
  cursor: pointer; font-size: 13px; color: #444; transition: all .1s;
}
.tb-btn:hover { background: #e8eaed; color: var(--theme-color,#0066ff); }
.tb-btn.on { background: rgba(0,102,255,0.1); color: var(--theme-color,#0066ff); }
.tb-sel {
  height: 26px; padding: 0 4px 0 8px;
  border: 1px solid #ddd; border-radius: 5px;
  font-size: 13px; color: #444; cursor: pointer; outline: none;
}
.tb-sel-sm {
  min-width: auto;
  padding: 0 3px 0 5px;
}
.editor {
  width: 100%; max-width: 677px;
  flex: 1;
  padding: 24px 32px;
  background: #fff; border: 2px solid #e8eaed;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  outline: none; font-size: 16px; line-height: 1.85; color: #333;
  overflow-y: auto;
  min-height: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.editor:focus {
  border-color: var(--theme-color,#0066ff);
  box-shadow: 0 0 0 3px rgba(0,102,255,0.08), 0 4px 16px rgba(0,102,255,0.12);
}
.editor:empty::before {
  content: '在此输入文章内容，或从左侧选择组件样式...';
  color: #ccc; font-style: italic; pointer-events: none;
}
.editor :deep(.st-quote) {
  border-left: 4px solid var(--theme-color,#0066ff);
  padding: 12px 16px; margin: 14px 0;
  background: #fafbfc; font-size: 15px; line-height: 1.7; color: #555;
  border-radius: 0 8px 8px 0;
}
.editor :deep(.st-hr) {
  border: none; height: 1px;
  background: linear-gradient(90deg,transparent,var(--theme-light,#e6f0ff),transparent);
  margin: 24px 0;
}
.editor :deep(.st-code) {
  background: #f5f6f7; border: 1px solid #e0e2e5;
  border-radius: 8px; padding: 14px 18px;
  font-family: 'Consolas','Monaco',monospace; font-size: 13px;
  line-height: 1.6; color: #333; overflow-x: auto; margin: 12px 0;
}
/* 编辑器内列表样式 */
.editor :deep(ul), .editor :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}
.editor :deep(ul) { list-style-type: disc; }
.editor :deep(ol) { list-style-type: decimal; }
.editor :deep(li) {
  line-height: 1.85;
  padding: 2px 0;
  font-size: 16px;
  color: #333;
}
/* ========== 编辑器内组件样式 ========== */
/* 编号标题 */
.editor :deep(.style-number-title) {
  display: flex; align-items: center; gap: 10px; margin: 18px 0 10px;
}
.editor :deep(.style-number-title .num) {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.editor :deep(.style-number-title .title-text) {
  font-size: 17px; font-weight: 700; color: #222;
}

/* 渐变标题 */
.editor :deep(.style-gradient-title) {
  margin: 22px 0 12px;
}
.editor :deep(.style-gradient-title h2) {
  font-size: 20px; font-weight: 700;
  background: linear-gradient(90deg, var(--theme-color, #0066ff), #a78bfa);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin: 0;
}

/* 标签标题（左竖线） */
.editor :deep(.style-tag-title) {
  margin: 22px 0 12px;
}
.editor :deep(.style-tag-title h2) {
  font-size: 18px; font-weight: 700;
  border-left: 4px solid var(--theme-color, #0066ff);
  padding-left: 12px; margin: 0; color: #333;
}

/* 胶囊标题 */
.editor :deep(.style-pill-title) {
  display: flex; align-items: center; gap: 8px;
  margin: 18px 0 10px;
}
.editor :deep(.style-pill-title .pill) {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; padding: 0 7px;
  border-radius: 11px;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.editor :deep(.style-pill-title .pill-text) {
  font-size: 16px; font-weight: 600; color: #222;
}

/* 软底胶囊标题 */
.editor :deep(.style-soft-pill-title) {
  margin: 16px 0 10px;
}
.editor :deep(.style-soft-pill-title > span:first-child) {
  background: #f0f0f0; color: #666;
  padding: 2px 10px; border-radius: 10px; font-size: 11px;
}

/* 左竖线标题 */
.editor :deep(.style-left-line-title) {
  margin: 20px 0 12px;
}
.editor :deep(.style-left-line-title h2) {
  display: inline-block; border-left: 4px solid var(--theme-color, #0066ff);
  padding-left: 12px; font-size: 17px; font-weight: 700;
  line-height: 1.4; color: #333; margin: 0;
}

/* 右竖线标题 */
.editor :deep(.style-right-line-title) {
  margin: 20px 0 12px; text-align: right;
}
.editor :deep(.style-right-line-title h2) {
  display: inline-block; border-right: 4px solid var(--theme-color, #0066ff);
  padding-right: 12px; font-size: 17px; font-weight: 700;
  line-height: 1.4; color: #333; margin: 0;
}

/* 居中标题 */
.editor :deep(.style-center-title) {
  margin: 20px 0 12px; text-align: center;
}
.editor :deep(.style-center-title h2) {
  font-size: 17px; font-weight: 700;
  display: inline-block; border-bottom: 2px solid var(--theme-color, #0066ff);
  padding-bottom: 8px; color: #333; margin: 0;
}

/* 圆形图标标题 */
.editor :deep(.style-circle-icon-title) {
  display: flex; align-items: center; gap: 10px; margin: 16px 0 10px;
}
.editor :deep(.style-circle-icon-title > span:first-child) {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 13px; flex-shrink: 0;
}
.editor :deep(.style-circle-icon-title > span:last-child) {
  font-size: 17px; font-weight: 700; color: #333;
}

/* 圆点横线 */
.editor :deep(.style-dot-line) {
  display: flex; align-items: center; gap: 8px; margin: 16px 0;
}
.editor :deep(.style-dot-line .dot) {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--theme-color, #0066ff); flex-shrink: 0;
}
.editor :deep(.style-dot-line .line) {
  flex: 1; height: 1px; background: #ddd;
}

/* 下划线标题 */
.editor :deep(.style-underline-title) {
  margin: 18px 0 10px;
}
.editor :deep(.style-underline-title > span) {
  font-size: 17px; font-weight: 700;
  border-bottom: 2px solid var(--theme-color, #0066ff);
  padding-bottom: 3px; color: #333;
}

/* 卡片标题 */
.editor :deep(.style-card-title) {
  margin: 16px 0 10px;
}

/* 步骤标题 */
.editor :deep(.style-step-title) {
  display: flex; align-items: center; gap: 10px; margin: 16px 0 10px;
}
.editor :deep(.style-step-title > b:first-child) {
  color: var(--theme-color, #0066ff); font-size: 18px; font-weight: 800;
}
.editor :deep(.style-step-title > span:last-child) {
  font-weight: 700; font-size: 16px; color: #222;
}

/* ---- 卡片 / 引用 / 提示等组件 ---- */
/* 卡片框 */
.editor :deep(.style-card-box) {
  background: var(--theme-light, #e6f0ff);
  border: 1px solid var(--theme-color, #0066ff);
  border-radius: 10px; padding: 16px 20px;
  margin: 14px 0; font-size: 14px; color: #444; line-height: 1.8;
}

/* 引用块 */
.editor :deep(.style-quote-block) {
  border-left: 4px solid var(--theme-color, #0066ff);
  padding: 12px 16px; margin: 14px 0;
  background: #fafbfc; font-size: 15px; line-height: 1.7;
  color: #555; border-radius: 0 8px 8px 0;
}

/* 提示框 */
.editor :deep(.style-info-box) {
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; padding: 14px 18px; margin: 14px 0;
  font-size: 14px; color: #555;
  border: 1px solid rgba(0, 102, 255, 0.1);
}

/* 免责声明 */
.editor :deep(.style-disclaimer) {
  background: #f8f8f8; border: 1px solid #eee;
  border-radius: 8px; padding: 14px 18px; margin: 14px 0;
  font-size: 13px; color: #888; line-height: 1.7;
}

/* 高亮块 */
.editor :deep(.style-highlight-block) {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 16px; margin: 14px 0;
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; font-size: 14px; color: #444; line-height: 1.8;
}

/* 分割线 */
.editor :deep(.style-divider) {
  margin: 20px 0;
}
.editor :deep(.style-divider > div) {
  height: 1px; background: var(--theme-light, #e6f0ff);
}

/* ═════════ 浮动快捷工具栏（深色主题） ═════════ */
.float-bar {
  display: flex; align-items: center;
  flex-wrap: wrap; gap: 4px;
  padding: 8px 12px;
  background: #2d3036; border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  max-width: 750px;
  animation: flIn 0.15s ease-out;
}
@keyframes flIn {
  from { opacity:0; transform:translateY(4px) scale(0.97); }
  to { opacity:1; transform:none; }
}

.fl-label {
  font-size: 11px; color: #9ca3af;
  white-space: nowrap; margin-right: 2px;
}

.fl-btn, .fl-sel {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 4px 10px; border: none; border-radius: 14px;
  font-size: 12px; cursor: pointer; transition: all .1s;
  white-space: nowrap;
}
.fl-btn { color: #e5e7eb; background: rgba(255,255,255,0.08); }
.fl-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }
.fl-btn.on { background: rgba(99,102,241,0.35); color: #a5b4fc; }

.fl-sel {
  height: 26px; min-width: 56px;
  background: #fff; color: #333; outline: none;
  font-size: 12px; border: none; border-radius: 14px;
  padding-left: 8px;
}
.fl-sel:focus { box-shadow: 0 0 0 2px rgba(99,102,241,0.4); }

/* 特殊按钮样式 */
.fl-tc-btn {
  background: rgba(99,102,241,0.2)!important; color: #a5b4fc!important;
  font-size: 11px!important;
}
.fl-tc-btn:hover { background: rgba(99,102,241,0.35)!important; color: #c7d2fe!important; }
.fl-pal-btn {
  background: rgba(255,255,255,0.06)!important; color: #b0b7c3!important;
  font-size: 11px!important;
  gap: 3px;
}
.fl-pal-btn:hover { background: rgba(255,255,255,0.14)!important; color: #e5e7eb!important; }
.fl-pal-label {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 4px;
  font-size: 10px; font-weight: 700;
  background: rgba(255,255,255,0.1); color: #fff;
}
.fl-sep {
  color: rgba(255,255,255,0.12); font-size: 14px;
  user-select: none; margin: 0 2px;
}

/* 分组布局 */
.fl-group {
  display: flex; align-items: center; gap: 2px;
}
.fl-group + .fl-group {
  border-left: 1px solid rgba(255,255,255,0.1);
  padding-left: 5px; margin-left: 2px;
}
.fl-g-label {
  font-size: 10px; color: #6b7280; font-weight: 600;
  margin-right: 3px; white-space: nowrap;
}
.fl-dot {
  width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px;
  flex-shrink: 0; border: 1px solid rgba(255,255,255,0.3);
}
.fl-comp { background: rgba(59,130,246,0.18)!important; color: #93c5fd!important; font-size: 9.5px!important; padding: 2px 5px!important; }
.fl-comp:hover { background: rgba(59,130,246,0.32)!important; color: #bfdbfe!important; }
.fl-clear { color: #fca5a5!important; background: rgba(239,68,68,0.15)!important; }
.fl-clear:hover { background: rgba(239,68,68,0.28)!important; color: #fecaca!important; }

/* 弹出面板 */
.fl-pop {
  position: absolute; top: 100%; left: 50%;
  margin-top: 4px; transform: translateX(-50%);
  background: #373b44; border-radius: 10px;
  padding: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  z-index: 10001; animation: flIn 0.12s ease-out;
  border: 1px solid rgba(255,255,255,0.08);
}
.fl-pop input[type="color"] {
  -webkit-appearance: none; appearance: none;
  width: 120px; height: 120px; border: none; border-radius: 8px; cursor: pointer;
  background: none; padding: 0;
}
.fl-pop input[type="color"]::-webkit-color-swatch-wrapper { padding: 4px; }
.fl-pop input[type="color"]::-webkit-color-swatch { border: none; border-radius: 6px; }
.fl-pop-pal {
  display: grid; grid-template-columns: repeat(6, 22px); gap: 4px;
  padding: 8px;
}
.fl-swatch {
  width: 22px; height: 22px; border: 1.5px solid rgba(255,255,255,0.15);
  border-radius: 5px; cursor: pointer; transition: all .1s;
  padding: 0;
}
.fl-swatch:hover { transform: scale(1.15); border-color: rgba(255,255,255,0.5); }
.pop-emj {
  position: absolute; top: 100%; left: 0;
  background: #fff; border: 1px solid #d9dce1;
  border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 8px; display: grid; grid-template-columns: repeat(10,1fr); gap: 2px;
  max-height: 200px; overflow-y: auto; z-index: 999;
}
.emj-item {
  width: 30px; height: 30px; border: none; border-radius: 5px;
  background: none; cursor: pointer; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
}
.emj-item:hover { background: #e8eaed; }
/* 表格网格选择弹出 */
.pop-table-grid {
  position: absolute; top: 100%; left: 0;
  background: #fff; border: 1px solid #d9dce1;
  border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  padding: 12px; z-index: 999;
}
.table-grid-hint {
  font-size: 12px; color: #666; margin-bottom: 8px;
  text-align: center;
}
.table-grid-cells {
  display: grid; grid-template-columns: repeat(6, 22px); gap: 3px;
}
.tg-cell {
  width: 22px; height: 22px; border: 1px solid #ddd;
  border-radius: 3px; background: #fff; cursor: pointer;
  padding: 0; transition: all 0.08s;
}
.tg-cell:hover { border-color: var(--theme-color,#0066ff); }
.tg-cell.active {
  background: rgba(0,102,255,0.15);
  border-color: var(--theme-color,#0066ff);
}
</style>

<!-- 非 scoped 样式：供动态插入的组件使用（scoped 样式无法命中动态 DOM） -->
<style>
/* ========== 编辑器内组件样式（非 scoped，动态 DOM 可命中） ========== */
.editor .style-number-title {
  display: flex; align-items: center; gap: 10px; margin: 18px 0 10px;
}
.editor .style-number-title .num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.editor .style-number-title .title-text {
  font-size: 17px; font-weight: 700; color: #222;
}

/* 渐变标题 */
.editor .style-gradient-title { margin: 22px 0 12px; }
.editor .style-gradient-title h2 {
  font-size: 20px; font-weight: 700;
  background: linear-gradient(90deg, var(--theme-color, #0066ff), #a78bfa);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin: 0;
}

/* 标签标题（左竖线） */
.editor .style-tag-title { margin: 22px 0 12px; }
.editor .style-tag-title h2 {
  font-size: 18px; font-weight: 700;
  border-left: 4px solid var(--theme-color, #0066ff);
  padding-left: 12px; margin: 0; color: #333;
}

/* 胶囊标题 */
.editor .style-pill-title {
  display: flex; align-items: center; gap: 8px; margin: 18px 0 10px;
}
.editor .style-pill-title .pill {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; padding: 0 7px;
  border-radius: 11px;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.editor .style-pill-title .pill-text {
  font-size: 16px; font-weight: 600; color: #222;
}

/* 软底胶囊标题 */
.editor .style-soft-pill-title { margin: 16px 0 10px; }

/* 左竖线标题 */
.editor .style-left-line-title { margin: 20px 0 12px; }
.editor .style-left-line-title h2 {
  display: inline-block; border-left: 4px solid var(--theme-color, #0066ff);
  padding-left: 12px; font-size: 17px; font-weight: 700;
  line-height: 1.4; color: #333; margin: 0;
}

/* 右竖线标题 */
.editor .style-right-line-title { margin: 20px 0 12px; text-align: right; }
.editor .style-right-line-title h2 {
  display: inline-block; border-right: 4px solid var(--theme-color, #0066ff);
  padding-right: 12px; font-size: 17px; font-weight: 700;
  line-height: 1.4; color: #333; margin: 0;
}

/* 居中标题 */
.editor .style-center-title { margin: 20px 0 12px; text-align: center; }
.editor .style-center-title h2 {
  font-size: 17px; font-weight: 700;
  display: inline-block; border-bottom: 2px solid var(--theme-color, #0066ff);
  padding-bottom: 8px; color: #333; margin: 0;
}

/* 圆形图标标题 */
.editor .style-circle-icon-title {
  display: flex; align-items: center; gap: 10px; margin: 16px 0 10px;
}
.editor .style-circle-icon-title > span:first-child {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 13px; flex-shrink: 0;
}

/* 圆点横线 */
.editor .style-dot-line {
  display: flex; align-items: center; gap: 8px; margin: 16px 0;
}
.editor .style-dot-line .dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--theme-color, #0066ff); flex-shrink: 0;
}
.editor .style-dot-line .line { flex: 1; height: 1px; background: #ddd; }

/* 下划线标题 */
.editor .style-underline-title { margin: 18px 0 10px; }
.editor .style-underline-title > span {
  font-size: 17px; font-weight: 700;
  border-bottom: 2px solid var(--theme-color, #0066ff);
  padding-bottom: 3px; color: #333;
}

/* 卡片标题 */
.editor .style-card-title { margin: 16px 0 10px; }

/* 步骤标题 */
.editor .style-step-title {
  display: flex; align-items: center; gap: 10px; margin: 16px 0 10px;
}
.editor .style-step-title > b:first-child {
  color: var(--theme-color, #0066ff); font-size: 18px; font-weight: 800;
}

/* ---- 内容组件 ---- */
/* 卡片框 */
.editor .style-card-box {
  background: var(--theme-light, #e6f0ff);
  border: 1px solid var(--theme-color, #0066ff);
  border-radius: 10px; padding: 16px 20px;
  margin: 14px 0; font-size: 14px; color: #444; line-height: 1.8;
}

/* 引用块 */
.editor .style-quote-block {
  border-left: 4px solid var(--theme-color, #0066ff);
  padding: 12px 16px; margin: 14px 0;
  background: #fafbfc; font-size: 15px; line-height: 1.7;
  color: #555; border-radius: 0 8px 8px 0;
}

/* 提示框 */
.editor .style-info-box {
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; padding: 14px 18px; margin: 14px 0;
  font-size: 14px; color: #555;
  border: 1px solid rgba(0, 102, 255, 0.1);
}

/* 免责声明 */
.editor .style-disclaimer {
  background: #f8f8f8; border: 1px solid #eee;
  border-radius: 8px; padding: 14px 18px; margin: 14px 0;
  font-size: 13px; color: #888; line-height: 1.7;
}

/* 高亮块 */
.editor .style-highlight-block {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 16px; margin: 14px 0;
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; font-size: 14px; color: #444; line-height: 1.8;
}

/* 分割线 */
.editor .style-divider { margin: 20px 0; height: 1px; background: var(--theme-light, #e6f0ff); }
</style>

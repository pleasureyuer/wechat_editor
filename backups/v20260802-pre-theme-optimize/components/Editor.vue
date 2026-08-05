<template>
  <div class="editor-shell">
    <!-- 格式工具栏（精简：撤销/重做 + 间隔 + 清空） -->
    <div class="toolbar">
      <div class="tb-group">
        <button class="tb-btn tb-btn-lg" title="撤销" @click="saveHistory(); undoHistory(); edRef?.focus(); sync()">↶ 撤销</button>
        <button class="tb-btn tb-btn-lg" title="重做" @click="saveHistory(); redoHistory(); edRef?.focus(); sync()">↷ 重做</button>
      </div>
      <div class="tb-spacer"></div>
      <div class="tb-group">
        <button class="tb-btn tb-btn-lg tb-btn-clear" title="清空编辑区" @click="emit('clear')">🗑 清空</button>
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

    <!-- 移动端悬浮球（点击唤出排版抽屉） -->
    <div v-show="mobileBallOn" class="fl-mobile-ball" :style="mobileBallPos" @mousedown.prevent @touchstart.prevent="openMobileDrawer">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    </div>

    <!-- 浮动快捷工具栏 -->
    <div v-show="floatOn" class="float-bar" :style="floatPos" @mousedown.prevent>
      <!-- 移动端抽屉头部 -->
      <div class="fl-mobile-header">
        <div class="fl-mobile-title-row">
          <span class="fl-mobile-title">排版工具</span>
          <button class="fl-mobile-close" @click="closeMobileDrawer" aria-label="关闭">✕</button>
        </div>
        <div class="fl-mobile-tabs">
          <button class="fl-mobile-tab" :class="{on:floatMode==='text'}" @click="floatMode='text'">文字</button>
          <button class="fl-mobile-tab" :class="{on:floatMode==='block'}" @click="floatMode='block'">块</button>
        </div>
      </div>
      <div class="fl-mobile-body">
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
        <!-- 第1组：标题（与左侧「标题样式」面板、移动端弹窗完全一致） -->
        <div class="fl-group">
          <span class="fl-g-label">标题</span>
          <button v-for="c in TITLE_COMPONENTS" :key="c.type" class="fl-btn fl-comp"
            @click="applyBlockStyle(c.type)" @contextmenu.prevent="emitInsert(c.type)">{{ c.icon }} {{ c.name }}</button>
        </div>
        <!-- 第2组：卡片（与左侧「卡片」面板、移动端弹窗完全一致） -->
        <div class="fl-group">
          <span class="fl-g-label">卡片</span>
          <button v-for="c in cardComponentsFiltered" :key="c.type" class="fl-btn fl-comp"
            @click="c.type === 'topicSectionCard' ? emitInsert(c.type) : applyBlockStyle(c.type)"
            @contextmenu.prevent="emitInsert(c.type)">{{ c.icon }} {{ c.name }}</button>
        </div>
        <!-- 第3组：列表 & 表格 -->
        <div class="fl-group">
          <span class="fl-g-label">列表</span>
          <button v-for="c in LIST_COMPONENTS" :key="c.type" class="fl-btn fl-comp"
            @click="emitInsert(c.type)" @contextmenu.prevent="emitInsert(c.type)">{{ c.icon }} {{ c.name }}</button>
          <span class="fl-g-label" style="margin-left:4px">表格</span>
          <button v-for="c in TABLE_COMPONENTS" :key="c.type" class="fl-btn fl-comp"
            @click="emitInsert(c.type)" @contextmenu.prevent="emitInsert(c.type)">{{ c.icon }} {{ c.name }}</button>
        </div>
        <!-- 第4组：分割线（与左侧「分割线」面板、移动端弹窗完全一致） -->
        <div class="fl-group">
          <span class="fl-g-label">分割</span>
          <button v-for="c in DIVIDER_COMPONENTS" :key="c.type" class="fl-btn fl-comp"
            @click="emitInsert(c.type)" @contextmenu.prevent="emitInsert(c.type)">{{ c.icon }} {{ c.name }}</button>
        </div>
        <!-- 第5组：互动（与左侧「互动」面板一致，均为插入型装饰块） -->
        <div class="fl-group">
          <span class="fl-g-label">互动</span>
          <button v-for="c in interactiveComponents" :key="c.type" class="fl-btn fl-comp"
            @click="emitInsert(c.type)" @contextmenu.prevent="emitInsert(c.type)">{{ c.icon }} {{ c.name }}</button>
        </div>
        <!-- 操作 -->
        <div class="fl-group">
          <button class="fl-btn fl-comp fl-clear" @click="clearBlockAtCursor(); floatOn=false" title="清除光标所在段落的组件样式，还原为普通文本">↺ 清除段落</button>
        </div>
      </template>
      </div><!-- /.fl-mobile-body -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import { TITLE_COMPONENTS, CARD_COMPONENTS, LIST_COMPONENTS, TABLE_COMPONENTS, DIVIDER_COMPONENTS, INTERACTIVE_COMPONENTS } from '../constants/catalog.js'

const store = useEditorStore()
// 卡片面板：排除互动组件（互动组件归入「互动」分组单独展示）
const cardComponentsFiltered = CARD_COMPONENTS.filter(
  c => c.type !== 'qaBox' && c.type !== 'nextPreview' && c.type !== 'zenQuote'
);
const interactiveComponents = INTERACTIVE_COMPONENTS;
const edRef = ref(null)
const fontSize = ref('17px')
const letterSpacing = ref('')
const lineHeight = ref('')
const showTableGrid = ref(false)
const tableGridCols = ref(3)
const tableGridRows = ref(3)
const floatOn = ref(false)
const floatPos = ref({})
const floatMode = ref('text') // 'text' | 'block'（block 已合并3组：标题/卡片/分割）
const mobileBallOn = ref(false)
const mobileBallPos = ref({})
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

// ── 自定义撤销/重做历史栈 ──
const MAX_HISTORY = 50
const historyStack = ref([])
const historyIndex = ref(-1)
let historyTimer = null

function saveHistory() {
  if (!edRef.value) return
  const html = edRef.value.innerHTML
  // 跳过与上次相同的快照
  if (historyIndex.value >= 0 && historyStack.value[historyIndex.value] === html) return
  // 丢弃当前位置之后的旧记录
  historyStack.value.splice(historyIndex.value + 1)
  historyStack.value.push(html)
  // 限制长度
  if (historyStack.value.length > MAX_HISTORY) {
    historyStack.value.shift()
  }
  historyIndex.value = historyStack.value.length - 1
}

function undoHistory() {
  if (!edRef.value || historyIndex.value <= 0) return
  historyIndex.value--
  edRef.value.innerHTML = historyStack.value[historyIndex.value]
  store.editorContent = edRef.value.innerHTML
}

function redoHistory() {
  if (!edRef.value || historyIndex.value >= historyStack.value.length - 1) return
  historyIndex.value++
  edRef.value.innerHTML = historyStack.value[historyIndex.value]
  store.editorContent = edRef.value.innerHTML
}

// 外部调用时强制保存当前状态再修改
function forceSaveBeforeChange() {
  store.editorContent = edRef.value?.innerHTML || ''
  saveHistory()
}

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
  // 防抖保存历史（用户连续输入时只存一次）
  clearTimeout(historyTimer)
  historyTimer = setTimeout(saveHistory, 500)
}

// ── 移动端选中检测 ──
const isMobile = ref(typeof window !== 'undefined' && window.innerWidth <= 768)
let selectionTimer = null
function onSelectionChange() {
  // 防抖：选中过程中频繁触发，只取最后一次稳定状态
  clearTimeout(selectionTimer)
  selectionTimer = setTimeout(() => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    // 只处理编辑器内的选区
    if (!edRef.value) return
    const node = sel.anchorNode
    if (!edRef.value.contains(node)) {
      // 选区不在编辑器内 → 关闭浮动栏和悬浮球
      floatOn.value = false
      mobileBallOn.value = false
      return
    }
    onSelect()
  }, 250)
}

function onKey(e) {
  if (e.ctrlKey || e.metaKey) {
    const k = e.key.toLowerCase()
    if (k==='b') { e.preventDefault(); run('bold') }
    if (k==='i') { e.preventDefault(); run('italic') }
    if (k==='u') { e.preventDefault(); run('underline') }
    if (k==='z') {
      e.preventDefault()
      saveHistory() // 先保存当前状态
      e.shiftKey ? redoHistory() : undoHistory()
      edRef.value?.focus()
      sync()
      return
    }
    if (k==='y') { e.preventDefault(); saveHistory(); redoHistory(); edRef.value?.focus(); sync(); return }
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
    if (isMobile.value) {
      // 移动端：显示悬浮球，不直接弹抽屉
      floatOn.value = false
      mobileBallOn.value = true
      const r = sel.getRangeAt(0)
      const rect = r.getBoundingClientRect()
      mobileBallPos.value = {
        position: 'fixed',
        top: Math.max(8, rect.top + rect.height/2 - 18) + 'px',
        right: '4px',
        zIndex: 9999
      }
    } else {
      floatOn.value = true
      const r = sel.getRangeAt(0)
      const rect = r.getBoundingClientRect()
      floatPos.value = {
        position: 'fixed',
        left: Math.min(rect.left + rect.width/2 - 200, window.innerWidth-540) + 'px',
        top: (rect.top - 50) + 'px',
        zIndex: 10000
      }
    }
    // 检测当前字号
    detectFontSize(sel)
  } else if (edRef.value && edRef.value.contains(sel?.focusNode)) {
    // 光标在编辑器内，没有选文字 → 块模式
    floatMode.value = 'block'
    if (isMobile.value) {
      // 移动端：显示悬浮球，不直接弹抽屉
      floatOn.value = false
      mobileBallOn.value = true
      try {
        const r = sel.getRangeAt(0)
        const rect = r.getBoundingClientRect()
        mobileBallPos.value = {
          position: 'fixed',
          top: Math.max(8, rect.top + rect.height/2 - 18) + 'px',
          right: '4px',
          zIndex: 9999
        }
      } catch {
        mobileBallPos.value = { position:'fixed', bottom:'72px', right:'16px', zIndex:9999 }
      }
    } else {
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
    }
  } else {
    floatOn.value = false
    mobileBallOn.value = false
  }
  sync()
}

// 移动端：点击悬浮球 → 打开抽屉
function openMobileDrawer() {
  mobileBallOn.value = false
  floatOn.value = true
  floatPos.value = { position: 'fixed', top: '0', right: '0', bottom: '0', left: 'auto', width: '25%', maxWidth: '140px', zIndex: 10000 }
}

// 移动端：关闭抽屉 → 恢复悬浮球（如果还在编辑器内）
function closeMobileDrawer() {
  floatOn.value = false
  showTextPal.value = false
  showBgPal.value = false
  const sel = window.getSelection()
  if (sel && edRef.value && edRef.value.contains(sel.focusNode)) {
    mobileBallOn.value = true
    try {
      const r = sel.getRangeAt(0)
      const rect = r.getBoundingClientRect()
      mobileBallPos.value = {
        position: 'fixed',
        top: Math.max(8, rect.top + rect.height/2 - 18) + 'px',
        right: '4px',
        zIndex: 9999
      }
    } catch {
      mobileBallPos.value = { position:'fixed', bottom:'72px', right:'16px', zIndex:9999 }
    }
  }
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
const emit = defineEmits(['insert-component', 'scroll', 'float-change', 'clear'])

// float-bar 可见性变化时通知父组件（移动端用于关闭浮动球抽屉）
watch(floatOn, (val) => {
  emit('float-change', val)
})

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
  let stepNum
  if (compType === 'circleStepBadge') {
    // 如果目标已是徽章标题，保留原编号
    const existingNumEl = targetEl.querySelector('.csb-num')
    if (existingNumEl) {
      const n = parseInt(existingNumEl.textContent.trim(), 10)
      if (!isNaN(n)) stepNum = n
    }
    if (!stepNum) stepNum = store.getNextStepNum()
  }
  const compHTML = store.componentHTML({ type: compType }, currentText, stepNum)

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

// 清除光标所在段落的组件样式（还原为纯文本 <p>）
// 三种场景：① 组件块 → 去组件还原纯文本  ② 普通段落 → 清除内联样式  ③ 空光标 → 安全跳过
function clearBlockAtCursor() {
  if (!edRef.value) return;
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  let node = sel.getRangeAt(0).startContainer;
  if (node.nodeType === 3) node = node.parentNode;

  // 场景1：找最近的 editable-block 组件容器
  let block = node;
  while (block && block !== edRef.value) {
    if (block.dataset && block.dataset.style) break;
    block = block.parentNode;
  }
  if (block && block.dataset && block.dataset.style) {
    const text = block.textContent.trim();
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      block.replaceWith(p);
      onInput();
      return;
    }
  }

  // 场景2：找最近的块级元素（h/p/section/div/li）
  let el = node;
  while (el && el !== edRef.value && !/[Hh][1-6]|^P$|^SECTION$|^DIV$|^LI$/.test(el.nodeName)) {
    el = el.parentNode;
  }
  if (el && el !== edRef.value) {
    const text = el.textContent.trim();
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      el.replaceWith(p);
    } else {
      // 空段落：直接清空节点内容
      el.innerHTML = '';
    }
    onInput();
    return;
  }

  // 场景3：光标在编辑器根节点内但不是某个块内（光标在 contenteditable 根的空白区域）
  // 尝试清除选区内的内联格式
  document.execCommand('removeFormat');
  onInput();
}

defineExpose({ insertHTML, clear: clearAll, getContent: getHTML, setContent, run, applyThemeColor, clearBlockAtCursor, getScrollRatio, scrollToRatio, forceSaveBeforeChange })

function onClick(e) {
  if (showTableGrid.value && !e.target.closest('.pop-table-grid') && !e.target.closest('.tb-btn')) {
    showTableGrid.value = false
  }
  if (floatOn.value && !e.target.closest('.float-bar') && !e.target.closest('.editor') && !e.target.closest('.fl-mobile-ball')) {
    closeMobileDrawer()
  }
  // 点击编辑器外部关闭悬浮球
  if (mobileBallOn.value && !e.target.closest('.editor') && !e.target.closest('.fl-mobile-ball')) {
    mobileBallOn.value = false
  }
  // 点击浮动栏外部关闭弹出
  if (!e.target.closest('.fl-pop') && !e.target.closest('.fl-pal-btn') && !e.target.closest('.fl-tc-btn')) {
    showTextPal.value = false
  }
  if (!e.target.closest('.fl-pop') && !e.target.closest('.fl-pal-btn') && !e.target.closest('.fl-tc-btn')) {
    showBgPal.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClick)
  // 移动端选中变化监听（mouseup 在移动端不可靠）
  document.addEventListener('selectionchange', onSelectionChange)
  // 窗口大小变化时更新 isMobile
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth <= 768 })
  // 初始化历史快照
  setTimeout(() => { if (edRef.value) saveHistory() }, 100)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClick)
  document.removeEventListener('selectionchange', onSelectionChange)
  clearTimeout(selectionTimer)
})
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
.tb-btn-lg {
  min-width: 64px; height: 34px; padding: 0 14px;
  font-size: 13px; font-weight: 500;
  border: 1px solid #d9dce1; background: #fff; border-radius: 7px;
  gap: 4px;
}
.tb-btn-lg:hover { border-color: var(--theme-color,#0066ff); color: var(--theme-color,#0066ff); background: var(--theme-light,#f0f7ff); }
.tb-btn-lg:active { transform: scale(0.96); }
.tb-btn-clear { color: #999; border-color: #e8eaed; }
.tb-btn-clear:hover { color: #e74c3c; border-color: #e74c3c; background: #fff5f5; }
.tb-spacer { flex: 1; }
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

/* 箭头标题 */
.editor :deep(.style-arrow-title) {
  margin: 18px 0 10px;
}
.editor :deep(.style-arrow-title .arrow-icon) {
  color: var(--theme-color, #0066ff); font-size: 16px; font-weight: 700;
}
.editor :deep(.style-arrow-title .arrow-text) {
  font-size: 16px; font-weight: 700; color: #222; margin-left: 8px;
}

/* 双竖线标题 */
.editor :deep(.style-double-line-title) {
  text-align: center; margin: 20px 0 12px;
}
.editor :deep(.style-double-line-title h2) {
  display: inline-block; border-left: 4px solid var(--theme-color, #0066ff);
  border-right: 4px solid var(--theme-color, #0066ff);
  padding: 4px 12px; font-size: 17px; font-weight: 700; color: #333; margin: 0;
}

/* 菱形标题 */
.editor :deep(.style-diamond-title) {
  display: flex; align-items: center; gap: 8px; margin: 16px 0 10px;
}
.editor :deep(.style-diamond-title > span:first-child) {
  color: var(--theme-color, #0066ff); font-size: 14px; flex-shrink: 0;
}
.editor :deep(.style-diamond-title > span:last-child) {
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

/* ═════ 易命术系列组件（编辑区样式） ═════ */
.editor :deep(.style-shu-name) {
  text-align: center; margin: 32px 0 24px;
}
.editor :deep(.style-shu-name span) {
  display: block; font-size: 16px; font-weight: 700;
  color: var(--theme-color,#B0392E); line-height: 1.7; letter-spacing: 1px;
}

.editor :deep(.style-series-opening),
.editor :deep(.style-series-label) {
  text-align: center;
}
.editor :deep(.style-series-opening span),
.editor :deep(.style-series-label span) {
  font-size: 13px; font-weight: 500; letter-spacing: 3px;
  color: var(--volume-color,#C8A15A);
}

.editor :deep(.style-vol-block) {
  display: flex; align-items: center; gap: 10px; margin: 20px 0 10px;
}

.editor :deep(.style-card-volume) {
  background: #FBF9F5; border: 1px solid #EEE5D9;
  border-radius: 8px; padding: 16px 18px; margin: 20px 0;
  font-size: 14px; color: #4A4A4A; line-height: 1.8;
}

/* 高亮块 */
.editor :deep(.style-highlight-block) {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 16px; margin: 14px 0;
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; font-size: 14px; color: #444; line-height: 1.8;
}

/* 金句卡片 */
.editor :deep(.style-golden-quote) {
  text-align: center; padding: 24px 20px; margin: 20px 0;
  background: var(--theme-light, #e6f0ff); border-radius: 8px;
}
.editor :deep(.style-golden-quote > div:first-child) {
  font-size: 32px; color: var(--theme-color, #0066ff); line-height: 1;
  margin-bottom: 8px; font-family: serif;
}
.editor :deep(.style-golden-quote > div:last-child) {
  font-size: 16px; color: #333; line-height: 1.8;
}

/* 导语段落 */
.editor :deep(.style-lead-paragraph) {
  background: var(--theme-light, #e6f0ff);
  border-left: 4px solid var(--theme-color, #0066ff);
  padding: 14px 18px; margin: 16px 0;
  font-size: 15px; color: #555; line-height: 1.8;
}

/* 列表组件 */
.editor :deep(.style-icon-list) {
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; padding: 14px 18px; margin: 14px 0;
}
.editor :deep(.style-icon-list > div) {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 5px 0; font-size: 14px; color: #333; line-height: 1.7;
}
.editor :deep(.style-num-list > div) {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid #eee;
}
.editor :deep(.style-color-card-list > div) {
  display: flex; align-items: stretch;
  margin: 6px 0; border-radius: 4px; overflow: hidden;
}
/* 表格组件 */
.editor :deep(.style-simple-table table),
.editor :deep(.style-stri-table table),
.editor :deep(.style-border-table table),
.editor :deep(.style-stat-card table) {
  width: 100%; border-collapse: collapse; font-size: 14px;
}
.editor :deep(.style-simple-table) {
  margin: 16px 0; overflow: hidden; border-radius: 6px;
}
.editor :deep(.style-simple-table th) {
  padding: 10px 12px; text-align: left; font-weight: 700;
  color: #fff; background: var(--theme-color, #0066ff);
}
.editor :deep(.style-simple-table td) {
  padding: 9px 12px; color: #333; border: 1px solid #e5e7eb;
}
.editor :deep(.style-stri-table) { margin: 16px 0; }
.editor :deep(.style-stri-table th) {
  padding: 10px 12px; text-align: left; font-weight: 700;
  color: var(--theme-color, #0066ff);
  background: var(--theme-light, #e6f0ff);
  border-bottom: 2px solid var(--theme-color, #0066ff);
}
.editor :deep(.style-stri-table tr:nth-child(even) td) { background: #f8f9fa; }
.editor :deep(.style-stri-table td) { padding: 9px 12px; color: #333; }
.editor :deep(.style-border-table) { margin: 16px 0; }
.editor :deep(.style-border-table th) {
  padding: 10px 12px; text-align: center; font-weight: 700;
  color: var(--theme-color, #0066ff);
  background: var(--theme-light, #e6f0ff); border: 1px solid #ddd;
}
.editor :deep(.style-border-table td) {
  padding: 9px 12px; text-align: center; color: #444; border: 1px solid #ddd;
}
.editor :deep(.style-stat-card) {
  margin: 16px 0; border-radius: 8px; overflow: hidden;
  border: 1px solid #eee; background: #fff;
}
.editor :deep(.style-stat-card td) {
  padding: 16px 8px; text-align: center; border-right: 1px solid #eee;
}
.editor :deep(.style-stat-card .stat-num) {
  font-size: 26px; font-weight: 800; color: var(--theme-color, #0066ff);
  display: block; line-height: 1.2;
}
.editor :deep(.style-stat-card .stat-label) {
  font-size: 12px; color: #888; display: block; margin-top: 4px;
}

/* 花体分割线 */
.editor :deep(.style-divider-ornate) {
  text-align: center; margin: 24px 0;
  color: #ccc; font-size: 14px; letter-spacing: 8px;
}

/* 分割线 */
.editor :deep(.style-divider) {
  margin: 20px 0;
}
.editor :deep(.style-divider > div) {
  height: 1px; background: var(--theme-light, #e6f0ff);
}

/* ═════════ 新增标题组件样式 ═════════ */
/* 图1：圆点+框线标题 */
.editor :deep(.style-dot-line-title) {
  display: inline-block !important;
  position: relative;
  padding: 10px 22px;
  border: 2px solid;
  border-color: var(--theme-color, #0066ff);
  border-radius: 6px;
  margin: 18px auto;
  text-align: center;
}
/* 图2下：深色底条标题 */
.editor :deep(.style-solid-bar-title) {
  border-radius: 4px; padding: 10px 16px; margin: 14px 0;
  background-color: #3a3a3a;
}
.editor :deep(.style-solid-bar-title .sb-text) {
  font-size: 15px; font-weight: 700; color: #fff; letter-spacing: 1px;
}
/* 图3：菱形+延伸线标题 */
.editor :deep(.style-diamond-line-title) {
  margin: 20px 0;
}
.editor :deep(.style-diamond-line-title table) { width: 100%; border-collapse: collapse; }
.editor :deep(.style-diamond-line-title td) {
  vertical-align: bottom; padding: 0 8px;
  border-bottom: 1px solid var(--theme-light, #e6f0ff);
}
.editor :deep(.style-diamond-line-title td:nth-child(2)) { border-bottom: none; white-space: nowrap; }
/* 图4：圆形步骤徽章 */
.editor :deep(.style-circle-step-badge) {
  margin: 22px 0;
}
.editor :deep(.style-circle-step-badge table) { width: 100%; border-collapse: collapse; }
.editor :deep(.style-circle-step-badge td) {
  vertical-align: bottom; padding: 0 10px; text-align: center;
  border-bottom: 1px solid #ddd;
}
.editor :deep(.style-circle-step-badge td:nth-child(2)) { border-bottom: none; }

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
  display: flex; align-items: center; gap: 2px 4px;
  flex-wrap: wrap;
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
.fl-clear { background: rgba(248,113,113,0.2)!important; color: #fca5a5!important; }
.fl-clear:hover { background: rgba(248,113,113,0.35)!important; color: #fecaca!important; }
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

/* ═════ 易命术系列组件（非 scoped 备份） ═════ */
.editor .style-shu-name {
  text-align: center; margin: 32px 0 24px;
}
.editor .style-shu-name span {
  display: block; font-size: 16px; font-weight: 700;
  color: var(--theme-color,#B0392E); line-height: 1.7; letter-spacing: 1px;
}
.editor .style-series-opening,
.editor .style-series-label { text-align: center; }
.editor .style-series-opening span,
.editor .style-series-label span {
  font-size: 13px; font-weight: 500; letter-spacing: 3px;
  color: var(--volume-color,#C8A15A);
}
.editor .style-vol-block {
  display: flex; align-items: center; gap: 10px; margin: 20px 0 10px;
}
.editor .style-card-volume {
  background: #FBF9F5; border: 1px solid #EEE5D9;
  border-radius: 8px; padding: 16px 18px; margin: 20px 0;
  font-size: 14px; color: #4A4A4A; line-height: 1.8;
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

/* 移动端抽屉头部：桌面端隐藏 */
.fl-mobile-header { display: none; }

/* ═════════ 移动端 float-bar 右侧抽屉样式 ═════════ */
@media (max-width: 768px) {
  /* 工具栏：单行，不滚动 */
  .toolbar {
    flex-wrap: nowrap;
    overflow: hidden;
    padding: 6px 10px;
    gap: 4px;
    justify-content: flex-start;
  }
  .tb-btn-lg {
    min-width: 56px; height: 36px; font-size: 13px;
    padding: 0 12px;
  }

  /* float-bar 改为右侧抽屉弹窗 */
  .float-bar {
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;
    gap: 0;
    background: #1f2937;
    border-radius: 0;
    box-shadow: -4px 0 20px rgba(0,0,0,0.25);
    padding: 0;
    overflow: hidden;
    animation: flSlideIn 0.18s ease-out;
  }
  @keyframes flSlideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: none; }
  }

  /* 抽屉头部 */
  .fl-mobile-header {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    padding: 12px 14px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .fl-mobile-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .fl-mobile-title {
    font-size: 16px;
    font-weight: 600;
    color: #f3f4f6;
  }
  .fl-mobile-close {
    background: transparent;
    border: none;
    color: #9ca3af;
    font-size: 18px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .fl-mobile-close:active { background: rgba(255,255,255,0.08); color: #fff; }
  .fl-mobile-tabs {
    display: flex;
    gap: 8px;
  }
  .fl-mobile-tab {
    flex: 1;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: rgba(255,255,255,0.08);
    color: #d1d5db;
    font-size: 13px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .fl-mobile-tab.on {
    background: var(--theme-color, #3b82f6);
    color: #fff;
  }

  /* 抽屉内容区 */
  .fl-mobile-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    padding: 12px 14px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    -webkit-overflow-scrolling: touch;
  }

  /* 文字模式：垂直排列 */
  .fl-mobile-body > .fl-label,
  .fl-mobile-body > .fl-sel,
  .fl-mobile-body > .fl-btn,
  .fl-mobile-body > .fl-sep {
    align-self: flex-start;
  }
  .fl-mobile-body > .fl-sep { display: none; }
  .fl-mobile-body > .fl-label {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: -6px;
  }

  /* 按钮适配窄宽度 */
  .fl-btn, .fl-sel {
    min-height: 36px;
    font-size: 11px !important;
    padding: 6px 6px !important;
    border-radius: 6px;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
  }
  .fl-sel {
    height: 36px;
    background: rgba(255,255,255,0.08);
    color: #e5e7eb;
  }
  .fl-comp {
    font-size: 10px !important;
    padding: 6px 4px !important;
    line-height: 1.3;
  }

  /* 分组垂直排列 */
  .fl-group {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .fl-group + .fl-group {
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding-left: 0;
    padding-top: 8px;
    margin-left: 0;
    margin-top: 2px;
  }
  .fl-g-label {
    font-size: 10px;
    color: #9ca3af;
    margin-bottom: 2px;
  }

  /* 色板弹出改为抽屉内嵌 */
  .fl-mobile-body .fl-pop {
    position: static;
    transform: none;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    background: rgba(0,0,0,0.15);
    border: none;
    box-shadow: none;
  }
  .fl-pop-pal {
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    justify-content: center;
  }
  .fl-swatch {
    width: 100%;
    aspect-ratio: 1;
    height: auto;
  }

  /* 主题色按钮 */
  .fl-tc-btn {
    font-size: 11px !important;
    padding: 6px 6px !important;
  }
  .fl-dot {
    width: 10px;
    height: 10px;
  }
}

/* ═════════ 移动端悬浮球 ═════════ */
.fl-mobile-ball {
  display: none;
}
  @media (max-width: 768px) {
  .fl-mobile-ball {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--theme-color, #3b82f6);
    color: #fff;
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    animation: ballPop 0.15s ease-out;
  }
  @keyframes ballPop {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }
}
</style>

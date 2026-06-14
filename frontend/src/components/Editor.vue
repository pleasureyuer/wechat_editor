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
        <button class="tb-btn" @click="run('justifyLeft')">左</button>
        <button class="tb-btn" @click="run('justifyCenter')">中</button>
        <button class="tb-btn" @click="run('justifyRight')">右</button>
        <button class="tb-btn" @click="run('justifyFull')">两</button>
      </div>
      <div class="tb-sep"></div>
      <div class="tb-group">
        <button class="tb-btn" @click="run('insertUnorderedList')">•列</button>
        <button class="tb-btn" @click="run('insertOrderedList')">1列</button>
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
    ></div>

    <!-- 浮动工具栏 -->
    <div v-show="floatOn" class="float-bar" :style="floatPos">
      <button class="fb" @click="run('bold')"><b>B</b></button>
      <button class="fb" @click="run('italic')"><i>I</i></button>
      <button class="fb" @click="run('underline')"><u>U</u></button>
      <span class="fb-sep"></span>
      <button class="fb" @click="insertLink">🔗</button>
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
const sizeList = ['12px','13px','14px','15px','16px','17px','18px','20px','24px','28px','32px']

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
  if (txt && edRef.value?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    floatOn.value = true
    const r = sel.getRangeAt(0)
    const rect = r.getBoundingClientRect()
    floatPos.value = {
      position: 'fixed',
      left: Math.min(rect.left + rect.width/2 - 60, window.innerWidth-200) + 'px',
      top: (rect.top - 44) + 'px',
      zIndex: 10000
    }
  } else {
    floatOn.value = false
  }
  sync()
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

function insertLink() {
  const url = prompt('链接地址：', 'https://')
  if (url) run('createLink', url)
}

function insertImg() {
  const url = prompt('图片地址：', '')
  if (url) run('insertImage', url)
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

defineExpose({ insertHTML, clear: clearAll, getContent: getHTML })

function onClick(e) {
  if (showEmj.value && !e.target.closest('.pop-emj') && !e.target.closest('.tb-btn')) {
    showEmj.value = false
  }
  if (showTableGrid.value && !e.target.closest('.pop-table-grid') && !e.target.closest('.tb-btn')) {
    showTableGrid.value = false
  }
  if (floatOn.value && !e.target.closest('.float-bar') && !e.target.closest('.editor')) {
    floatOn.value = false
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
.float-bar {
  display: flex; align-items: center; gap: 1px;
  padding: 5px 6px;
  background: #fff; border: 1px solid #d9dce1;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.fb {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border: none; border-radius: 5px;
  background: none; cursor: pointer; font-size: 13px; color: #444; transition: all .1s;
}
.fb:hover { background: #f0f2f5; color: var(--theme-color,#0066ff); }
.fb-sep { width: 1px; height: 20px; background: #e0e2e5; margin: 0 3px; }
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

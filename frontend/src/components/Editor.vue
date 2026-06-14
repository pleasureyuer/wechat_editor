<template>
  <div class="editor-wrapper">
    <!-- 编辑器容器 -->
    <div
      ref="editorRef"
      class="editor-body"
      contenteditable="true"
      spellcheck="false"
      @input="onInput"
      @keydown="onKeydown"
      @mouseup="onSelectionChange"
      @keyup="onSelectionChange"
    ></div>

    <!-- 浮动格式工具栏（PC端选中文字时显示） -->
    <Teleport to="body">
      <div
        v-show="showFloatToolbar && floatToolbarPos.x > 0"
        class="float-toolbar"
        :style="{ left: floatToolbarPos.x + 'px', top: floatToolbarPos.y + 'px' }"
      >
        <button class="ft-btn" title="加粗 (Ctrl+B)" @click="execCmd('bold')"><b>B</b></button>
        <button class="ft-btn" title="斜体 (Ctrl+I)" @click="execCmd('italic')"><i>I</i></button>
        <button class="ft-btn" title="下划线 (Ctrl+U)" @click="execCmd('underline')"><u>U</u></button>
        <div class="ft-divider"></div>
        <button class="ft-btn ft-color-btn" title="文字颜色" @click="toggleColorPicker">
          <span class="color-indicator" :style="{ background: currentTextColor || 'var(--theme-color, #0066ff)' }"></span>A
        </button>
        <!-- 颜色选择弹出 -->
        <div v-if="showColorPicker" class="color-picker-popover" @click.stop>
          <button
            v-for="c in textColors"
            :key="c"
            class="color-pick-dot"
            :class="{ active: currentTextColor === c }"
            :style="{ background: c }"
            @click="applyTextColor(c)"
          ></button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useEditorStore } from '../stores/editor';

const emit = defineEmits(['update:content']);
const editorStore = useEditorStore();

const editorRef = ref(null);
const showFloatToolbar = ref(false);
const showColorPicker = ref(false);
const floatToolbarPos = ref({ x: 0, y: 0 });
const currentTextColor = ref('');

// 可选文字颜色
const textColors = [
  '#333333', '#666666', '#999999',
  '#0066ff', '#ff4757', '#2ed573',
  '#ffa502', '#a55eea', '#ff6b81'
];

// 输入事件
const onInput = () => {
  if (!editorRef.value) return;
  const html = editorRef.value.innerHTML;
  editorStore.editorContent = html;
  emit('update:content', html);
};

// 键盘事件
const onKeydown = (e) => {
  // Ctrl/Cmd 快捷键
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b': e.preventDefault(); execCmd('bold'); break;
      case 'i': e.preventDefault(); execCmd('italic'); break;
      case 'u': e.preventDefault(); execCmd('underline'); break;
    }
  }
};

// 选区变化 → 显示/隐藏浮动工具栏
const onSelectionChange = () => {
  hideColorPicker();
  const sel = window.getSelection();
  const selectedText = sel?.toString().trim() || '';

  if (selectedText && isSelectionInEditor()) {
    showFloatToolbar.value = true;
    positionFloatToolbar(sel);
  } else {
    showFloatToolbar.value = false;
  }
};

// 判断选区是否在编辑器内
const isSelectionInEditor = () => {
  const sel = window.getSelection();
  if (!sel.rangeCount) return false;
  const range = sel.getRangeAt(0);
  return editorRef.value?.contains(range.commonAncestorContainer);
};

// 定位浮动工具栏
const positionFloatToolbar = (sel) => {
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  nextTick(() => {
    // 工具栏在选区上方居中
    floatToolbarPos.value = {
      x: rect.left + rect.width / 2 - 80, // 居中（约160px宽）
      y: rect.top - 44 - 8 // 在选区上方8px
    };
  });
};

// 执行命令
const execCmd = (cmd, value = null) => {
  document.execCommand(cmd, false, value);
  editorRef.value?.focus();
  onInput(); // 更新内容
};

// 颜色相关
const toggleColorPicker = () => {
  showColorPicker.value = !showColorPicker.value;
};
const hideColorPicker = () => {
  showColorPicker.value = false;
};
const applyTextColor = (color) => {
  execCmd('foreColor', color);
  currentTextColor.value = color;
  hideColorPicker();
};

// 暴露方法：插入 HTML 到编辑器
const insertHTML = (html) => {
  if (editorRef.value) {
    editorRef.value.focus();
    document.execCommand('insertHTML', false, html);
    onInput();
  }
};

// 清空编辑器
const clear = () => {
  if (editorRef.value) {
    editorRef.value.innerHTML = '';
    onInput();
  }
};

// 获取编辑器内容
const getContent = () => editorRef.value?.innerHTML || '';

// 点击其他地方关闭浮动工具栏
const handleClickOutside = (e) => {
  if (showFloatToolbar.value && !e.target.closest('.float-toolbar')) {
    showFloatToolbar.value = false;
    hideColorPicker();
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

defineExpose({ insertHTML, clear, getContent });
</script>

<style scoped>
.editor-wrapper {
  max-width: 660px;
  margin: 0 auto;
  padding: 20px 16px 60px;
}

/* ====== 编辑器主体 ====== */
.editor-body {
  min-height: 600px;
  padding: 28px 32px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  outline: none;
  font-size: 16px;
  line-height: 1.85;
  color: #333;
  transition: box-shadow 0.2s;
}
.editor-body:focus {
  border-color: var(--theme-color, #0066ff);
  box-shadow: 0 1px 10px rgba(0, 102, 255, 0.1), 0 0 0 3px rgba(0, 102, 255, 0.05);
}
.editor-body:empty::before {
  content: '在此输入文章内容，或从左侧选择组件样式...';
  color: #ccc;
  font-style: italic;
  pointer-events: none;
}

/* ====== 组件预览样式（编辑器内） ====== */
.editor-body :deep(.editable-block) {
  margin: 14px 0;
}

/* 编号标题 */
.editor-body :deep(.style-number-title) {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--theme-color, #0066ff);
}
.editor-body :deep(.style-number-title .num) {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--theme-color, #0066ff);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}
.editor-body :deep(.style-number-title .title-text) {
  font-size: 17px;
  font-weight: 700;
  color: #222;
}

/* 胶囊标题 */
.editor-body :deep(.style-pill-title) {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0 12px;
}
.editor-body :deep(.style-pill-title .pill) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 9px;
  border-radius: 13px;
  background: var(--theme-color, #0066ff);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.editor-body :deep(.style-pill-title .pill-text) {
  font-size: 16px;
  font-weight: 600;
  color: #222;
  border-bottom: 2px solid var(--theme-light, #e6f0ff);
}

/* 卡片框 */
.editor-body :deep(.style-card-box) {
  background: #fff;
  border: 1px solid #e0e6ed;
  border-radius: 12px;
  padding: 18px 20px;
  margin: 16px 0;
}

/* 色块加重 */
.editor-body :deep(.style-highlight-block) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--theme-light, #e6f0ff);
  border-left: 4px solid var(--theme-color, #0066ff);
  padding: 12px 16px;
  margin: 14px 0;
  border-radius: 0 8px 8px 0;
  font-size: 15px;
  line-height: 1.7;
}

/* 分割线 */
.editor-body :deep(.style-divider) {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--theme-light, #e6f0ff), transparent);
  margin: 24px 0;
}

/* 原创声明 */
.editor-body :deep(.style-disclaimer) {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 12px 0 8px;
}

/* 引用块 */
.editor-body :deep(.style-quote-block) {
  border-left: 4px solid var(--theme-color, #0066ff);
  padding: 12px 16px;
  margin: 14px 0;
  background: #fafbfc;
  font-size: 15px;
  line-height: 1.7;
  color: #555;
  border-radius: 0 8px 8px 0;
}

/* 圆点横线 */
.editor-body :deep(.style-dot-line) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  font-size: 15px;
}
.editor-body :deep(.style-dot-line .dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme-color, #0066ff);
  flex-shrink: 0;
}
.editor-body :deep(.style-dot-line .line) {
  flex: 1;
  height: 1px;
  background: repeating-linear-gradient(90deg, var(--theme-light, #e6f0ff) 0, var(--theme-light, #e6f0ff) 5px, transparent 5px, transparent 8px);
}

/* ====== 浮动格式工具栏 ====== */
.float-toolbar {
  position: fixed;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 6px;
  background: #fff;
  border: 1px solid #d9dce1;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  animation: toolbarPopIn 0.12s ease-out;
}

@keyframes toolbarPopIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.ft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 5px;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #444;
  transition: all 0.1s;
}
.ft-btn:hover {
  background: #f0f2f5;
  color: var(--theme-color, #0066ff);
}

.ft-divider {
  width: 1px;
  height: 20px;
  background: #e0e2e5;
  margin: 0 3px;
}

.ft-color-btn {
  position: relative;
  flex-direction: column;
  gap: 0;
  width: auto;
  padding: 0 7px;
  font-weight: 600;
}

.color-indicator {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 2px;
  border-radius: 1px;
}

/* 颜色选择弹出层 */
.color-picker-popover {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  padding: 8px;
  background: #fff;
  border: 1px solid #d9dce1;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 10;
}

.color-pick-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
}
.color-pick-dot:hover { transform: scale(1.15); }
.color-pick-dot.active {
  border-color: #333;
  transform: scale(1.1);
}
</style>

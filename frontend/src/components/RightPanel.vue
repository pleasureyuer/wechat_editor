<template>
  <div class="right-panel">
    <!-- 预览头部 -->
    <div class="rp-header">
      <span class="rp-title">预览效果</span>
      <label class="view-toggle">
        <input type="checkbox" v-model="showPhoneFrame" />
        <span>手机视图</span>
      </label>
    </div>

    <!-- 预览区（占满剩余空间） -->
    <div class="phone-frame" :class="{ active: showPhoneFrame }">
      <div class="preview-container" :style="containerStyle" v-html="editorStore.previewHTML"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useEditorStore } from '../stores/editor';

const editorStore = useEditorStore();
const showPhoneFrame = ref(false);

const containerStyle = computed(() => {
  const app = editorStore.appearance;
  return {
    background: app.outerBgColor,
    padding: showPhoneFrame.value ? '8px' : `${app.outerPadding}px`,
    borderRadius: `${app.outerRadius}px`,
  };
});
</script>

<style scoped>
.right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 头部 */
.rp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}
.rp-title {
  font-size: 13px; font-weight: 700; color: #555;
}

.view-toggle {
  font-size: 11px; color: #888; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  user-select: none;
}
.view-toggle input[type="checkbox"] {
  accent-color: var(--theme-color, #0066ff);
}

/* 预览区 */
.phone-frame {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column;
  min-height: 0;
  padding: 14px;
  transition: all 0.2s ease;
}
.phone-frame.active {
  padding: 16px;
  background: #2c2c2c;
  border-radius: 20px;
}
.phone-frame.active .preview-container {
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  max-width: 375px;
  margin: 0 auto;
  min-height: 500px;
}

.preview-container {
  flex: 1; overflow-y: auto;
  min-height: 0;
  font-size: 14px; line-height: 1.8; color: #333;
}

/* 列表基础样式 */
.preview-container :deep(ul),
.preview-container :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}
.preview-container :deep(ul) { list-style-type: disc; }
.preview-container :deep(ol) { list-style-type: decimal; }
.preview-container :deep(li) {
  line-height: 1.8;
  padding: 2px 0;
}

/* 注意：预览区组件样式已移至 editor.js buildWechatHTML()
   预览现在使用微信兼容的 table 内联样式输出（与公众号实际渲染100%一致）
   不再需要这里的 CSS 类样式 */
</style>

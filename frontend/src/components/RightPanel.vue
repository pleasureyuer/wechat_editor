<template>
  <div class="right-panel">
    <!-- 主题配色（紧凑版） -->
    <div class="rp-section rp-compact">
      <div class="color-row">
        <button
          v-for="(theme, key) in editorStore.themes"
          :key="key"
          class="color-dot-btn"
          :class="{ active: editorStore.currentTheme === key }"
          :title="theme.name"
          @click="editorStore.setTheme(key)"
        >
          <span class="dot-inner" :style="{ background: theme.color }"></span>
        </button>
      </div>
      <span class="theme-label">{{ editorStore.themes[editorStore.currentTheme]?.name }}</span>
    </div>

    <!-- 实时预览 -->
    <div class="rp-section rp-section-grow">
      <h3 class="rp-title">
        预览
        <span class="rp-subtitle">（公众号效果）</span>
      </h3>
      <div class="preview-body" v-html="previewHTML"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useEditorStore } from '../stores/editor';

const editorStore = useEditorStore();

const previewHTML = computed(() => {
  return editorStore.editorContent || '<p style="color:#bbb;text-align:center;padding:40px 16px;">在中间编辑区输入内容，或从左侧选择组件插入...</p>';
});
</script>

<style scoped>
.right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

/* 紧凑配色区 */
.rp-compact {
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  flex: 1;
}

.color-dot-btn {
  width: 22px;
  height: 22px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.color-dot-btn:hover { transform: scale(1.2); }
.color-dot-btn.active {
  border-color: #333;
  transform: scale(1.15);
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.dot-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
}

.theme-label {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 预览区 */
.rp-section {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
}

.rp-section-grow {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.rp-title {
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.rp-subtitle {
  font-weight: 400;
  color: #999;
  font-size: 11px;
  margin-left: 4px;
}

.preview-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  min-height: 0;
}
/* 预览区列表样式 */
.preview-body :deep(ul), .preview-body :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}
.preview-body :deep(ul) { list-style-type: disc; }
.preview-body :deep(ol) { list-style-type: decimal; }
.preview-body :deep(li) {
  line-height: 1.8;
  padding: 2px 0;
}
</style>

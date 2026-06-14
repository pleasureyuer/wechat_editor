<template>
  <div class="right-panel">
    <!-- 颜色选择器 -->
    <div class="rp-section">
      <h3 class="rp-title">主题配色</h3>
      <div class="color-grid">
        <button
          v-for="(theme, key) in editorStore.themes"
          :key="key"
          class="color-btn"
          :class="{ active: editorStore.currentTheme === key }"
          @click="editorStore.setTheme(key)"
          :title="theme.name"
        >
          <span class="color-dot" :style="{ background: theme.color }"></span>
        </button>
      </div>
      <p class="current-theme-name">{{ editorStore.themes[editorStore.currentTheme]?.name }}</p>
    </div>

    <!-- 实时预览 -->
    <div class="rp-section rp-section-grow">
      <h3 class="rp-title">
        预览
        <span class="rp-subtitle">（公众号效果）</span>
      </h3>
      <div class="preview-frame">
        <div class="preview-phone-notch"></div>
        <div class="preview-content" v-html="previewHTML"></div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="rp-section">
      <h3 class="rp-title">快捷操作</h3>
      <div class="quick-actions">
        <button class="qa-btn" @click="$emit('copy')">
          📋 复制 HTML
        </button>
        <button class="qa-btn qa-btn-outline" @click="$emit('export')">
          📤 导出文件
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useEditorStore } from '../stores/editor';

const emit = defineEmits(['copy', 'export']);
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

.rp-section {
  padding: 14px 16px;
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
  margin-bottom: 10px;
}

.rp-subtitle {
  font-weight: 400;
  color: #999;
  font-size: 11px;
  margin-left: 4px;
}

/* 颜色选择器 */
.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.color-btn {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: #fff;
}
.color-btn:hover {
  transform: scale(1.12);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.color-btn.active {
  border-color: #333;
  transform: scale(1.08);
}

.color-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
}

.current-theme-name {
  text-align: center;
  font-size: 12px;
  color: #888;
  margin-top: 8px;
}

/* 预览区 */
.preview-frame {
  flex: 1;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  overflow-y: auto;
  position: relative;
  min-height: 200px;
}

.preview-phone-notch {
  height: 24px;
  background: #f5f6f7;
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid #e8eaed;
}

.preview-content {
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.8;
  color: #333;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qa-btn {
  width: 100%;
  padding: 9px;
  border: none;
  border-radius: 8px;
  background: var(--theme-color, #0066ff);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.15s;
}
.qa-btn:hover { opacity: 0.88; }

.qa-btn-outline {
  background: #fff;
  color: #666;
  border: 1px solid #d9dce1;
}
.qa-btn-outline:hover { background: #f8f9fa; }
</style>

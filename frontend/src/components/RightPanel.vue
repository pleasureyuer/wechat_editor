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

/* ========== 预览区内组件样式（和编辑器一致） ========== */

/* 编号标题 */
.preview-container :deep(.style-number-title) {
  display: flex; align-items: center; gap: 10px; margin: 18px 0 10px;
}
.preview-container :deep(.style-number-title .num) {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.preview-container :deep(.style-number-title .title-text) {
  font-size: 17px; font-weight: 700; color: #222;
}

/* 渐变标题 */
.preview-container :deep(.style-gradient-title) { margin: 22px 0 12px; }
.preview-container :deep(.style-gradient-title h2) {
  font-size: 20px; font-weight: 700;
  background: linear-gradient(90deg, var(--theme-color, #0066ff), #a78bfa);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin: 0;
}

/* 标签标题（左竖线） */
.preview-container :deep(.style-tag-title) { margin: 22px 0 12px; }
.preview-container :deep(.style-tag-title h2) {
  font-size: 18px; font-weight: 700;
  border-left: 4px solid var(--theme-color, #0066ff);
  padding-left: 12px; margin: 0; color: #333;
}

/* 胶囊标题 */
.preview-container :deep(.style-pill-title) {
  display: flex; align-items: center; gap: 8px; margin: 18px 0 10px;
}
.preview-container :deep(.style-pill-title .pill) {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 22px; padding: 0 7px;
  border-radius: 11px;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.preview-container :deep(.style-pill-title .pill-text) {
  font-size: 16px; font-weight: 600; color: #222;
}

/* 软底胶囊标题 */
.preview-container :deep(.style-soft-pill-title) { margin: 16px 0 10px; }
.preview-container :deep(.style-soft-pill-title > span:first-child) {
  background: #f0f0f0; color: #666;
  padding: 2px 10px; border-radius: 10px; font-size: 11px;
}

/* 左竖线标题 */
.preview-container :deep(.style-left-line-title) { margin: 20px 0 12px; }
.preview-container :deep(.style-left-line-title h2) {
  display: inline-block; border-left: 4px solid var(--theme-color, #0066ff);
  padding-left: 12px; font-size: 17px; font-weight: 700;
  line-height: 1.4; color: #333; margin: 0;
}

/* 右竖线标题 */
.preview-container :deep(.style-right-line-title) { margin: 20px 0 12px; text-align: right; }
.preview-container :deep(.style-right-line-title h2) {
  display: inline-block; border-right: 4px solid var(--theme-color, #0066ff);
  padding-right: 12px; font-size: 17px; font-weight: 700;
  line-height: 1.4; color: #333; margin: 0;
}

/* 居中标题 */
.preview-container :deep(.style-center-title) { margin: 20px 0 12px; text-align: center; }
.preview-container :deep(.style-center-title h2) {
  font-size: 17px; font-weight: 700;
  display: inline-block; border-bottom: 2px solid var(--theme-color, #0066ff);
  padding-bottom: 8px; color: #333; margin: 0;
}

/* 圆形图标标题 */
.preview-container :deep(.style-circle-icon-title) {
  display: flex; align-items: center; gap: 10px; margin: 16px 0 10px;
}
.preview-container :deep(.style-circle-icon-title > span:first-child) {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--theme-color, #0066ff); color: #fff;
  font-size: 13px; flex-shrink: 0;
}
.preview-container :deep(.style-circle-icon-title > span:last-child) {
  font-size: 17px; font-weight: 700; color: #333;
}

/* 圆点横线 */
.preview-container :deep(.style-dot-line) {
  display: flex; align-items: center; gap: 8px; margin: 16px 0;
}
.preview-container :deep(.style-dot-line .dot) {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--theme-color, #0066ff); flex-shrink: 0;
}
.preview-container :deep(.style-dot-line .line) {
  flex: 1; height: 1px; background: #ddd;
}

/* 下划线标题 */
.preview-container :deep(.style-underline-title) { margin: 18px 0 10px; }
.preview-container :deep(.style-underline-title > span) {
  font-size: 17px; font-weight: 700;
  border-bottom: 2px solid var(--theme-color, #0066ff);
  padding-bottom: 3px; color: #333;
}

/* 卡片标题 */
.preview-container :deep(.style-card-title) { margin: 16px 0 10px; }

/* 步骤标题 */
.preview-container :deep(.style-step-title) {
  display: flex; align-items: center; gap: 10px; margin: 16px 0 10px;
}
.preview-container :deep(.style-step-title > b:first-child) {
  color: var(--theme-color, #0066ff); font-size: 18px; font-weight: 800;
}
.preview-container :deep(.style-step-title > span:last-child) {
  font-weight: 700; font-size: 16px; color: #222;
}

/* 卡片框 */
.preview-container :deep(.style-card-box) {
  background: var(--theme-light, #e6f0ff);
  border: 1px solid var(--theme-color, #0066ff);
  border-radius: 10px; padding: 16px 20px;
  margin: 14px 0; font-size: 14px; color: #444; line-height: 1.8;
}

/* 引用块 */
.preview-container :deep(.style-quote-block) {
  border-left: 4px solid var(--theme-color, #0066ff);
  padding: 12px 16px; margin: 14px 0;
  background: #fafbfc; font-size: 15px; line-height: 1.7;
  color: #555; border-radius: 0 8px 8px 0;
}

/* 提示框 */
.preview-container :deep(.style-info-box) {
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; padding: 14px 18px; margin: 14px 0;
  font-size: 14px; color: #555;
  border: 1px solid rgba(0, 102, 255, 0.1);
}

/* 免责声明 */
.preview-container :deep(.style-disclaimer) {
  background: #f8f8f8; border: 1px solid #eee;
  border-radius: 8px; padding: 14px 18px; margin: 14px 0;
  font-size: 13px; color: #888; line-height: 1.7;
}

/* 高亮块 */
.preview-container :deep(.style-highlight-block) {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 16px; margin: 14px 0;
  background: var(--theme-light, #e6f0ff);
  border-radius: 8px; font-size: 14px; color: #444; line-height: 1.8;
}

/* 分割线 */
.preview-container :deep(.style-divider) { margin: 20px 0; }
</style>

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

    <!-- 主题色板 ── 快速切换 -->
    <div class="theme-swatches-row">
      <span class="theme-swatches-label">主题</span>
      <div class="theme-swatches-list">
        <button
          v-for="t in editorStore.themeList"
          :key="t.id"
          class="theme-swatch"
          :class="{ active: t.isActive }"
          :style="{ background: t.color }"
          :title="t.name"
          @click="editorStore.setTheme(t.id)"
        >
          <span v-if="t.isActive" class="swatch-check">✓</span>
        </button>
      </div>
      <button class="theme-manage-btn" @click="showThemePanel = !showThemePanel" title="管理主题">⛭</button>
    </div>

    <!-- 主题管理面板 -->
    <div v-if="showThemePanel" class="theme-panel">
      <div class="tm-panel-header">
        <span class="tm-panel-title">🎯 我的主题</span>
        <button class="tm-panel-add" @click="openCreateDialog">＋ 新建</button>
      </div>

      <div class="tm-panel-list">
        <div
          v-for="t in editorStore.themeList"
          :key="t.id"
          class="tm-card"
          :class="{ active: t.isActive }"
        >
          <div class="tm-card-info" @click="editorStore.setTheme(t.id)">
            <span class="tm-card-swatch" :style="{ background: t.color }"></span>
            <span class="tm-card-name">{{ t.name }}</span>
            <span class="tm-card-badge" :class="{ preset: t.isPreset, custom: t.isCustom }">
              {{ t.isPreset ? '预设' : '自定义' }}
            </span>
          </div>
          <div class="tm-card-actions">
            <button
              v-if="t.isCustom"
              class="tm-card-btn edit"
              title="编辑"
              @click.stop="openEditDialog(t)"
            >✏️</button>
            <button
              v-if="t.isCustom"
              class="tm-card-btn del"
              title="删除"
              @click.stop="promptDelete(t)"
            >✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑 主题弹窗 -->
    <div v-if="dialogVisible" class="tm-overlay" @click.self="dialogVisible = false">
      <div class="tm-dialog">
        <div class="tm-dialog-title">{{ isEditing ? '编辑主题' : '新建主题' }}</div>

        <label class="tm-field-label">主题名称</label>
        <input
          v-model="formName"
          class="tm-input"
          placeholder="例如：晚霞橙、森林绿..."
          maxlength="8"
          @keydown.enter="submitTheme"
        />

        <label class="tm-field-label">主题色</label>
        <div class="tm-color-pick">
          <input type="color" v-model="formColor" class="tm-color-input" />
          <code class="tm-color-val">{{ formColor }}</code>
        </div>

        <label class="tm-field-label">浅色背景</label>
        <div class="tm-color-pick">
          <input type="color" v-model="formLight" class="tm-color-input" />
          <code class="tm-color-val">{{ formLight }}</code>
        </div>

        <div class="tm-preview-row">
          <span>预览：</span>
          <span class="tm-preview-swatch" :style="{ background: formColor }"></span>
          <span class="tm-preview-light" :style="{ background: formLight, borderColor: formColor }"></span>
        </div>

        <div class="tm-dialog-btn-row">
          <button class="tm-dialog-btn cancel" @click="dialogVisible = false">取消</button>
          <button class="tm-dialog-btn confirm" @click="submitTheme" :disabled="!formName || !formColor || !formLight">
            {{ isEditing ? '保存' : '创建' }}
          </button>
        </div>
      </div>
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
const showThemePanel = ref(false);

const containerStyle = computed(() => {
  const app = editorStore.appearance;
  return {
    background: app.outerBgColor,
    padding: showPhoneFrame.value ? '8px' : `${app.outerPadding}px`,
    borderRadius: `${app.outerRadius}px`,
  };
});

// ── 新建/编辑弹窗 ──
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref('');
const formName = ref('');
const formColor = ref('#0066ff');
const formLight = ref('#e6f0ff');

function openCreateDialog() {
  isEditing.value = false;
  editingId.value = '';
  formName.value = '';
  formColor.value = '#0066ff';
  formLight.value = '#e6f0ff';
  dialogVisible.value = true;
}

function openEditDialog(t) {
  isEditing.value = true;
  editingId.value = t.id;
  formName.value = t.name;
  formColor.value = t.color;
  formLight.value = t.light;
  dialogVisible.value = true;
}

function submitTheme() {
  if (!formName.value || !formColor.value || !formLight.value) return;
  if (isEditing.value) {
    editorStore.updateCustomTheme(editingId.value, {
      name: formName.value,
      color: formColor.value,
      light: formLight.value,
    });
  } else {
    editorStore.createCustomTheme(formName.value, formColor.value, formLight.value);
  }
  dialogVisible.value = false;
}

function promptDelete(t) {
  if (confirm(`确定要删除主题「${t.name}」吗？`)) {
    editorStore.deleteCustomTheme(t.id);
  }
}
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
.rp-title { font-size: 13px; font-weight: 700; color: #555; }
.view-toggle { font-size: 11px; color: #888; cursor: pointer; display: flex; align-items: center; gap: 4px; user-select: none; }
.view-toggle input[type="checkbox"] { accent-color: var(--theme-color, #0066ff); }

/* ═══════════ 主题色板 ═══════════ */
.theme-swatches-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid #f5f5f5;
  flex-shrink: 0;
}
.theme-swatches-label {
  font-size: 11px; color: #999; white-space: nowrap; flex-shrink: 0;
}
.theme-swatches-list {
  display: flex; gap: 5px; flex: 1; overflow-x: auto; padding: 2px 0;
}
.theme-swatch {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  position: relative;
}
.theme-swatch:hover { transform: scale(1.18); }
.theme-swatch.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px #666;
}
.swatch-check {
  color: #fff; font-size: 10px; font-weight: 700; text-shadow: 0 0 3px rgba(0,0,0,0.5);
}
.theme-manage-btn {
  width: 24px; height: 24px; border-radius: 4px;
  border: 1px solid #ddd; background: #fafafa;
  cursor: pointer; font-size: 14px; color: #666;
  flex-shrink: 0; line-height: 1;
  transition: all 0.15s;
}
.theme-manage-btn:hover { background: #eee; color: #333; }

/* ═══════════ 主题管理面板 ═══════════ */
.theme-panel {
  flex-shrink: 0;
  max-height: 220px; overflow-y: auto;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
}
.tm-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px;
}
.tm-panel-title { font-size: 12px; font-weight: 700; color: #444; }
.tm-panel-add {
  padding: 2px 10px; border: 1px solid var(--theme-color, #0066ff);
  border-radius: 4px; background: #fff; color: var(--theme-color, #0066ff);
  font-size: 11px; cursor: pointer;
}
.tm-panel-add:hover { background: var(--theme-light, #e6f0ff); }

.tm-panel-list { padding: 0 14px 8px; }
.tm-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  transition: all 0.12s;
  margin-bottom: 2px;
}
.tm-card:hover { background: #f0f2f5; }
.tm-card.active { background: #eef2ff; }

.tm-card-info {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
}
.tm-card-swatch {
  width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.1);
}
.tm-card-name {
  font-size: 12px; font-weight: 600; color: #333;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tm-card-badge {
  font-size: 9px; padding: 0 5px; border-radius: 3px;
  line-height: 15px; white-space: nowrap; flex-shrink: 0;
}
.tm-card-badge.preset { background: #fff3e0; color: #e6a700; }
.tm-card-badge.custom { background: #e6f7e6; color: #389e0d; }

.tm-card-actions { display: flex; gap: 2px; flex-shrink: 0; margin-left: 8px; }
.tm-card-btn {
  width: 22px; height: 22px; border-radius: 4px; border: none;
  background: transparent; cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  color: #999; transition: all 0.12s;
}
.tm-card-btn:hover { background: rgba(0,0,0,0.06); color: #333; }
.tm-card-btn.del:hover { background: #ffe6e6; color: #e53935; }

/* ═══════════ 弹窗 ═══════════ */
.tm-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35); z-index: 3000;
  display: flex; align-items: center; justify-content: center;
}
.tm-dialog {
  background: #fff; border-radius: 12px; padding: 24px;
  width: 320px; box-shadow: 0 8px 40px rgba(0,0,0,0.18);
}
.tm-dialog-title { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 16px; }

.tm-field-label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; margin-top: 12px; }
.tm-field-label:first-of-type { margin-top: 0; }

.tm-input {
  width: 100%; padding: 7px 10px; border: 1px solid #ddd;
  border-radius: 6px; font-size: 14px; box-sizing: border-box;
  outline: none;
}
.tm-input:focus { border-color: var(--theme-color, #0066ff); box-shadow: 0 0 0 2px rgba(0,102,255,0.1); }

.tm-color-pick {
  display: flex; align-items: center; gap: 8px;
}
.tm-color-input { width: 32px; height: 28px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; padding: 2px; }
.tm-color-val { font-size: 12px; color: #888; }

.tm-preview-row {
  display: flex; align-items: center; gap: 8px; margin-top: 14px;
  font-size: 12px; color: #888;
}
.tm-preview-swatch {
  width: 28px; height: 28px; border-radius: 50%;
}
.tm-preview-light {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid #ddd;
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

/* ═══════════ 预览区 ═══════════ */
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

.preview-container :deep(ul),
.preview-container :deep(ol) {
  padding-left: 24px; margin: 12px 0;
}
.preview-container :deep(ul) { list-style-type: disc; }
.preview-container :deep(ol) { list-style-type: decimal; }
.preview-container :deep(li) { line-height: 1.8; padding: 2px 0; }
</style>

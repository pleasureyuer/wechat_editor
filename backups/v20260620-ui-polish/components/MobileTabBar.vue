<template>
  <div class="mobile-tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-btn"
      :class="{ active: modelValue === tab.key }"
      @click="$emit('update:modelValue', tab.key)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true }
})
defineEmits(['update:modelValue'])

const tabs = [
  { key: 'edit',    icon: '✏️', label: '编辑' },
  { key: 'preview', icon: '👁', label: '预览' },
  { key: 'components', icon: '📦', label: '组件' },
  { key: 'theme',   icon: '🎨', label: '主题' },
]
</script>

<style scoped>
.mobile-tab-bar {
  display: flex;
  height: 56px;
  background: #fff;
  border-top: 1px solid #e8eaed;
  padding-bottom: env(safe-area-inset-bottom, 0);
  flex-shrink: 0;
  z-index: 100;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  font-size: 10px;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.tab-btn.active {
  color: var(--theme-color, #0066ff);
}

.tab-icon {
  font-size: 20px;
  line-height: 1;
}

.tab-label {
  font-size: 10px;
  line-height: 1.2;
}
</style>

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useEditorStore = defineStore('editor', () => {
  // 主题相关
  const currentTheme = ref('blue');
  const themes = ref({
    blue: { name: '蓝色', color: '#0066ff', light: '#e6f0ff' },
    orange: { name: '橙色', color: '#ff6b35', light: '#fff0e8' },
    teal: { name: '青色', color: '#009688', light: '#e0f2f1' },
    black: { name: '黑色', color: '#333333', light: '#f5f5f5' },
    beanPink: { name: '豆沙粉', color: '#b5838d', light: '#f8e8ea' },
    milkCoffee: { name: '奶咖米棕', color: '#a67c52', light: '#f5e6d3' },
    morandiGreen: { name: '莫兰迪绿', color: '#7d9a8c', light: '#e8f0ec' }
  });

  // 编辑器内容
  const editorContent = ref('');

  // 当前选中的组件
  const selectedComponent = ref(null);

  // 切换主题
  const setTheme = (themeName) => {
    currentTheme.value = themeName;
  };

  // 获取当前主题颜色
  const currentThemeColor = computed(() => {
    return themes.value[currentTheme.value]?.color || '#0066ff';
  });

  const currentThemeLight = computed(() => {
    return themes.value[currentTheme.value]?.light || '#e6f0ff';
  });

  return {
    currentTheme,
    themes,
    editorContent,
    selectedComponent,
    setTheme,
    currentThemeColor,
    currentThemeLight
  };
});

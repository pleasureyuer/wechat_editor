import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// ═══════════════════════════════════════════════════════════
//  组件样式预设（供主题 styleMap 选择）
// ═══════════════════════════════════════════════════════════
const TITLE_STYLE_OPTIONS = [
  { id:'gradientTitle',   name:'渐变大标题', icon:'🎨' },
  { id:'tagTitle',        name:'标签边框',   icon:'🏷️' },
  { id:'leftLineTitle',   name:'左竖线',     icon:'▎' },
  { id:'rightLineTitle',  name:'右竖线',     icon:'▐' },
  { id:'centerLineTitle', name:'居中分割线', icon:'➖' },
  { id:'underlineTitle',  name:'下划线',     icon:'Ｕ' },
  { id:'cardTitle',       name:'卡片底色',   icon:'📋' },
  { id:'numberTitle',     name:'编号圆标',   icon:'①' },
  { id:'pillTitle',       name:'胶囊圆点',   icon:'●' },
  { id:'stepTitle',       name:'步骤序号',   icon:'1️⃣' },
  { id:'circleIconTitle', name:'圆形图标',   icon:'💡' },
  { id:'dotLine',         name:'圆点横线',   icon:'●—' },
  { id:'softPillTitle',   name:'软标签',     icon:'🏷️' },
];

const QUOTE_STYLE_OPTIONS = [
  { id:'quoteBlock',    name:'左竖线引用', icon:'💬' },
  { id:'highlightBlock',name:'色块加重',   icon:'🎨' },
];

const CARD_STYLE_OPTIONS = [
  { id:'cardBox',  name:'卡片框', icon:'📦' },
  { id:'infoBox',  name:'提示框', icon:'ℹ️' },
];

const DIVIDER_STYLE_OPTIONS = [
  { id:'dividerSolid',  name:'实线', icon:'―' },
  { id:'dividerDashed', name:'虚线', icon:'┄' },
  { id:'dividerDot',    name:'点线', icon:'⋯' },
  { id:'dividerThick',  name:'粗线', icon:'━' },
];

const LIST_STYLE_OPTIONS = [
  { id:'default',    name:'默认圆点', icon:'•' },
  { id:'numbered',   name:'数字编号', icon:'1.' },
  { id:'dash',       name:'短横线',   icon:'—' },
];

const CODE_STYLE_OPTIONS = [
  { id:'infoBox',   name:'灰底提示框', icon:'📝' },
  { id:'cardBox',   name:'白底卡片框', icon:'📦' },
];

const EMPHASIS_STYLE_OPTIONS = [
  { id:'default',   name:'粗体',       icon:'B' },
  { id:'color',     name:'主题色粗体',  icon:'A' },
  { id:'highlight', name:'背景色高亮',  icon:'🖍' },
];

// 默认样式映射（无预设时用）
const DEFAULT_STYLE_MAP = {
  h1: 'gradientTitle', h2: 'leftLineTitle', h3: 'softPillTitle', h4: 'softPillTitle',
  quote: 'quoteBlock', card: 'cardBox', divider: 'dividerSolid',
  list: 'default', code: 'infoBox', emphasis: 'default',
};

// ═══════════════════════════════════════════════════════════
//  预设主题色（不可删除，只管颜色）
// ═══════════════════════════════════════════════════════════
const PRESET_THEMES = {
  blue:   { id:'blue',   name:'蓝色',     color:'#0066ff', light:'#e6f0ff', isPreset:true },
  orange: { id:'orange', name:'橙色',     color:'#ff6b35', light:'#fff0e8', isPreset:true },
  teal:   { id:'teal',   name:'青色',     color:'#009688', light:'#e0f2f1', isPreset:true },
  black:  { id:'black',  name:'黑色',     color:'#333333', light:'#f5f5f5', isPreset:true },
  beanPink:      { id:'beanPink',      name:'豆沙粉',   color:'#b5838d', light:'#f8e8ea', isPreset:true },
  milkCoffee:    { id:'milkCoffee',    name:'奶咖米棕', color:'#a67c52', light:'#f5e6d3', isPreset:true },
  morandiGreen:  { id:'morandiGreen',  name:'莫兰迪绿', color:'#7d9a8c', light:'#e8f0ec', isPreset:true }
};

// ═══════════════════════════════════════════════════════════
//  预设样式组合（不可删除，只管组件映射）
// ═══════════════════════════════════════════════════════════
const STYLE_PRESETS = {
  minimal: {
    id:'minimal', name:'简约商务', isPreset:true,
    map:{ h1:'leftLineTitle', h2:'underlineTitle', h3:'softPillTitle', h4:'softPillTitle',
          quote:'quoteBlock', card:'cardBox', divider:'dividerSolid',
          list:'default', code:'infoBox', emphasis:'default' }
  },
  literary: {
    id:'literary', name:'文艺清新', isPreset:true,
    map:{ h1:'gradientTitle', h2:'centerLineTitle', h3:'cardTitle', h4:'circleIconTitle',
          quote:'highlightBlock', card:'infoBox', divider:'dividerDashed',
          list:'default', code:'infoBox', emphasis:'color' }
  },
  tech: {
    id:'tech', name:'科技极客', isPreset:true,
    map:{ h1:'numberTitle', h2:'tagTitle', h3:'pillTitle', h4:'stepTitle',
          quote:'quoteBlock', card:'cardBox', divider:'dividerDot',
          list:'numbered', code:'cardBox', emphasis:'highlight' }
  },
  magazine: {
    id:'magazine', name:'杂志排版', isPreset:true,
    map:{ h1:'rightLineTitle', h2:'dotLine', h3:'underlineTitle', h4:'tagTitle',
          quote:'highlightBlock', card:'infoBox', divider:'dividerThick',
          list:'dash', code:'infoBox', emphasis:'default' }
  },
  playful: {
    id:'playful', name:'活泼可爱', isPreset:true,
    map:{ h1:'circleIconTitle', h2:'stepTitle', h3:'pillTitle', h4:'softPillTitle',
          quote:'highlightBlock', card:'cardBox', divider:'dividerDashed',
          list:'default', code:'infoBox', emphasis:'highlight' }
  }
};

function loadCustomThemes() {
  try {
    const raw = localStorage.getItem('wechat_custom_themes');
    if (!raw) return {};
    const list = JSON.parse(raw);
    const obj = {};
    list.forEach(t => { obj[t.id] = t; });
    return obj;
  } catch { return {}; }
}

function saveCustomThemes(obj) {
  try {
    const list = Object.values(obj);
    localStorage.setItem('wechat_custom_themes', JSON.stringify(list));
  } catch {}
}

function loadCustomStylePresets() {
  try {
    const raw = localStorage.getItem('wechat_custom_style_presets');
    if (!raw) return {};
    const list = JSON.parse(raw);
    const obj = {};
    list.forEach(s => { obj[s.id] = s; });
    return obj;
  } catch { return {}; }
}

function saveCustomStylePresets(obj) {
  try {
    const list = Object.values(obj);
    localStorage.setItem('wechat_custom_style_presets', JSON.stringify(list));
  } catch {}
}

export const useEditorStore = defineStore('editor', () => {
  // ── 主题色系统（只管理颜色，不管样式映射）──
  const customThemes = ref(loadCustomThemes());
  const currentTheme = ref(localStorage.getItem('wechat_active_theme') || 'blue');

  const themes = computed(() => ({ ...PRESET_THEMES, ...customThemes.value }));

  const themeList = computed(() => {
    const list = [];
    for (const [id, t] of Object.entries(PRESET_THEMES)) {
      list.push({ ...t, isCustom:false, isActive:currentTheme.value === id });
    }
    for (const [id, t] of Object.entries(customThemes.value)) {
      list.push({ ...t, isCustom:true, isActive:currentTheme.value === id });
    }
    return list;
  });

  function createCustomTheme(name, color, light) {
    const id = 'custom_' + Date.now();
    const t = { id, name, color, light, isPreset:false };
    customThemes.value = { ...customThemes.value, [id]: t };
    saveCustomThemes(customThemes.value);
    return id;
  }

  function deleteCustomTheme(id) {
    const copy = { ...customThemes.value };
    delete copy[id];
    customThemes.value = copy;
    saveCustomThemes(copy);
    if (currentTheme.value === id) {
      currentTheme.value = 'blue';
      localStorage.setItem('wechat_active_theme', 'blue');
    }
  }

  function updateCustomTheme(id, patch) {
    const existing = customThemes.value[id];
    if (!existing) return;
    const updated = { ...existing, ...patch };
    customThemes.value = { ...customThemes.value, [id]: updated };
    saveCustomThemes(customThemes.value);
  }

  // 切换主题色（只影响颜色）
  const setTheme = (themeId) => {
    currentTheme.value = themeId;
    try { localStorage.setItem('wechat_active_theme', themeId); } catch {}
  };

  // ── 样式预设系统（只管理组件映射，不管颜色）──
  const customStylePresets = ref(loadCustomStylePresets());
  const currentStylePreset = ref(localStorage.getItem('wechat_active_style_preset') || 'minimal');

  const allStylePresets = computed(() => ({
    ...STYLE_PRESETS,
    ...customStylePresets.value
  }));

  const stylePresetList = computed(() => {
    const list = [];
    for (const [id, s] of Object.entries(STYLE_PRESETS)) {
      list.push({ ...s, isCustom:false, isActive:currentStylePreset.value === id });
    }
    for (const [id, s] of Object.entries(customStylePresets.value)) {
      list.push({ ...s, isCustom:true, isActive:currentStylePreset.value === id });
    }
    return list;
  });

  function createStylePreset(name, map) {
    const id = 'sp_' + Date.now();
    const s = { id, name, isPreset:false, map };
    customStylePresets.value = { ...customStylePresets.value, [id]: s };
    saveCustomStylePresets(customStylePresets.value);
    return id;
  }

  function deleteStylePreset(id) {
    const copy = { ...customStylePresets.value };
    delete copy[id];
    customStylePresets.value = copy;
    saveCustomStylePresets(copy);
    if (currentStylePreset.value === id) {
      currentStylePreset.value = 'minimal';
      localStorage.setItem('wechat_active_style_preset', 'minimal');
      syncAppearanceFromStylePreset('minimal');
    }
  }

  function updateStylePreset(id, patch) {
    const existing = customStylePresets.value[id];
    if (!existing) return;
    const updated = { ...existing, ...patch };
    customStylePresets.value = { ...customStylePresets.value, [id]: updated };
    saveCustomStylePresets(customStylePresets.value);
  }

  // 切换样式预设（只影响组件映射，不影响颜色）
  const setStylePreset = (presetId) => {
    currentStylePreset.value = presetId;
    try { localStorage.setItem('wechat_active_style_preset', presetId); } catch {}
    syncAppearanceFromStylePreset(presetId);
  };

  // 从样式预设同步到 appearance
  function syncAppearanceFromStylePreset(presetId) {
    const sp = allStylePresets.value[presetId];
    const m = sp?.map || DEFAULT_STYLE_MAP;
    appearance.value.h1Style = m.h1 || DEFAULT_STYLE_MAP.h1;
    appearance.value.h2Style = m.h2 || DEFAULT_STYLE_MAP.h2;
    appearance.value.h3Style = m.h3 || DEFAULT_STYLE_MAP.h3;
    appearance.value.h4Style = m.h4 || DEFAULT_STYLE_MAP.h4;
    appearance.value.quoteStyle = m.quote || DEFAULT_STYLE_MAP.quote;
    appearance.value.cardStyle = m.card || DEFAULT_STYLE_MAP.card;
    appearance.value.dividerStyle = m.divider || DEFAULT_STYLE_MAP.divider;
    appearance.value.listStyle = m.list || DEFAULT_STYLE_MAP.list;
    appearance.value.codeStyle = m.code || DEFAULT_STYLE_MAP.code;
    appearance.value.emphasisStyle = m.emphasis || DEFAULT_STYLE_MAP.emphasis;
  }

  // 外观配置（双层容器 + 元素样式映射）
  const appearance = ref({
    // 正文参数
    fontSize: 16,
    lineSpacing: 1,
    // 双层容器
    contentBgColor: '#ffffff',
    contentPadding: 8,
    contentRadius: 15,
    outerBgColor: '#f5efe6',
    outerPadding: 16,
    outerRadius: 12,
    // 组件样式映射（由样式预设驱动，用户也可手动修改）
    h1Style: 'gradientTitle',
    h2Style: 'leftLineTitle',
    h3Style: 'softPillTitle',
    h4Style: 'softPillTitle',
    quoteStyle: 'quoteBlock',
    cardStyle: 'cardBox',
    dividerStyle: 'dividerSolid',
    listStyle: 'default',
    codeStyle: 'infoBox',
    emphasisStyle: 'default',
  });

  // 预设选项
  const bgPresets = {
    content: [
      { color: '#ffffff', name: '白' },
      { color: '#fef9f3', name: '米白' },
      { color: '#fff0f0', name: '浅粉' },
      { color: '#f0faf5', name: '浅绿' },
      { color: '#f5f0ff', name: '浅紫' },
    ],
    outer: [
      { color: '#ffffff', name: '白' },
      { color: '#f5efe6', name: '奶杏' },
      { color: '#e8f4fc', name: '浅蓝' },
      { color: '#fceee6', name: '浅橘' },
      { color: '#f0f0f0', name: '浅灰' },
    ]
  };

  // 标题样式预设（用于 H1/H2/H3 选择）
  const titleStylePresets = TITLE_STYLE_OPTIONS;

  const setAppearance = (key, value) => {
    if (key in appearance.value) {
      appearance.value[key] = value;
    }
  };

  // 编辑器内容
  const editorContent = ref('');

  // 当前选中的组件
  const selectedComponent = ref(null);

  // 获取当前主题颜色
  const currentThemeColor = computed(() => {
    return themes.value[currentTheme.value]?.color || '#0066ff';
  });

  const currentThemeLight = computed(() => {
    return themes.value[currentTheme.value]?.light || '#e6f0ff';
  });

  // 构建公众号兼容的 HTML 输出（供预览和复制共用）
  // 使用 table 布局（微信兼容），边框用单边属性，所有样式内联
  const buildWechatHTML = (editorHTML) => {
    if (!editorHTML || !editorHTML.trim()) return '';

    const T = currentThemeColor.value;
    const TL = currentThemeLight.value;
    const TC = '#fff';
    const app = appearance.value;
    const fs = app.fontSize; // 正文字号
    const lh = (1.8 * app.lineSpacing).toFixed(1); // 行高

    let out = [];
    let temp;
    if (typeof document !== 'undefined') {
      temp = document.createElement('div');
      temp.innerHTML = editorHTML;
    } else {
      return editorHTML; // SSR fallback
    }

    // 规范化：确保所有文本都在 <p> 标签内
    // 问题：原始HTML可能有 <br> 标签和文本节点作为直接子元素，导致丢失
    // 解决：遍历 childNodes，把文本节点和 <br> 标签包装成 <p> 标签
    const normalizeNodes = (container) => {
      const nodes = Array.from(container.childNodes);
      let currentP = null;
      
      for (const node of nodes) {
        // 文本节点
        if (node.nodeType === 3) {
          const text = node.textContent.trim();
          if (text) {
            if (!currentP) {
              currentP = document.createElement('p');
              container.insertBefore(currentP, node);
            }
            currentP.textContent += text + ' ';
          }
          container.removeChild(node);
          continue;
        }
        
        // <br> 标签：结束当前段落
        if (node.nodeName === 'BR') {
          currentP = null;
          container.removeChild(node);
          continue;
        }
        
        // 元素节点
        if (node.nodeType === 1) {
          // 块级元素：结束当前段落
          const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE', 'HR', 'DIV', 'SECTION'];
          if (blockTags.includes(node.tagName)) {
            currentP = null;
          }
          // 继续处理这个元素（它会留在 container 中）
        }
      }
    };
    
    normalizeNodes(temp);

    for (const child of temp.children) {
      // 普通段落
      if (child.tagName === 'P' && !child.classList.contains('editable-block')) {
        out.push(`<p style="margin:14px 0;line-height:${lh};color:#262626;font-size:${fs}px;text-align:justify;">${child.innerHTML}</p>`);
        continue;
      }

      // 分割线
      if (child.tagName === 'HR') {
        out.push(`<p><span style="display:inline-block;width:100%;height:1px;background-color:${TL};vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span></p>`);
        continue;
      }

      // 标题标签 H1/H2/H3 等：保留内容并加样式
      if (/^H[1-6]$/.test(child.tagName)) {
        const tag = child.tagName.toLowerCase();
        const sizeMap = { h1: '22px', h2: '20px', h3: '18px', h4: '16px', h5: '15px', h6: '14px' };
        out.push(`<${tag} style="margin:${tag === 'h1' ? '28px' : '24px'} 0 12px;font-size:${sizeMap[tag] || '16px'};font-weight:700;color:#222;line-height:${lh};">${child.innerHTML}</${tag}>`);
        continue;
      }

      // 列表
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        out.push(child.outerHTML);
        continue;
      }

      // 引用块
      if (child.tagName === 'BLOCKQUOTE') {
        out.push(`<blockquote style="border-left:4px solid ${T};background-color:#f7f7f7;padding:14px 18px;color:#595959;font-size:${fs}px;line-height:${lh};margin:16px 0;">${child.innerHTML}</blockquote>`);
        continue;
      }

      // 只处理 editable-block
      if (!child.classList.contains('editable-block')) {
        // 其他未知标签：原样输出，加基础样式
        out.push(`<section style="margin:14px 0;font-size:${fs}px;line-height:${lh};color:#262626;">${child.innerHTML}</section>`);
        continue;
      }

      const ds = child.getAttribute('data-style') || '';
      // 组件整体内容（用于直接取文本的组件）
      const txt = child.innerHTML;

      switch(ds) {
        case 'numberTitle': {
          const n = child.querySelector('.num');
          const t = child.querySelector('.title-text');
          const numTxt = n ? n.textContent.trim() : '';
          const textHtml = t ? t.innerHTML : '';
          // 【方案Beta】全部改用 flex（pillTitle 已验证微信支持 display:flex）
          out.push(`<section style="display:flex;align-items:center;margin:18px 0 10px;">` +
            `<span style="background-color:${T};color:${TC};display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;font-size:13px;font-weight:700;flex-shrink:0;">${numTxt}</span>` +
            `<span style="font-size:17px;font-weight:700;color:#222;margin-left:8px;">${textHtml}</span>` +
          `</section>`);
          break;
        }

        case 'gradientTitle': {
          // 渐变文字在微信不生效，用主题色加粗大字代替
          const titleText = child.querySelector('h2')?.textContent.trim() || child.textContent.trim();
          out.push(`<section style="margin:22px 0 12px;"><span style="font-size:20px;font-weight:700;color:${T};">${titleText}</span></section>`);
          break;
        }

        case 'tagTitle': {
          // 和编辑区一致：左边框标题（不是居中药丸）
          const titleHtml = child.querySelector('h2')?.innerHTML || child.textContent.trim();
          out.push(`<section style="border-left:4px solid ${T};padding-left:12px;margin:22px 0 12px;"><span style="font-size:18px;font-weight:700;color:#333;">${titleHtml}</span></section>`);
          break;
        }

        case 'pillTitle': {
          const p = child.querySelector('.pill');
          const t = child.querySelector('.pill-text');
          const pillTxt = p ? p.textContent.trim() : '';
          const textHtml = t ? t.innerHTML : '';
          // 【方案Alpha】pillTitle 回退 flex 内联样式，实测微信是否支持 flex
          // 其他组件保持 table 布局不动，方便对比验证
          out.push(`<section style="display:flex;align-items:center;margin:18px 0 10px;">` +
            `<span style="background-color:${T};color:${TC};display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 7px;border-radius:11px;font-size:12px;font-weight:700;flex-shrink:0;">${pillTxt}</span>` +
            `<span style="font-size:16px;font-weight:600;color:#222;margin-left:8px;">${textHtml}</span>` +
          `</section>`);
          break;
        }

        case 'softPillTitle': {
          // 和编辑区一致：灰色标签 + 文字（只取标签后的文字）
          const clone = child.cloneNode(true);
          const tagSpan = clone.querySelector('span');
          if (tagSpan) tagSpan.remove();
          const titleText = clone.textContent.trim();
          out.push(`<section style="margin:20px 0 12px;"><span style="background-color:#f0f0f0;color:#666;padding:2px 10px;border-radius:10px;font-size:11px;margin-right:4px;">标签</span><span style="font-size:16px;font-weight:600;">${titleText}</span></section>`);
          break;
        }

        case 'leftLineTitle': {
          // 和编辑区一致：左边框标题
          const lt = child.querySelector('h2');
          const ltxt = lt ? lt.textContent.trim() : child.textContent.trim();
          out.push(`<section style="border-left:4px solid ${T};padding-left:12px;margin:20px 0 12px;"><span style="font-size:17px;font-weight:700;color:#333;line-height:1.4;display:inline-block;">${ltxt}</span></section>`);
          break;
        }

        case 'rightLineTitle': {
          const rt = child.querySelector('h2');
          const rtxt = rt ? rt.textContent.trim() : child.textContent.trim();
          out.push(`<section style="border-right:4px solid ${T};padding-right:12px;margin:20px 0 12px;text-align:right;"><span style="font-size:17px;font-weight:700;color:#333;line-height:1.4;display:inline-block;">${rtxt}</span></section>`);
          break;
        }

        case 'centerLineTitle': {
          // 和编辑区一致：居中下划线标题
          const ct = child.querySelector('h2');
          const ctxt = ct ? ct.textContent.trim() : child.textContent.trim();
          out.push(`<section style="text-align:center;margin:20px 0 12px;"><span style="font-size:17px;font-weight:700;border-bottom:2px solid ${T};padding-bottom:8px;color:#333;display:inline-block;">${ctxt}</span></section>`);
          break;
        }

        case 'circleIconTitle': {
          const spans = Array.from(child.children).filter(c => c.tagName === 'SPAN');
          const iconTxt = (spans.length > 0 ? spans[0].textContent.trim() : '') || '💡';
          const titleText = spans.length > 1 ? (spans[1].innerHTML || spans[1].textContent.trim() || '') : '';
          out.push(`<section style="display:flex;align-items:center;margin:16px 0 10px;">` +
            `<span style="background-color:${T};color:${TC};display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:13px;flex-shrink:0;">${iconTxt}</span>` +
            `<span style="font-size:17px;font-weight:700;color:#333;margin-left:10px;">${titleText}</span>` +
          `</section>`);
          break;
        }

        case 'dotLine': {
          const textHtml = child.querySelector('.dot-text')?.innerHTML || child.textContent.trim() || '';
          // 用 border-bottom 画横线（替代字符画线，避免 font-size:1px 被微信过滤）
          out.push(`<section style="display:flex;align-items:center;margin:16px 0;">` +
            `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${T};flex-shrink:0;"></span>` +
            `<span style="flex:1;height:0;border-top:1px solid #ddd;margin:0 8px;"></span>` +
            `<span style="font-size:15px;color:#444;white-space:nowrap;flex-shrink:0;">${textHtml}</span>` +
          `</section>`);
          break;
        }

        case 'underlineTitle': {
          // 和编辑区一致：内联下划线标题（非居中）
          const utxt = child.querySelector('span')?.textContent.trim() || child.textContent.trim();
          out.push(`<section style="margin:18px 0 10px;"><span style="font-size:17px;font-weight:700;border-bottom:2px solid ${T};padding-bottom:3px;color:#333;">${utxt}</span></section>`);
          break;
        }

        case 'cardTitle': {
          // 和编辑区一致：内联紧凑卡片（不是全宽）
          const ctxt = child.textContent.trim();
          out.push(`<section style="margin:16px 0 10px;"><span style="display:inline-block;background-color:${TL};border-top:1px solid ${T};border-right:1px solid ${T};border-bottom:1px solid ${T};border-left:1px solid ${T};border-radius:8px;padding:7px 16px;font-weight:700;color:${T};font-size:15px;">${ctxt}</span></section>`);
          break;
        }

        case 'stepTitle': {
          const allChildren = child.children;
          let stepTxt = '', stepTextHtml = '';
          for (const c of allChildren) {
            if (c.tagName === 'B' || c.classList?.contains('step-num')) {
              stepTxt = c.textContent.trim();
            } else if (c.tagName === 'SPAN' || c.classList?.contains('step-text')) {
              stepTextHtml = c.innerHTML || c.textContent.trim();
            }
          }
          out.push(`<section style="display:flex;align-items:center;margin:16px 0 10px;">` +
            `<span style="color:${T};font-size:18px;font-weight:800;flex-shrink:0;">${stepTxt}</span>` +
            `<span style="font-weight:700;font-size:16px;color:#222;margin-left:10px;">${stepTextHtml}</span>` +
          `</section>`);
          break;
        }

        case 'arrowTitle': {
          const arrowIcon = child.querySelector('.arrow-icon')?.textContent.trim() || '→';
          const arrowText = child.querySelector('.arrow-text')?.innerHTML || child.textContent.trim();
          out.push(`<section style="margin:18px 0 10px;"><span style="color:${T};font-size:16px;font-weight:700;">${arrowIcon}</span><span style="font-size:16px;font-weight:700;color:#222;margin-left:8px;">${arrowText}</span></section>`);
          break;
        }

        case 'doubleLineTitle': {
          const dlt = child.querySelector('h2');
          const dltxt = dlt ? dlt.textContent.trim() : child.textContent.trim();
          out.push(`<section style="text-align:center;margin:20px 0 12px;"><span style="display:inline-block;border-left:4px solid ${T};border-right:4px solid ${T};padding:4px 12px;font-size:17px;font-weight:700;color:#333;">${dltxt}</span></section>`);
          break;
        }

        case 'diamondTitle': {
          const dmSpans = Array.from(child.children).filter(c => c.tagName === 'SPAN');
          const dmText = dmSpans.length > 1 ? (dmSpans[1].innerHTML || dmSpans[1].textContent.trim()) : child.textContent.trim();
          out.push(`<section style="display:flex;align-items:center;margin:16px 0 10px;"><span style="color:${T};font-size:14px;flex-shrink:0;">◆</span><span style="font-weight:700;font-size:16px;color:#222;margin-left:8px;">${dmText}</span></section>`);
          break;
        }

        case 'timelineItem': {
          const tlContent = child.querySelector('.tl-content')?.innerHTML || txt;
          out.push(`<section style="display:flex;align-items:flex-start;margin:12px 0;padding-left:12px;"><span style="width:10px;height:10px;border-radius:50%;background-color:${T};flex-shrink:0;margin-top:6px;display:inline-block;"></span><span style="font-size:14px;color:#444;line-height:1.7;margin-left:12px;flex:1;">${tlContent}</span></section>`);
          break;
        }

        case 'goldenQuote': {
          const gqDivs = child.querySelectorAll('div');
          const gqText = gqDivs.length > 1 ? (gqDivs[1].innerHTML || gqDivs[1].textContent.trim()) : '';
          out.push(`<section style="text-align:center;padding:24px 20px;margin:20px 0;background-color:${TL};border-radius:8px;"><span style="font-size:32px;color:${T};line-height:1;">&ldquo;</span><span style="font-size:16px;color:#333;line-height:1.8;">${gqText}</span></section>`);
          break;
        }

        case 'checklistBox': {
          const items = child.querySelectorAll(':scope > div');
          let clHTML = '';
          items.forEach(item => {
            const spans = item.querySelectorAll('span');
            const itemText = spans.length > 1 ? (spans[1].innerHTML || spans[1].textContent.trim()) : item.textContent.trim();
            clHTML += `<span style="display:flex;align-items:flex-start;margin:6px 0;font-size:14px;color:#444;"><span style="color:${T};flex-shrink:0;font-weight:700;">☑</span><span style="margin-left:8px;">${itemText}</span></span>`;
          });
          out.push(`<section style="background-color:${TL};border-radius:8px;padding:14px 18px;margin:14px 0;">${clHTML}</section>`);
          break;
        }

        case 'leadParagraph': {
          out.push(`<section style="background-color:${TL};border-left:4px solid ${T};padding:14px 18px;margin:16px 0;font-size:${Math.max(15, app.fontSize + 1)}px;color:#555;line-height:1.8;">${txt}</section>`);
          break;
        }

        case 'dividerOrnate': {
          out.push(`<p style="text-align:center;margin:24px 0;color:#ccc;font-size:14px;letter-spacing:8px;">✽ ✽ ✽</p>`);
          break;
        }

        case 'cardBox': {
          out.push(`<section style="border-top:1px solid #e0e6ed;border-right:1px solid #e0e6ed;border-bottom:1px solid #e0e6ed;border-left:1px solid #e0e6ed;background-color:#ffffff;padding:20px;margin:16px 0;">${txt}</section>`);
          break;
        }

        case 'highlightBlock': {
          // 取纯文字（去掉开头的 ◆ span，避免双菱形）
          const clone = child.cloneNode(true);
          const firstSpan = clone.querySelector('span:first-child');
          if (firstSpan) firstSpan.remove();
          const textOnly = clone.textContent.trim() || txt;
          out.push(`<section style="background-color:${TL};border-radius:8px;padding:12px 16px;margin:14px 0;font-size:14px;color:#444;line-height:1.8;display:flex;align-items:flex-start;"><span style="font-size:16px;flex-shrink:0;">◆</span>&nbsp;${textOnly}</section>`);
          break;
        }

        case 'quoteBlock': {
          out.push(`<blockquote style="border-left:4px solid ${T};background-color:#f7f7f7;padding:14px 18px;color:#595959;font-size:16px;line-height:1.8;margin:16px 0;">${child.textContent}</blockquote>`);
          break;
        }

        case 'infoBox': {
          out.push(`<section style="background-color:${TL};border-top:1px solid ${TL};border-right:1px solid ${TL};border-bottom:1px solid ${TL};border-left:1px solid ${TL};border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;">${txt}</section>`);
          break;
        }

        case 'disclaimer': {
          out.push(`<p style="color:#999;font-size:12px;text-align:left;margin:12px 0;">本文为个人真实职场感悟，内容真实原创，仅由AI辅助优化排版、梳理语句。</p>`);
          break;
        }

        case 'dividerSolid': {
          out.push(`<p><span style="display:inline-block;width:100%;height:1px;background-color:${TL};vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span></p>`);
          break;
        }

        case 'dividerDashed': {
          out.push(`<p style="border-top:1px dashed ${T};margin:20px 0;height:0;font-size:0;line-height:0;"></p>`);
          break;
        }

        case 'dividerDot': {
          // 用 border-bottom 画点状线（替代浅色字符，避免不可见）
          out.push(`<p style="margin:24px 0;"><span style="display:block;border-bottom:2px dotted #ccc;height:0;font-size:1px;line-height:0;">&nbsp;</span></p>`);
          break;
        }

        case 'dividerThick': {
          out.push(`<p><span style="display:inline-block;width:100%;height:2px;background-color:${T};opacity:0.25;vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span></p>`);
          break;
        }

        case 'spacer': {
          out.push(`<p style="margin:12px 0;">&nbsp;</p>`);
          break;
        }

        default:
          out.push(child.outerHTML);
      }
    }

    return out.join('');
  };

  // 组件 HTML 模板生成器（编辑区使用，带 data-style 属性）
  // text 参数：替换默认文字（不传则用默认示例文字）
  const componentHTML = (comp, text, stepNum) => {
    const T = currentThemeColor.value;
    const TL = currentThemeLight.value;
    const txt = text || '';

    switch (comp.type) {
      case 'numberTitle': {
        const num = comp.num || '01';
        const title = txt || '编号标题';
        return `<div class="editable-block style-number-title" data-style="numberTitle"><span class="num">${num}</span><span class="title-text">${title}</span></div>`;
      }

      case 'gradientTitle': {
        const gt = txt || '渐变标题';
        return `<div class="editable-block style-gradient-title" data-style="gradientTitle"><h2 style="font-size:20px;font-weight:700;background:linear-gradient(90deg,${T},#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:22px 0 12px;">${gt}</h2></div>`;
      }

      case 'tagTitle': {
        const tt = txt || '标签标题';
        return `<div class="editable-block style-tag-title" data-style="tagTitle"><h2 style="font-size:18px;font-weight:700;border-left:4px solid ${T};padding-left:12px;margin:22px 0 12px;color:#333;">${tt}</h2></div>`;
      }

      case 'pillTitle': {
        const pt = txt || '胶囊标题文字';
        return `<div class="editable-block style-pill-title" data-style="pillTitle"><span class="pill">1</span><span class="pill-text">${pt}</span></div>`;
      }

      case 'softPillTitle': {
        const sp = txt || '软底胶囊标题';
        return `<div class="editable-block style-soft-pill-title" data-style="softPillTitle"><span style="background:#f0f0f0;color:#666;padding:2px 10px;border-radius:10px;font-size:11px">标签</span> ${sp}</div>`;
      }

      case 'leftLineTitle': {
        const lt = txt || '左竖线标题';
        return `<div class="editable-block style-left-line-title" data-style="leftLineTitle" style="margin:20px 0 12px"><h2 style="display:inline-block;border-left:4px solid ${T};padding-left:12px;font-size:17px;font-weight:700;line-height:1.4;color:#333;margin:0;">${lt}</h2></div>`;
      }

      case 'rightLineTitle': {
        const rt = txt || '右竖线标题';
        return `<div class="editable-block style-right-line-title" data-style="rightLineTitle" style="text-align:right;margin:20px 0 12px"><h2 style="display:inline-block;text-align:right;border-right:4px solid ${T};padding-right:12px;font-size:17px;font-weight:700;line-height:1.4;color:#333;margin:0;">${rt}</h2></div>`;
      }

      case 'centerLineTitle': {
        const ct = txt || '居中标题';
        return `<div class="editable-block style-center-title" data-style="centerLineTitle" style="margin:20px 0 12px;text-align:center"><h2 style="font-size:17px;font-weight:700;display:inline-block;border-bottom:2px solid ${T};padding-bottom:8px;color:#333;margin:0;">${ct}</h2></div>`;
      }

      case 'circleIconTitle': {
        const cit = txt || '圆形图标标题';
        return `<div class="editable-block style-circle-icon-title" data-style="circleIconTitle" style="display:flex;align-items:center;gap:10px;margin:16px 0 10px"><span style="width:26px;height:26px;border-radius:50%;background:${T};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">💡</span><span style="font-size:17px;font-weight:700;color:#333">${cit}</span></div>`;
      }

      case 'dotLine': {
        const dt = txt || '圆点横线内容';
        return `<div class="editable-block style-dot-line" data-style="dotLine"><span class="dot"></span><span class="line"></span><span style="font-size:15px;color:#444">${dt}</span></div>`;
      }

      case 'underlineTitle': {
        const ut = txt || '下划线标题';
        return `<div class="editable-block style-underline-title" data-style="underlineTitle" style="margin:18px 0 10px"><span style="font-size:17px;font-weight:700;border-bottom:2px solid ${T};padding-bottom:3px;">${ut}</span></div>`;
      }

      case 'cardTitle': {
        const cdt = txt || '卡片标题';
        return `<div class="editable-block style-card-title" data-style="cardTitle" style="margin:16px 0 10px"><span style="display:inline-block;background:${TL};border:1px solid ${T};border-radius:8px;padding:7px 16px;font-weight:700;color:${T};font-size:15px;">${cdt}</span></div>`;
      }

      case 'stepTitle': {
        const st = txt || '步骤标题';
        const sn = stepNum && !isNaN(stepNum) ? stepNum : 1;
        return `<div class="editable-block style-step-title" data-style="stepTitle" style="display:flex;align-items:center;gap:10px;margin:16px 0 10px"><b style="color:${T};font-size:18px;font-weight:800">${sn}</b><span style="font-weight:700;font-size:16px;color:#222">${st}</span></div>`;
      }

      case 'arrowTitle': {
        const at = txt || '箭头标题';
        return `<div class="editable-block style-arrow-title" data-style="arrowTitle" style="margin:18px 0 10px"><span class="arrow-icon" style="color:${T};font-size:16px;font-weight:700">→</span><span class="arrow-text" style="font-size:16px;font-weight:700;color:#222;margin-left:8px">${at}</span></div>`;
      }

      case 'doubleLineTitle': {
        const dlt = txt || '双竖线标题';
        return `<div class="editable-block style-double-line-title" data-style="doubleLineTitle" style="text-align:center;margin:20px 0 12px"><h2 style="display:inline-block;border-left:4px solid ${T};border-right:4px solid ${T};padding:4px 12px;font-size:17px;font-weight:700;color:#333;margin:0;">${dlt}</h2></div>`;
      }

      case 'diamondTitle': {
        const dmt = txt || '菱形标题';
        return `<div class="editable-block style-diamond-title" data-style="diamondTitle" style="display:flex;align-items:center;gap:8px;margin:16px 0 10px"><span style="color:${T};font-size:14px;flex-shrink:0">◆</span><span style="font-weight:700;font-size:16px;color:#222">${dmt}</span></div>`;
      }

      case 'timelineItem': {
        const tlt = txt || '时间节点内容';
        return `<div class="editable-block style-timeline-item" data-style="timelineItem" style="display:flex;align-items:flex-start;gap:12px;margin:12px 0;padding-left:12px"><span class="tl-dot" style="width:10px;height:10px;border-radius:50%;background:${T};flex-shrink:0;margin-top:6px"></span><div class="tl-content" style="flex:1;font-size:14px;color:#444;line-height:1.7">${tlt}</div></div>`;
      }

      case 'goldenQuote': {
        const gqt = txt || '金句名言，字字珠玑，发人深省。';
        return `<div class="editable-block style-golden-quote" data-style="goldenQuote" style="text-align:center;padding:24px 20px;margin:20px 0;background:${TL};border-radius:8px"><div style="font-size:32px;color:${T};line-height:1;margin-bottom:8px;font-family:serif">&ldquo;</div><div style="font-size:16px;color:#333;line-height:1.8">${gqt}</div></div>`;
      }

      case 'checklistBox': {
        const clt = txt || '待办事项 1\n待办事项 2\n待办事项 3';
        const items = clt.split('\n').filter(s => s.trim());
        const listHTML = items.map(item => `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:14px;color:#444"><span style="color:${T};flex-shrink:0;font-weight:700">☑</span><span>${item.trim()}</span></div>`).join('');
        return `<div class="editable-block style-checklist-box" data-style="checklistBox" style="background:${TL};border-radius:8px;padding:14px 18px;margin:14px 0">${listHTML}</div>`;
      }

      case 'leadParagraph': {
        const lpt = txt || '这是文章导语，用于概括全文要点，吸引读者继续阅读。';
        return `<div class="editable-block style-lead-paragraph" data-style="leadParagraph" style="background:${TL};border-left:4px solid ${T};padding:14px 18px;margin:16px 0;font-size:${Math.max(15, (appearance.value?.fontSize || 16) + 1)}px;color:#555;line-height:1.8">${lpt}</div>`;
      }

      case 'dividerOrnate':
        return `<div class="editable-block style-divider style-divider-ornate" data-style="dividerOrnate" style="text-align:center;margin:24px 0;color:#ccc;font-size:14px;letter-spacing:8px">✽ ✽ ✽</div>`;

      case 'quoteBlock': {
        const qt = txt || '引用一段话或名人名言，让文章更有说服力和深度。';
        return `<div class="editable-block style-quote-block" data-style="quoteBlock">${qt}</div>`;
      }

      case 'highlightBlock': {
        const ht = txt || '这是需要重点强调的内容，会以色块加重的形式显示，吸引读者注意力。';
        return `<div class="editable-block style-highlight-block" data-style="highlightBlock"><span style="font-size:16px">◆</span><span>${ht}</span></div>`;
      }

      case 'cardBox': {
        const cbt = txt || '这里是卡片框内的内容，可以放任何文字、图片或其他元素。';
        return `<div class="editable-block style-card-box" data-style="cardBox">${cbt}</div>`;
      }

      case 'infoBox': {
        const it = txt || '这是一条提示信息。';
        return `<div class="editable-block style-info-box" data-style="infoBox" style="background:${TL};border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;border:1px solid ${TL};">ℹ️ ${it}</div>`;
      }

      case 'dividerSolid':
        return `<div class="editable-block style-divider" data-style="dividerSolid" style="height:1px;background:${TL}"></div>`;

      case 'dividerDashed':
        return `<div class="editable-block style-divider" data-style="dividerDashed" style="height:0px;border-top:1px dashed ${T};margin:20px 0;"></div>`;

      case 'dividerDot':
        return `<div class="editable-block style-divider" data-style="dividerDot" style="height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 3px,transparent 3px,transparent 7px);opacity:0.6"></div>`;

      case 'dividerThick':
        return `<div class="editable-block style-divider" data-style="dividerThick" style="height:2px;background:${T};opacity:0.25;border-radius:1px"></div>`;

      case 'disclaimer':
        return `<div class="editable-block style-disclaimer" data-style="disclaimer">本文为个人真实职场感悟，内容真实原创，仅由AI辅助优化排版、梳理语句。</div>`;

      case 'spacer':
        return `<div data-style="spacer" style="height:24px;"></div>`;

      default:
        return `<p>${comp.name || '组件'}</p>`;
    }
  };

  // 自动计算步骤标题下一个编号（扫描编辑器内容中所有 .style-step-title）
  const getNextStepNum = () => {
    if (typeof document === 'undefined') return 1;
    const tmp = document.createElement('div');
    tmp.innerHTML = editorContent.value || '';
    const blocks = tmp.querySelectorAll('.style-step-title');
    let maxNum = 0;
    for (const block of blocks) {
      const b = block.querySelector('b');
      if (b) {
        const num = parseInt(b.textContent.trim(), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    return maxNum + 1;
  };

  // 预览用计算属性：使用 buildWechatHTML() 输出，确保「预览 = 微信渲染效果」完全一致
  // previewHTML：优先用 buildWechatHTML 转微信格式，出错时降级显示原始内容并附错误提示
  const previewHTML = computed(() => {
    const app = appearance.value;

    if (!editorContent.value || !editorContent.value.trim()) {
      return `<div style="background-color:${app.outerBgColor};padding:${app.outerPadding}px;border-radius:${app.outerRadius}px;display:flex;align-items:center;justify-content:center;min-height:300px;"><p style="color:#bbb;text-align:center;">在中间编辑区输入内容，或从左侧选择组件插入...</p></div>`;
    }

    try {
      const innerContent = buildWechatHTML(editorContent.value);

      const fs = app.fontSize;
      const cpad = app.contentPadding * (fs / 16);
      const hpad = Math.max(16, app.contentPadding * 1.5) * (fs / 16);
      const lh = (1.8 * app.lineSpacing).toFixed(1);

      return `<div style="background-color:${app.outerBgColor};padding:${app.outerPadding}px;border-radius:${app.outerRadius}px;">
<div style="background-color:${app.contentBgColor};border-radius:${app.contentRadius}px;padding:${cpad}px ${hpad}px;font-size:${fs}px;line-height:${lh};color:#262626;">
${innerContent}
</div>
</div>`;
    } catch (e) {
      // 出错时降级：显示原始内容 + 错误提示
      const fs = app.fontSize;
      const cpad = app.contentPadding * (fs / 16);
      const hpad = Math.max(16, app.contentPadding * 1.5) * (fs / 16);
      return `<div style="background-color:${app.outerBgColor};padding:${app.outerPadding}px;border-radius:${app.outerRadius}px;">
<div style="background-color:${app.contentBgColor};border-radius:${app.contentRadius}px;padding:${cpad}px ${hpad}px;font-size:${fs}px;line-height:${(1.8*app.lineSpacing).toFixed(1)};color:#262626;">
<p style="color:red;font-size:13px;background:#fee;padding:8px 12px;border-radius:6px;margin:14px 0;">⚠️ previewHTML 渲染出错：${e.message || e}</p>
${editorContent.value}
</div>
</div>`;
    }
  });

  return {
    // 主题色系统
    currentTheme,
    themes,
    themeList,
    customThemes,
    createCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    setTheme,
    currentThemeColor,
    currentThemeLight,
    // 样式预设系统
    currentStylePreset,
    customStylePresets,
    allStylePresets,
    stylePresetList,
    createStylePreset,
    deleteStylePreset,
    updateStylePreset,
    setStylePreset,
    // 编辑器
    editorContent,
    selectedComponent,
    buildWechatHTML,
    componentHTML,
    getNextStepNum,
    previewHTML,
    // 外观配置
    appearance,
    setAppearance,
    bgPresets,
    // 组件样式选项（供下拉/对话框使用）
    TITLE_STYLE_OPTIONS,
    QUOTE_STYLE_OPTIONS,
    CARD_STYLE_OPTIONS,
    DIVIDER_STYLE_OPTIONS,
    LIST_STYLE_OPTIONS,
    CODE_STYLE_OPTIONS,
    EMPHASIS_STYLE_OPTIONS,
    DEFAULT_STYLE_MAP,
  };
});

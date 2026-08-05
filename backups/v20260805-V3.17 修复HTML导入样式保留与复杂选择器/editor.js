import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TITLE_STYLE_OPTIONS, QUOTE_STYLE_OPTIONS, CARD_STYLE_OPTIONS, DIVIDER_STYLE_OPTIONS } from '../constants/catalog.js';

// ═══════════════════════════════════════════════════════════
//  组件样式预设（供主题 styleMap 选择）
// ═══════════════════════════════════════════════════════════
// 标题/引用/卡片/分割线 样式选项已从单一数据源 src/constants/catalog.js 派生，
// 保证「主题内可选择的」与「左侧栏显示的 / 弹窗唤起的」完全一致。

const LIST_STYLE_OPTIONS = [
  { id:'default',    name:'默认圆点', icon:'•' },
  { id:'numbered',   name:'数字编号', icon:'1.' },
  { id:'dash',       name:'短横线',   icon:'—' },
];

const CODE_STYLE_OPTIONS = [
  { id:'cardBox',        name:'白底卡片框', icon:'📦' },
  { id:'highlightBlock', name:'底色无框线', icon:'🎨' },
];

const EMPHASIS_STYLE_OPTIONS = [
  { id:'default',   name:'粗体',       icon:'B' },
  { id:'color',     name:'主题色粗体',  icon:'A' },
  { id:'highlight', name:'背景色高亮',  icon:'🖍' },
];

// 默认样式映射（无预设时用）
const DEFAULT_STYLE_MAP = {
  h1: 'leftLineTitle', h2: 'leftLineTitle', h3: 'tagTitle', h4: 'tagTitle',
  quote: 'quoteBlock', card: 'cardBox', divider: 'dividerSolid',
  list: 'default', code: 'cardBox', emphasis: 'default', table: 'simpleTable',
};

// 清洗外部 HTML，去掉脚本/样式标签、事件属性、危险协议，保留内联样式
// 用于「内容输入」粘贴/导入 HTML 后原样渲染到编辑器与微信复制产物
// 清洗危险标签/属性（给 convertHtmlToWechatCompatible 最后一步用）
function sanitizeDoc(doc) {
  const forbidden = ['script','style','meta','link','head','iframe','object','embed','frame','frameset','base','noscript','svg','math','video','audio'];
  forbidden.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  });
  const walk = (node) => {
    if (!node || !node.childNodes) return;
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === 1) { // ELEMENT_NODE
        Array.from(child.attributes || []).forEach(attr => {
          const n = (attr.name || '').toLowerCase();
          if (n.startsWith('on')) {
            child.removeAttribute(attr.name);
          } else if (n === 'href' || n === 'src') {
            const v = (attr.value || '').trim().toLowerCase();
            if (v.startsWith('javascript:') || v.startsWith('data:text/html')) {
              child.removeAttribute(attr.name);
            }
          } else if (n === 'style') {
            const sv = (attr.value || '').toLowerCase();
            if (sv.includes('expression') || sv.includes('javascript:') || sv.includes('@import')) {
              child.removeAttribute(attr.name);
            }
          }
        });
        walk(child);
      }
    });
  };
  walk(doc.body);
}

export function sanitizeHtmlForWechat(html) {
  try {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    sanitizeDoc(doc);
    return doc.body.innerHTML;
  } catch (e) {
    return html || '';
  }
}

// 解析简单 CSS：只处理 element、.class、#id、tag.class、tag#id 选择器
function parseSimpleCss(cssText) {
  const rules = [];
  if (!cssText) return rules;
  const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned.split('}').forEach(block => {
    const idx = block.indexOf('{');
    if (idx === -1) return;
    const selectors = block.slice(0, idx).split(',').map(s => s.trim()).filter(Boolean);
    const declarations = block.slice(idx + 1).trim();
    if (!selectors.length || !declarations) return;
    rules.push({ selectors, declarations });
  });
  return rules;
}

function simplifySelector(selector) {
  const s = selector.trim();
  if (s.includes('[') || s.includes(']')) return null;
  if (s.includes(':') || s.includes('::')) return null;
  if (s.includes('@')) return null;
  if (/[>+~]/.test(s)) return null;
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' ');
  return null;
}

function parseDecls(decls) {
  const out = [];
  if (!decls) return out;
  decls.split(';').forEach(part => {
    const idx = part.indexOf(':');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim().toLowerCase();
    const v = part.slice(idx + 1).trim();
    if (k) out.push({ k, v });
  });
  return out;
}

function declMapToString(map) {
  return Array.from(map.entries()).map(([k, v]) => `${k}:${v}`).join(';');
}

function mergeInlineStyles(base, override) {
  const map = new Map(parseDecls(base).map(d => [d.k, d.v]));
  parseDecls(override).forEach(d => map.set(d.k, d.v));
  return declMapToString(map);
}

function extractCssVars(rules) {
  const vars = new Map();
  rules.forEach(rule => {
    parseDecls(rule.declarations).forEach(d => {
      if (d.k.startsWith('--')) vars.set(d.k, d.v);
    });
  });
  return vars;
}

// 把 ::before / ::after 规则转成真实子元素（时间线竖线、圆点、列表小圆点等）
function applyPseudoElements(root, rules) {
  // 收集所有伪元素规则
  const pseudoRules = [];
  rules.forEach(rule => {
    rule.selectors.forEach(selector => {
      const m = selector.trim().match(/^(.+?)(::before|::after)$/);
      if (!m) return;
      const baseSel = m[1].trim();
      const simple = simplifySelector(baseSel);
      // 复杂基础选择器（如 .timeline > .item）尝试原 selector 匹配
      if (!simple && /[:\[@]/.test(baseSel)) return;
      pseudoRules.push({ baseSel: simple || baseSel, position: m[2], declarations: rule.declarations });
    });
  });
  if (!pseudoRules.length) return;

  pseudoRules.forEach(({ baseSel, position, declarations }) => {
    let targets;
    try { targets = Array.from(root.querySelectorAll(baseSel)); } catch { return; }
    const decls = parseDecls(declarations);
    const contentDecl = decls.find(d => d.k === 'content');
    const styleMap = new Map(decls.filter(d => d.k !== 'content').map(d => [d.k, d.v]));

    targets.forEach(target => {
      const span = root.ownerDocument.createElement('span');
      // 默认 inline-block，有宽高/定位时自动撑开
      if (!styleMap.has('display')) styleMap.set('display', 'inline-block');
      span.setAttribute('style', declMapToString(styleMap));
      if (contentDecl && contentDecl.v && contentDecl.v !== "''" && contentDecl.v !== '""') {
        const text = contentDecl.v.replace(/^['"]|['"]$/g, '').replace(/\\"/g, '"');
        span.textContent = text;
      }
      if (position === '::before') {
        target.insertBefore(span, target.firstChild);
      } else {
        target.appendChild(span);
      }
    });
  });
}

// 删除微信无法正确渲染的固定定位装饰层（背景纹理、飘落叶片等）
function removeFixedDecorations(root) {
  root.querySelectorAll('*').forEach(el => {
    const style = el.getAttribute('style') || '';
    if (!/position\s*:\s*fixed/i.test(style)) return;
    // 保留可能是真正需要的固定元素（极少）；装饰层特征：z-index 负、pointer-events:none、空或 class 含 bg/leaf
    const isDecorative = /z-index\s*:\s*-|pointer-events\s*:\s*none/i.test(style) ||
                         /\bbg-|\bleaf|\bfalling/i.test(el.className || '');
    if (isDecorative) el.remove();
  });
}

function substituteCssVars(root, vars) {
  if (!vars.size) return;
  const varRegex = /var\s*\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g;
  root.querySelectorAll('*').forEach(el => {
    const style = el.getAttribute('style') || '';
    if (!style.includes('var(')) return;
    const newStyle = style.replace(varRegex, (match, varName, fallback) => {
      if (vars.has(varName)) return vars.get(varName);
      return fallback ? fallback.trim() : match;
    });
    el.setAttribute('style', newStyle);
  });
}

function applyCssRules(root, rules) {
  const elMap = new Map();
  rules.forEach(rule => {
    rule.selectors.forEach(selector => {
      const simple = simplifySelector(selector);
      // 简单选择器直接走；复杂选择器（后代/子元素/三级等）只要不含伪类/属性/@，也尝试原 selector 匹配
      let useSelector = simple;
      if (!simple) {
        const s = selector.trim();
        if (/[:\[@]/.test(s)) return;
        useSelector = s;
      }
      try {
        root.querySelectorAll(useSelector).forEach(el => {
          const cur = elMap.get(el) || '';
          elMap.set(el, cur ? cur + ';' + rule.declarations : rule.declarations);
        });
      } catch {}
    });
  });
  elMap.forEach((decls, el) => {
    const existing = el.getAttribute('style') || '';
    el.setAttribute('style', mergeInlineStyles(decls, existing));
  });
}

// 微信不支持渐变背景，提取渐变首色标作为纯色 fallback，避免白字落在白底
function flattenGradients(root) {
  const gradRe = /(linear|radial|conic)-gradient\s*\(/i;
  const hexRe = /#[0-9a-f]{3,6}/i;
  root.querySelectorAll('*').forEach(el => {
    const style = el.getAttribute('style') || '';
    if (!gradRe.test(style)) return;
    const firstHex = style.match(hexRe);
    const fallback = firstHex ? firstHex[0] : '#cccccc';
    const kept = parseDecls(style).filter(d => {
      const k = d.k;
      if (k === 'background' || k === 'background-image') return !gradRe.test(d.v);
      return true;
    });
    // 相同时 key 后者覆盖前者
    const map = new Map(kept.map(d => [d.k, d.v]));
    map.set('background-color', fallback);
    el.setAttribute('style', declMapToString(map));
  });
}

function convertFlexGridToTable(root) {
  const convertContainer = (el) => {
    const children = Array.from(el.children).filter(c => c.nodeType === 1);
    if (!children.length) return;
    const style = el.getAttribute('style') || '';
    const map = new Map(parseDecls(style).map(d => [d.k, d.v]));
    const display = map.get('display') || '';
    if (!display.includes('flex') && !display.includes('grid')) return;

    const flexWrap = (map.get('flex-wrap') || '').toLowerCase();
    const flexDirection = (map.get('flex-direction') || 'row').toLowerCase();

    // 保留视觉样式，移除布局属性
    const cleanMap = new Map(map);
    ['display','flex-direction','flex-wrap','justify-content','align-items','gap',
     'grid-template-columns','grid-template-rows','grid-gap','row-gap','column-gap'].forEach(k => cleanMap.delete(k));
    const containerStyle = declMapToString(cleanMap);

    // flex-wrap 用 inline-block 降级（标签云等）
    if (display.includes('flex') && flexWrap.includes('wrap')) {
      el.setAttribute('style', containerStyle);
      children.forEach(child => {
        const childStyle = child.getAttribute('style') || '';
        child.setAttribute('style', mergeInlineStyles(childStyle, 'display:inline-block;vertical-align:top;'));
      });
      return;
    }

    // flex 纵向直接保留块级
    if (display.includes('flex') && flexDirection.includes('column')) {
      el.setAttribute('style', containerStyle);
      return;
    }

    // 横向 flex / grid → table
    let cols = children.length;
    if (display.includes('grid')) {
      const tpl = (map.get('grid-template-columns') || '').trim();
      cols = Math.max(1, tpl.split(/\s+/).filter(Boolean).length || 2);
    }

    const doc = el.ownerDocument;
    const table = doc.createElement('table');
    table.setAttribute('style', `width:100%;border-collapse:collapse;${containerStyle}`);

    for (let i = 0; i < children.length; i += cols) {
      const tr = doc.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const child = children[i + j];
        const td = doc.createElement('td');
        td.setAttribute('style', `vertical-align:top;padding:4px;width:${child ? (100 / cols).toFixed(2) : 0}%;`);
        if (child) {
          const childMap = new Map(parseDecls(child.getAttribute('style') || '').map(d => [d.k, d.v]));
          ['display','flex','flex-basis','flex-grow','flex-shrink'].forEach(k => childMap.delete(k));
          child.setAttribute('style', declMapToString(childMap));
          td.appendChild(child);
        }
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    el.innerHTML = '';
    el.appendChild(table);
    el.setAttribute('style', containerStyle);
  };

  // 自下而上转换，避免 live collection 混乱
  const containers = Array.from(root.querySelectorAll('*')).filter(el => {
    const display = (el.getAttribute('style') || '').toLowerCase();
    return display.includes('display:flex') || display.includes('display:grid') || display.includes('display: flex') || display.includes('display: grid');
  });
  // 先处理深层嵌套
  containers.sort((a, b) => b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  containers.forEach(convertContainer);
}

// 将外部 HTML 转成微信兼容格式：CSS 内联、flex/grid 转 table、button 转 div、相对 URL 补全
export function convertHtmlToWechatCompatible(html, baseUrl = '') {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // 1. 提取 <style> 并删除
    const cssRules = [];
    doc.querySelectorAll('style').forEach(el => {
      cssRules.push(...parseSimpleCss(el.textContent || ''));
      el.remove();
    });
    doc.querySelectorAll('head').forEach(el => el.remove());

    // 2. CSS 类转内联样式
    applyCssRules(doc.body, cssRules);

    // 2.1 伪元素（::before/::after）转真实子元素：时间线竖线、圆点、列表小圆点、hero蒙层等
    applyPseudoElements(doc.body, cssRules);

    // 2.2 CSS 变量替换（如 :root { --bg-color:#f7f7f7 }）
    const cssVars = extractCssVars(cssRules);
    substituteCssVars(doc.body, cssVars);

    // 2.3 删除固定定位装饰层（飘落叶片、背景纹理），微信不支持
    removeFixedDecorations(doc.body);

    // 3. flex/grid 转 table
    convertFlexGridToTable(doc.body);

    // 3.1 渐变背景降级为纯色首色标（微信不渲染渐变，否则白字看不见）
    flattenGradients(doc.body);

    // 4. button 转 div（公众号文章不支持交互按钮）
    doc.querySelectorAll('button').forEach(btn => {
      const div = doc.createElement('div');
      div.innerHTML = btn.innerHTML;
      const s = btn.getAttribute('style') || '';
      div.setAttribute('style', mergeInlineStyles(s, 'display:block;width:100%;'));
      btn.replaceWith(div);
    });

    // 5. 相对 URL 补全
    if (baseUrl) {
      doc.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        if (src && !/^https?:\/\//i.test(src) && !/^data:/i.test(src)) {
          try { img.setAttribute('src', new URL(src, baseUrl).href); } catch {}
        }
      });
    }

    // 6. 清洗危险内容
    sanitizeDoc(doc);
    return doc.body.innerHTML;
  } catch (e) {
    return html || '';
  }
}

// 将 hex 颜色向白色混合 amt(0~1)，得到更浅的色调（用于极浅主题底）
export function lightenToWhite(hex, amt) {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * amt);
  g = Math.round(g + (255 - g) * amt);
  b = Math.round(b + (255 - b) * amt);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ═══════════════════════════════════════════════════════════
//  预设主题色（不可删除，只管颜色）
// ═══════════════════════════════════════════════════════════
const PRESET_THEMES = {
  // tea-rhythm rice-paper: full 8-color theme
  chayun: {
    id:'chayun', name:'茶韵宣纸', isPreset:true,
    color:'#7A6B4F', light:'#F1EBDF',
    accent:'#C45C5C', second:'#8A9A5B',
    textMain:'#444038', textMuted:'#887F6A',
    bgPage:'#F7F3EA', bgCard:'#FFFFFF', border:'#E6E2D3',
    volumeColor:'#7A6B4F', volumeLight:'#F1EBDF'
  },
  // fresh light-cyan healing: 情感随笔 / 情绪疗愈 / 心理向内探索
  qingxin: {
    id:'qingxin', name:'清新浅青', isPreset:true,
    color:'#628888', light:'#E6F2EF',
    accent:'#D4A373', second:'#A3C9B8',
    textMain:'#445959', textMuted:'#749999',
    bgPage:'#F4FAF8', bgCard:'#FFFFFF', border:'#D0E4E4',
    volumeColor:'#D4A373', volumeLight:'#F4FAF8'
  },
  // cool gray rational workplace: 职场干货 / 认知提升 / 理性分析
  lengui: {
    id:'lengui', name:'冷灰理性', isPreset:true,
    color:'#4A5963', light:'#EEF1F3',
    accent:'#5D8AA8', second:'#8498A5',
    textMain:'#3A3A3A', textMuted:'#7F8C8D',
    bgPage:'#F8F9FA', bgCard:'#FFFFFF', border:'#D6DCE0',
    volumeColor:'#5D8AA8', volumeLight:'#F8F9FA'
  },
  // ── 7 套新增配色（2026-08-02）──
  naixing: { id:'naixing', name:'奶杏暖调', isPreset:true, color:'#8C7362', light:'#F3E9E1', accent:'#C48C68', second:'#A9907E', textMain:'#584C43', textMuted:'#947F70', bgPage:'#F9F3EE', bgCard:'#FFFFFF', border:'#E4D6CC', volumeColor:'#8C7362', volumeLight:'#F3E9E1' },
  wuhui:  { id:'wuhui',  name:'雾灰蓝',   isPreset:true, color:'#54657A', light:'#E9EFF7', accent:'#6382AC', second:'#8293A8', textMain:'#424C59', textMuted:'#78889C', bgPage:'#F3F6FA', bgCard:'#FFFFFF', border:'#D2DCE8', volumeColor:'#54657A', volumeLight:'#E9EFF7' },
  oufen:  { id:'oufen',  name:'藕粉柔紫', isPreset:true, color:'#6B5466', light:'#F2E7EF', accent:'#B886A8', second:'#997F94', textMain:'#574754', textMuted:'#927A8D', bgPage:'#F8F3F7', bgCard:'#FFFFFF', border:'#E8D8E3', volumeColor:'#6B5466', volumeLight:'#F2E7EF' },
  haiyan: { id:'haiyan', name:'海盐薄荷', isPreset:true, color:'#476B6B', light:'#E6F3F3', accent:'#74B4B0', second:'#86A8A6', textMain:'#395050', textMuted:'#739190', bgPage:'#F2F9F9', bgCard:'#FFFFFF', border:'#C9E2E1', volumeColor:'#476B6B', volumeLight:'#E6F3F3' },
  kezhi:  { id:'kezhi',  name:'克制暗红', isPreset:true, color:'#784444', light:'#F3E4E4', accent:'#A85757', second:'#996C6C', textMain:'#423333', textMuted:'#866868', bgPage:'#F9F2F2', bgCard:'#FFFFFF', border:'#DDC8C8', volumeColor:'#784444', volumeLight:'#F3E4E4' },
  zhejin: { id:'zhejin', name:'暖赭金',   isPreset:true, color:'#B0392E', light:'#F7E9E6', accent:'#C8A15A', second:'#B0392E', textMain:'#3A3A3A', textMuted:'#7F8C8D', bgPage:'#FFFFFF', bgCard:'#FFFFFF', border:'#DDC8C6', volumeColor:'#B0392E', volumeLight:'#F7E9E6' },
  // ── 3 套青春主题（2026-08-02）──
  yuanqi: { id:'yuanqi', name:'元气青柠', isPreset:true, color:'#3E8F77', light:'#E6F6ED', accent:'#6CC464', second:'#78B8A3', textMain:'#364942', textMuted:'#708C81', bgPage:'#F6FCF8', bgCard:'#FFFFFF', border:'#C6E2D6', volumeColor:'#6CC464', volumeLight:'#F6FCF8' },
  mitao:  { id:'mitao',  name:'蜜桃汽水', isPreset:true, color:'#B96473', light:'#F9E4E8', accent:'#E27889', second:'#CB8894', textMain:'#483639', textMuted:'#8A696F', bgPage:'#FDF3F5', bgCard:'#FFFFFF', border:'#E9C8CF', volumeColor:'#E27889', volumeLight:'#FDF3F5' },
  qingkong:{ id:'qingkong',name:'晴空蓝屿', isPreset:true, color:'#3E74AA', light:'#E4EFFC', accent:'#589CD8', second:'#749FC9', textMain:'#344659', textMuted:'#70879E', bgPage:'#F3F8FE', bgCard:'#FFFFFF', border:'#C5D9EE', volumeColor:'#589CD8', volumeLight:'#F3F8FE' },
};

// ═══════════════════════════════════════════════════════════
//  预设样式组合（不可删除，只管组件映射）
// ═══════════════════════════════════════════════════════════
const STYLE_PRESETS = {
  // ── 易命术系列专用：新中式沉静，品牌朱砂 + 卷色装饰 ──
  yiming: {
    id:'yiming', name:'易命术·新中式沉静', isPreset:true,
    map:{ h1:'titleShuName', h2:'titleVolBlock', h3:'titleVolBlock', h4:'titleVolBlock',
          quote:'quoteBlock', card:'cardVolume', divider:'dividerDots',
          list:'default', code:'cardBox', emphasis:'color', table:'simpleTable' }
  },
  // ── 茶韵宣纸：完整主题包（8 色 + 内容语义→组件映射）──
  chayun: {
    id:'chayun', name:'茶韵宣纸', isPreset:true,
    map:{
      h1:'centerLineTitle',    // 一级大章节：居中标题
      h2:'doubleLineTitle',    // 板块小标题：双竖线标题（辅助色）
      h3:'circleIconTitle',    // 重点知识点：圆形图标标题
      h4:'tagTitle',           // 标签标题
      quote:'doubleLayerFrame',// 摘录感悟金句：双层框内容
      card:'cardBox',          // 正文观点引用：底色框线卡片
      divider:'dividerGradient',// 渐变柔线
      list:'default', code:'cardBox', emphasis:'color', table:'simpleTable'
    }
  },
  // ── 清新浅青治愈：情感随笔 / 情绪疗愈 / 心理向内探索 ──
  qingxin: {
    id:'qingxin', name:'清新浅青治愈', isPreset:true,
    map:{
      h1:'centerLineTitle',     // 开篇大标题：清雅居中
      h2:'arrowTitle',          // 分段小标题：箭头标题
      h3:'dotLine',             // 分段小标题：圆点横线标题
      h4:'circleIconTitle',     // 知识点：圆形图标标题
      quote:'leadParagraph',    // 开篇导语：引用主题色导语卡片
      card:'cardVolume',        // 情绪感悟：圆弧卷色引用框
      divider:'dividerGradient',// 柔线分割
      list:'iconList', code:'cardBox', emphasis:'color', table:'simpleTable'
    }
  },
  // ── 冷灰理性职场：职场干货 / 认知提升 / 理性分析 ──
  lengui: {
    id:'lengui', name:'冷灰理性职场', isPreset:true,
    map:{
      h1:'centerLineTitle',     // 章节划分：居中标题
      h2:'diamondTitle',        // 要点清单：菱形标题
      h3:'circleStepBadge',     // 要点清单：序号圆形标题
      h4:'tagTitle',            // 标签标题
      quote:'quoteBlock',       // 重要结论：灰色引用
      card:'doubleLayerFrameRound', // 重要结论：双层圆角框
      divider:'dividerDots',    // 圆点横线分割
      list:'numList', code:'cardBox', emphasis:'color', table:'simpleTable'
    }
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
  const currentTheme = ref(localStorage.getItem('wechat_active_theme') || 'chayun');

  const themes = computed(() => ({ ...PRESET_THEMES, ...themeOverrides.value, ...customThemes.value }));

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
      currentTheme.value = 'chayun';
      localStorage.setItem('wechat_active_theme', 'chayun');
    }
  }

  function updateCustomTheme(id, patch) {
    const existing = customThemes.value[id];
    if (!existing) return;
    const updated = { ...existing, ...patch };
    customThemes.value = { ...customThemes.value, [id]: updated };
    saveCustomThemes(customThemes.value);
  }

  // ── 主题覆盖层：用户本地微调任意主题（含预设）的配色，持久化到 localStorage ──
  // 优先级：覆盖层 > 自定义主题 > 预设。不影响预设源码，刷新仍在。
  const THEME_OVERRIDES_KEY = 'wechat_theme_overrides';
  function loadThemeOverrides() {
    try {
      const raw = localStorage.getItem(THEME_OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  const themeOverrides = ref(loadThemeOverrides()); // { [themeId]: {color,light,accent,...} }
  function saveThemeOverridesStore() {
    try { localStorage.setItem(THEME_OVERRIDES_KEY, JSON.stringify(themeOverrides.value)); } catch {}
  }
  function saveThemeOverride(id, patch) {
    themeOverrides.value = { ...themeOverrides.value, [id]: { ...(themeOverrides.value[id] || {}), ...patch } };
    saveThemeOverridesStore();
  }
  function resetThemeOverride(id) {
    const copy = { ...themeOverrides.value };
    delete copy[id];
    themeOverrides.value = copy;
    saveThemeOverridesStore();
  }
  function hasThemeOverride(id) {
    return !!themeOverrides.value[id];
  }

  // ── 关键字→组件映射：按【样式预设】隔离（与组件样式映射同维度），持久化到 localStorage ──
  // 结构：{ [stylePresetId]: [ { id, keyword, component, hideKeyword, enabled } ] }
  const KEYWORD_MAPS_KEY = 'wechat_kw_maps_v2';
  function loadKeywordMaps() {
    try {
      let raw = localStorage.getItem(KEYWORD_MAPS_KEY);
      // 兼容旧版本：原先按 themeId 隔离，迁移到按 stylePresetId 隔离（默认归并到 chayun）
      if (!raw) {
        const oldRaw = localStorage.getItem('wechat_kw_maps_v1');
        if (oldRaw) {
          const old = JSON.parse(oldRaw);
          const merged = [];
          for (const k in old) merged.push(...old[k]);
          const migrated = merged.length ? { chayun: merged } : {};
          try { localStorage.setItem(KEYWORD_MAPS_KEY, JSON.stringify(migrated)); } catch {}
          return migrated;
        }
        return {};
      }
      return JSON.parse(raw);
    } catch { return {}; }
  }
  const keywordMaps = ref(loadKeywordMaps()); // { [stylePresetId]: KwMap[] }
  function saveKeywordMapsStore() {
    try { localStorage.setItem(KEYWORD_MAPS_KEY, JSON.stringify(keywordMaps.value)); } catch {}
  }
  function getKeywordMaps(presetId) {
    return keywordMaps.value[presetId] || [];
  }
  function saveKeywordMaps(presetId, list) {
    keywordMaps.value = { ...keywordMaps.value, [presetId]: list };
    saveKeywordMapsStore();
  }
  function deleteKeywordMap(presetId, mapId) {
    const list = (keywordMaps.value[presetId] || []).filter(m => m.id !== mapId);
    keywordMaps.value = { ...keywordMaps.value, [presetId]: list };
    saveKeywordMapsStore();
  }

  // 切换主题色（只影响颜色）
  const setTheme = (themeId) => {
    currentTheme.value = themeId;
    try { localStorage.setItem('wechat_active_theme', themeId); } catch {}
  };

  // ── 样式预设系统（只管理组件映射，不管颜色）──
  const customStylePresets = ref(loadCustomStylePresets());
  const currentStylePreset = ref(localStorage.getItem('wechat_active_style_preset') || 'chayun');

  // 易命术预设默认暖赭金：兼容旧 ymV 系列已删除，若当前主题已失效则回退 zhejin
  if (currentStylePreset.value === 'yiming' && !themes.value[currentTheme.value]) {
    currentTheme.value = 'zhejin';
    try { localStorage.setItem('wechat_active_theme', 'zhejin'); } catch {}
  }

  const allStylePresets = computed(() => ({
    ...STYLE_PRESETS,
    ...stylePresetOverrides.value,
    ...customStylePresets.value
  }));

  const stylePresetList = computed(() => {
    const list = [];
    for (const [id, s] of Object.entries(STYLE_PRESETS)) {
      const ov = stylePresetOverrides.value[id];
      list.push({ ...s, ...(ov || {}), isCustom:false, isActive:currentStylePreset.value === id, hasOverride:!!ov });
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
      currentStylePreset.value = 'yiming';
      localStorage.setItem('wechat_active_style_preset', 'yiming');
      syncAppearanceFromStylePreset('yiming');
    }
  }

  function updateStylePreset(id, patch) {
    const existing = customStylePresets.value[id];
    if (!existing) return;
    const updated = { ...existing, ...patch };
    customStylePresets.value = { ...customStylePresets.value, [id]: updated };
    saveCustomStylePresets(customStylePresets.value);
  }

  // ── 样式预设覆盖层：用户可本地修改预设样式，不污染源码 ──
  // 结构：{ [spId]: { name, map: {h1,h2,...} } }
  const SP_OVERRIDES_KEY = 'wechat_sp_overrides_v1';
  function loadSPOverrides() {
    try {
      const raw = localStorage.getItem(SP_OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  const stylePresetOverrides = ref(loadSPOverrides());
  function saveSPOverridesStore() {
    try { localStorage.setItem(SP_OVERRIDES_KEY, JSON.stringify(stylePresetOverrides.value)); } catch {}
  }
  function saveStylePresetOverride(id, patch) {
    stylePresetOverrides.value = { ...stylePresetOverrides.value, [id]: { ...(stylePresetOverrides.value[id] || {}), ...patch } };
    saveSPOverridesStore();
  }
  function resetStylePresetOverride(id) {
    const copy = { ...stylePresetOverrides.value };
    delete copy[id];
    stylePresetOverrides.value = copy;
    saveSPOverridesStore();
    // 如果当前正在用这个预设，重新同步
    if (currentStylePreset.value === id) syncAppearanceFromStylePreset(id);
  }
  function hasStylePresetOverride(id) {
    return !!stylePresetOverrides.value[id];
  }

  // 切换样式预设（只影响组件映射，不影响颜色）
  const setStylePreset = (presetId) => {
    currentStylePreset.value = presetId;
    try { localStorage.setItem('wechat_active_style_preset', presetId); } catch {}
    syncAppearanceFromStylePreset(presetId);
    // 易命术预设默认搭配暖赭金（zhejin，即原易命卷一朱砂主色 #B0392E）
    if (presetId === 'yiming') {
      currentTheme.value = 'zhejin';
      try { localStorage.setItem('wechat_active_theme', 'zhejin'); } catch {}
    }
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
    appearance.value.tableStyle = m.table || DEFAULT_STYLE_MAP.table;
  }

  // 外观配置（双层容器 + 元素样式映射）
  const appearance = ref({
    // 正文参数（对齐《易命术系列·公众号排版规范》全局参数）
    fontSize: 17,            // 正文字号 17px（易命主题加大）
    lineSpacing: 0.97,       // 行高 ≈ 1.75（lh = 1.8 * lineSpacing）
    bodyColor: '#3F3F3F',   // 正文深灰（近黑不纯黑）
    paraMargin: 16,           // 段后 16px（约 1 空行）
    letterSpacing: 0.5,       // 字间距 0.5px
    // 组件样式映射（由样式预设驱动，用户也可手动修改）
    h1Style: 'leftLineTitle',
    h2Style: 'leftLineTitle',
    h3Style: 'tagTitle',
    h4Style: 'tagTitle',
    quoteStyle: 'quoteBlock',
    cardStyle: 'cardBox',
    dividerStyle: 'dividerSolid',
    listStyle: 'default',
    codeStyle: 'cardBox',
    emphasisStyle: 'default',
    tableStyle: 'simpleTable',
  });

  // 初始化：刷新页面后，根据已保存的样式预设覆盖层恢复当前排版映射
  // （修复「改了 H2 等组件映射点保存，刷新后改回默认」——之前初始化漏了这一步，必须重切一次预设才生效）
  syncAppearanceFromStylePreset(currentStylePreset.value);

  // 全文背景容器模式（全局设置，颜色随当前主题：背景=页底色 / 边框=边框色 / 文字=正文色）
  const PAGE_BG_OPTIONS = [
    { id: 'bg',       name: '背景' },
    { id: 'bgBorder', name: '背景+边框' },
    { id: 'border',   name: '边框' },
    { id: 'none',     name: '不用背景' },
  ];
  const PAGE_BG_KEY = 'wechat_page_bg_mode';
  const pageBgMode = ref(localStorage.getItem(PAGE_BG_KEY) || 'bg');
  const setPageBgMode = (m) => {
    pageBgMode.value = m;
    try { localStorage.setItem(PAGE_BG_KEY, m); } catch {}
  };
  // 全文背景容器样式（仅 背景/边框 部分，颜色随当前主题：背景=页底色 / 边框=边框色）
  // padding / 圆角 / 字体 由产出处（buildWechatHTML、编辑区）另行叠加
  const pageBgInline = computed(() => {
    const BP = currentThemeBgPage.value;
    const BD = currentThemeBorder.value;
    const mode = pageBgMode.value;
    if (mode === 'bgBorder') return `background-color:${BP};border:1px solid ${BD};`;
    if (mode === 'border')   return `border:1px solid ${BD};`;
    if (mode === 'none')     return '';          // 不用背景：无容器样式
    return `background-color:${BP};`;            // 默认 'bg'：仅背景色
  });

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

  // 极浅主题底色：在 theme-light 基础上再向白色混合，专用于「正文」等极浅底卡片
  const currentThemeFaint = computed(() => {
    return lightenToWhite(themes.value[currentTheme.value]?.light || '#e6f0ff', 0.7);
  });

  // 卷色（装饰色：引用竖线 / 小标题方块 / 卡片底 / 预告块）
  const currentVolumeColor = computed(() => {
    const t = themes.value[currentTheme.value];
    return t?.volumeColor || t?.color || '#C8A15A';
  });
  const currentVolumeLight = computed(() => {
    const t = themes.value[currentTheme.value];
    return t?.volumeLight || t?.light || '#F7F1E6';
  });

  // 完整主题色角色（茶韵宣纸等 8 色主题使用；未定义时回退到主色/中性色，保证旧主题不变）
  const currentThemeAccent = computed(() => themes.value[currentTheme.value]?.accent || currentThemeColor.value);
  const currentThemeSecond = computed(() => themes.value[currentTheme.value]?.second || currentThemeColor.value);
  const currentThemeTextMain = computed(() => themes.value[currentTheme.value]?.textMain || '#444038');
  const currentThemeTextMuted = computed(() => themes.value[currentTheme.value]?.textMuted || '#887F6A');
  const currentThemeBgPage = computed(() => themes.value[currentTheme.value]?.bgPage || '#FFFFFF');
  const currentThemeBgCard = computed(() => themes.value[currentTheme.value]?.bgCard || '#FFFFFF');
  const currentThemeBorder = computed(() => themes.value[currentTheme.value]?.border || '#E6E2D3');

  // 构建公众号兼容的 HTML 输出（供预览和复制共用）
  // 使用 table 布局（微信兼容），边框用单边属性，所有样式内联
  const buildWechatHTML = (editorHTML) => {
    if (!editorHTML || !editorHTML.trim()) return '';

    const T = currentThemeColor.value;
    const TL = currentThemeLight.value;
    const TF = currentThemeFaint.value; // 极浅主题底
    const VC = currentVolumeColor.value;
    const VL = currentVolumeLight.value;
    const TC = '#fff';
    const A = currentThemeAccent.value;    // 强调色：金句/印章/重点标注
    const S = currentThemeSecond.value;    // 辅助色：小标题/点缀
    const TM = currentThemeTextMain.value; // 正文主色
    const TMT = currentThemeTextMuted.value; // 次要文字
    const BP = currentThemeBgPage.value;   // 页面背景
    const BC = currentThemeBgCard.value;   // 卡片底色
    const BD = currentThemeBorder.value;   // 边框/分割线
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

    // 剔除「文章标题：」「文章简介：」全局标记行 —— 仅作推送元数据，不出现在正文
    // 仅作用于文章最开头部分（前 3 个有效块），正文中间同名前缀不受影响
    {
      const headEls = Array.from(temp.children)
        .filter(el => { const t = el.textContent.trim(); return t && t.length <= 200; })
        .slice(0, 3);
      for (const el of headEls) {
        const t = el.textContent.trim();
        if (/^文章标题[：:]/.test(t) || /^文章简介[：:]/.test(t)) {
          el.remove();
        }
      }
    }

    // 合并基础样式与元素原始内联样式（导入 HTML 的 class 已被 convertHtmlToWechatCompatible 转内联）
    // 原始样式优先级更高；过滤掉微信不支持的属性，避免污染最终输出
    function mergeElementStyle(baseStyle, el) {
      const original = el.getAttribute('style') || '';
      if (!original) return baseStyle;
      const map = new Map(parseDecls(baseStyle).map(d => [d.k, d.v]));
      parseDecls(original).forEach(d => {
        if (d.k === 'position' && /fixed|absolute|sticky/.test(d.v)) return;
        if (d.k === 'display' && /flex|grid|inline-flex|inline-grid/.test(d.v)) return;
        if (d.k === 'box-shadow' || d.k === 'text-shadow') return;
        if (d.k === 'animation' || d.k.startsWith('animation-')) return;
        if (d.k === 'transform' || d.k === 'backdrop-filter' || d.k === 'filter') return;
        if (d.k === 'float' || d.k === 'clear') return;
        if (d.k === 'max-width' || d.k === 'min-width' || d.k === 'max-height' || d.k === 'min-height') return;
        map.set(d.k, d.v);
      });
      return declMapToString(map);
    }

    for (const child of temp.children) {
      // 普通段落
      if (child.tagName === 'P' && !child.classList.contains('editable-block')) {
        const pStyle = mergeElementStyle(`margin:${app.paraMargin}px 0;line-height:${lh};color:${app.bodyColor};font-size:${fs}px;text-align:justify;letter-spacing:${app.letterSpacing}px;`, child);
        out.push(`<p style="${pStyle}">${child.innerHTML}</p>`);
        continue;
      }

      // 分割线
      if (child.tagName === 'HR') {
        out.push(`<p><span style="display:inline-block;width:100%;height:1px;background-color:${TL};vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span></p>`);
        continue;
      }

      // 标题标签 H1/H2/H3 等：保留内容并加样式，同时合并原始内联样式
      if (/^H[1-6]$/.test(child.tagName)) {
        const tag = child.tagName.toLowerCase();
        const sizeMap = { h1: '22px', h2: '20px', h3: '18px', h4: '16px', h5: '15px', h6: '14px' };
        const hStyle = mergeElementStyle(`margin:${tag === 'h1' ? '28px' : '24px'} 0 12px;font-size:${sizeMap[tag] || '16px'};font-weight:700;color:#222;line-height:${lh};`, child);
        out.push(`<${tag} style="${hStyle}">${child.innerHTML}</${tag}>`);
        continue;
      }

      // 列表：保留原始 outerHTML（已含转换后的内联样式）
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        out.push(child.outerHTML);
        continue;
      }

      // 引用块
      if (child.tagName === 'BLOCKQUOTE') {
        const bqStyle = mergeElementStyle(`border-left:4px solid ${T};background-color:#f7f7f7;padding:14px 18px;color:#595959;font-size:${fs}px;line-height:${lh};margin:16px 0;`, child);
        out.push(`<blockquote style="${bqStyle}">${child.innerHTML}</blockquote>`);
        continue;
      }

      // 只处理 editable-block
      if (!child.classList.contains('editable-block')) {
        // 其他未知标签（导入 HTML 的 section/div/article 等）：保留原始内联样式，避免背景/圆角/边框丢失
        const secStyle = mergeElementStyle(`margin:${app.paraMargin}px 0;font-size:${fs}px;line-height:${lh};color:${app.bodyColor};letter-spacing:${app.letterSpacing}px;`, child);
        out.push(`<section style="${secStyle}">${child.innerHTML}</section>`);
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
          // 编号标题：使用 flex 横向布局，已验证微信支持 display:flex
          out.push(`<section style="display:flex;align-items:center;margin:18px 0 10px;">` +
            `<span style="background-color:${T};color:${TC};display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;font-size:13px;font-weight:700;flex-shrink:0;">${numTxt}</span>` +
            `<span style="font-size:17px;font-weight:700;color:#222;margin-left:8px;">${textHtml}</span>` +
          `</section>`);
          break;
        }

        case 'gradientTitle': {
          // 渐变文字在微信不生效，用主题色加粗大字代替
          const titleText = child.querySelector('h2')?.innerHTML || child.innerHTML;
          out.push(`<section style="margin:22px 0 12px;"><span style="font-size:20px;font-weight:700;color:${T};">${titleText}</span></section>`);
          break;
        }

        case 'tagTitle': {
          // 和编辑区一致：左边框标题（不是居中药丸）
          const titleHtml = child.querySelector('h2')?.innerHTML || child.textContent.trim();
          out.push(`<section style="border-left:4px solid ${T};padding-left:12px;margin:22px 0 12px;"><span style="font-size:18px;font-weight:700;color:#333;">${titleHtml}</span></section>`);
          break;
        }

        case 'leftLineTitle': {
          const lt = child.querySelector('h2');
          const ltxt = lt ? lt.innerHTML : child.innerHTML;
          out.push(`<section style="border-left:4px solid ${T};padding-left:12px;margin:20px 0 12px;"><span style="font-size:17px;font-weight:700;color:#333;line-height:1.4;display:inline-block;">${ltxt}</span></section>`);
          break;
        }

        case 'rightLineTitle': {
          const rt = child.querySelector('h2');
          const rtxt = rt ? rt.innerHTML : child.innerHTML;
          out.push(`<section style="border-right:4px solid ${T};padding-right:12px;margin:20px 0 12px;text-align:right;"><span style="font-size:17px;font-weight:700;color:#333;line-height:1.4;display:inline-block;">${rtxt}</span></section>`);
          break;
        }

        case 'centerLineTitle': {
          const ct = child.querySelector('h2');
          const ctxt = ct ? ct.innerHTML : child.innerHTML;
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
          const utxt = child.querySelector('span')?.innerHTML || child.innerHTML;
          // 主标题：大号黑体 + 细黑下划线（杂志式克制感，朱砂留给术名/引用）
          out.push(`<section style="margin:22px 0 14px;"><span style="display:inline-block;font-size:19px;font-weight:800;letter-spacing:0.5px;border-bottom:1px solid #1A1A1A;padding-bottom:6px;color:#1A1A1A;line-height:1.4;">${utxt}</span></section>`);
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
          out.push(`<section style="text-align:center;margin:20px 0 12px;"><span style="display:inline-block;border-left:4px solid ${S};border-right:4px solid ${S};padding:4px 12px;font-size:17px;font-weight:700;color:#333;">${dltxt}</span></section>`);
          break;
        }

        case 'diamondTitle': {
          const dmSpans = Array.from(child.children).filter(c => c.tagName === 'SPAN');
          const dmText = dmSpans.length > 1 ? (dmSpans[1].innerHTML || dmSpans[1].textContent.trim()) : child.textContent.trim();
          out.push(`<section style="display:flex;align-items:center;margin:16px 0 10px;"><span style="color:${T};font-size:14px;flex-shrink:0;">◆</span><span style="font-weight:700;font-size:16px;color:#222;margin-left:8px;">${dmText}</span></section>`);
          break;
        }

        case 'goldenQuote': {
          const gqDivs = child.querySelectorAll('div');
          const gqText = gqDivs.length > 1 ? (gqDivs[1].innerHTML || gqDivs[1].textContent.trim()) : '';
          out.push(`<section style="text-align:center;padding:24px 20px;margin:20px 0;background-color:${TL};border-radius:8px;"><span style="font-size:32px;color:${A};line-height:1;">&ldquo;</span><span style="font-size:16px;color:${A};line-height:1.8;">${gqText}</span></section>`);
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
          // 取纯文字
          const textOnly = child.textContent.trim() || txt;
          out.push(`<section style="background-color:${TL};border-radius:8px;padding:12px 16px;margin:14px 0;font-size:14px;color:#444;line-height:1.8;">${textOnly}</section>`);
          break;
        }

        case 'quoteBlock': {
          out.push(`<blockquote style="border-left:4px solid ${T};background-color:#f7f7f7;padding:14px 18px;color:#595959;font-size:16px;line-height:1.8;margin:16px 0;">${child.innerHTML}</blockquote>`);
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

        // ── 新增列表类组件 ──
        case 'iconList': {
          const rows = child.querySelectorAll(':scope > div');
          let html = '';
          rows.forEach(row => {
            const spans = row.querySelectorAll('span');
            const icon = spans[0]?.textContent || '•';
            const content = spans[1]?.innerHTML || spans[1]?.textContent.trim() || row.textContent.trim();
            html += `<p style="margin:6px 0;padding:0;font-size:14px;color:#333;line-height:1.7;"><span style="color:${T};font-size:13px;margin-right:6px;">${icon}</span>${content}</p>`;
          });
          out.push(`<section style="background-color:${TL};border-radius:8px;padding:14px 18px;margin:14px 0;">${html}</section>`);
          break;
        }

        case 'numList': {
          const rows = child.querySelectorAll(':scope > div');
          let html = '';
          rows.forEach((row, i) => {
            const spans = row.querySelectorAll('span');
            const content = spans[1]?.innerHTML || row.textContent.trim();
            html += `<p style="display:table;width:100%;margin:0;padding:8px 0;border-bottom:1px solid #eee;font-size:0;line-height:0;"><span style="display:table-cell;width:32px;font-size:22px;font-weight:800;color:${T};line-height:1;vertical-align:top;padding-top:2px;">${i + 1}</span><span style="display:table-cell;font-size:14px;color:#333;line-height:1.7;vertical-align:top;padding-left:8px;">${content}</span></p>`;
          });
          out.push(`<section style="padding:4px 0;margin:14px 0;">${html}</section>`);
          break;
        }

        case 'colorCardList': {
          const rows = child.querySelectorAll(':scope > div');
          const colors = [T, '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
          let html = '';
          rows.forEach((row, i) => {
            const spans = row.querySelectorAll('span');
            const label = spans[0]?.textContent || '';
            const content = spans[1]?.innerHTML || row.textContent.trim();
            const c = colors[i % colors.length];
            html += `<p style="display:table;width:100%;margin:8px 0;border-radius:4px;overflow:hidden;font-size:0;line-height:0;"><span style="display:table-cell;width:6px;background-color:${c};border-radius:4px 0 0 4px;font-size:1px;">&nbsp;</span><span style="display:table-cell;background-color:#fafafa;padding:10px 14px;font-size:14px;color:#333;line-height:1.6;vertical-align:middle;"><span style="font-weight:700;color:${c};">${label}</span>${label && content ? ' ' : ''}${label ? content : (content)}</span></p>`;
          });
          out.push(`<section style="margin:14px 0;">${html}</section>`);
          break;
        }

        // ── 新增表格类组件 ──
        case 'simpleTable': {
          const tbl = child.querySelector('table');
          if (!tbl) break;
          const headerRows = tbl.querySelectorAll('thead tr');
          const bodyRows = tbl.querySelectorAll('tbody tr');
          let tableHTML = '';
          headerRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            let rowHTML = '';
            cells.forEach(cell => {
              rowHTML += `<td style="padding:10px 12px;font-size:14px;font-weight:700;color:#fff;background-color:${T};border-top:1px solid ${T};border-bottom:1px solid ${T};border-left:1px solid ${T};border-right:1px solid ${T};">${cell.innerHTML}</td>`;
            });
            tableHTML += `<tr style="background-color:${T};">${rowHTML}</tr>`;
          });
          bodyRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            let rowHTML = '';
            cells.forEach(cell => {
              rowHTML += `<td style="padding:9px 12px;font-size:14px;color:#333;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">${cell.innerHTML || cell.textContent.trim()}</td>`;
            });
            tableHTML += `<tr style="background-color:#fff;">${rowHTML}</tr>`;
          });
          out.push(`<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">${tableHTML}</table>`);
          break;
        }

        case 'striTable': {
          const tbl = child.querySelector('table');
          if (!tbl) break;
          const headerRows = tbl.querySelectorAll('thead tr');
          const bodyRows = tbl.querySelectorAll('tbody tr');
          let tableHTML = '';
          let rowIdx = 0;
          headerRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            let rowHTML = '';
            cells.forEach(cell => {
              rowHTML += `<td style="padding:10px 12px;font-size:14px;font-weight:700;color:${T};background-color:${TL};border-bottom:2px solid ${T};">${cell.innerHTML}</td>`;
            });
            tableHTML += `<tr>${rowHTML}</tr>`;
            rowIdx++;
          });
          bodyRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            let rowHTML = '';
            const bg = rowIdx % 2 === 0 ? '#f8f9fa' : '#ffffff';
            cells.forEach(cell => {
              rowHTML += `<td style="padding:9px 12px;font-size:14px;color:#333;background-color:${bg};">${cell.innerHTML || cell.textContent.trim()}</td>`;
            });
            tableHTML += `<tr>${rowHTML}</tr>`;
            rowIdx++;
          });
          out.push(`<table style="width:100%;border-collapse:collapse;margin:16px 0;">${tableHTML}</table>`);
          break;
        }

        case 'borderTable': {
          const tbl = child.querySelector('table');
          if (!tbl) break;
          const headerRows = tbl.querySelectorAll('thead tr');
          const bodyRows = tbl.querySelectorAll('tbody tr');
          let tableHTML = '';
          headerRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            let rowHTML = '';
            cells.forEach(cell => {
              rowHTML += `<td style="padding:10px 12px;font-size:14px;font-weight:700;color:${T};text-align:center;border-top:1px solid #ddd;border-bottom:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;background-color:${TL};">${cell.innerHTML}</td>`;
            });
            tableHTML += `<tr>${rowHTML}</tr>`;
          });
          bodyRows.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            let rowHTML = '';
            cells.forEach(cell => {
              rowHTML += `<td style="padding:9px 12px;font-size:14px;color:#444;text-align:center;border-top:1px solid #ddd;border-bottom:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;">${cell.innerHTML || cell.textContent.trim()}</td>`;
            });
            tableHTML += `<tr>${rowHTML}</tr>`;
          });
          out.push(`<table style="width:100%;border-collapse:collapse;margin:16px 0;">${tableHTML}</table>`);
          break;
        }

        case 'statCard': {
          const items = child.querySelectorAll(':scope > div');
          const count = items.length || 3;
          const cellW = Math.floor(100 / count) + '%';
          let cellsHTML = '';
          items.forEach(item => {
            const spans = item.querySelectorAll('span');
            const num = spans[0]?.textContent || '0';
            const label = spans[1]?.textContent || '指标';
            cellsHTML += `<td style="width:${cellW};padding:16px 8px;text-align:center;border-right:1px solid #eee;vertical-align:middle;"><p style="margin:0;font-size:26px;font-weight:800;color:${T};line-height:1.2;">${num}</p><p style="margin:4px 0 0;font-size:12px;color:#888;">${label}</p></td>`;
          });
          out.push(`<table style="width:100%;border-collapse:collapse;margin:16px 0;background-color:#fff;"><tr>${cellsHTML}</tr></table>`);
          break;
        }

        // ── 新增标题类组件 ──
        case 'dotLineTitle': {
          // 框线标题（去掉顶部圆点）
          const t = child.querySelector('.dl-text')?.innerHTML || child.textContent?.trim() || '框线标题';
          out.push(`<section style="text-align:center;margin:18px auto;padding:10px 22px;border-left:2px solid ${T};border-right:2px solid ${T};border-top:2px solid ${T};border-bottom:2px solid ${T};border-radius:6px;"><span style="font-size:17px;font-weight:700;color:#222;">${t}</span></section>`);
          break;
        }
        case 'solidBarTitle': {
          // 底条标题：背景跟随主题色（全宽色块）
          const t = child.querySelector('.sb-text')?.innerHTML || child.textContent?.trim() || '主题色底条标题';
          out.push(`<section style="background-color:${T};border-radius:4px;padding:10px 16px;margin:14px 0;"><span style="font-size:15px;font-weight:700;color:#fff;letter-spacing:1px;">${t}</span></section>`);
          break;
        }
        case 'diamondLineTitle': {
          // 菱形装饰 + 延伸线标题（用 flex 替代 table，微信兼容）
          const t = child.querySelector('.dl-diamond-text')?.innerHTML || child.textContent?.trim() || '菱形延伸线标题';
          out.push(`<section style="display:flex;align-items:center;margin:20px 0;"><span style="flex:1;height:0;border-bottom:1px solid ${TL};"></span><span style="color:${T};font-size:13px;flex-shrink:0;margin:0 8px;">◇</span><span style="font-size:17px;font-weight:700;color:#222;flex-shrink:0;">${t}</span><span style="color:${T};font-size:13px;flex-shrink:0;margin:0 8px;">◇</span><span style="flex:1;height:0;border-bottom:1px solid ${TL};"></span></section>`);
          break;
        }
        case 'circleStepBadge': {
          // 圆形步骤徽章（用 flex 替代 table，微信兼容）
          const numEl = child.querySelector('.csb-num');
          const numText = numEl ? (numEl.textContent?.trim() || '1') : '1';
          out.push(`<section style="display:flex;align-items:center;margin:22px 0;"><span style="flex:1;height:0;border-bottom:1px solid #ddd;"></span><span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background-color:${T};color:#fff;font-size:18px;font-weight:800;border-radius:50%;flex-shrink:0;margin:0 10px;">${numText}</span><span style="flex:1;height:0;border-bottom:1px solid #ddd;"></span></section>`);
          break;
        }

        // ── 易命术系列专用样式 ──
        case 'seriesLabel': {
          // 系列署名：雅致小字、卷色、大字距（文章顶部 kicker，营造书卷气）
          const sl = child.querySelector('span')?.innerHTML || child.textContent.trim() || '易命术手记 · 卷一';
          out.push(`<section style="text-align:center;margin:6px 0 22px;font-size:13px;font-weight:500;letter-spacing:3px;color:${VC};">${sl}</section>`);
          break;
        }

        case 'seriesOpening': {
          // 开头署名（三段式）：易命术 · 卷一 · 安身 —— 文章最顶部 kicker，卷色金 + 大字距
          const so = child.querySelector('span')?.innerHTML || child.textContent.trim() || '易命术 · 卷一 · 安身';
          out.push(`<section style="text-align:center;margin:4px 0 18px;font-size:13px;font-weight:500;letter-spacing:3px;color:${VC};">${so}</section>`);
          break;
        }

        case 'inkAxisTitle': {
          // 墨韵中轴：居中 + 主题色下划线 + 下方装饰小短线 + 宋体
          const iat = child.querySelector('h2');
          const iatxt = iat ? iat.innerHTML : child.textContent.trim();
          out.push(`<section style="text-align:center;margin:40px 0 25px 0;">` +
            `<h2 style="display:inline-block;font-size:20px;color:${T};border-bottom:2px solid ${T};padding:0 10px 8px 10px;margin:0;font-weight:bold;letter-spacing:2px;font-family:'Songti SC',serif;">${iatxt}</h2>` +
            `<div style="width:20px;height:2px;background-color:${T};margin:5px auto 0;"></div>` +
          `</section>`);
          break;
        }

        case 'windowLatticeTitle': {
          // 居中窗棂：四角括号框
          const wt = child.querySelector('h2');
          const wtxt = wt ? wt.innerHTML : child.textContent.trim();
          out.push(`<section style="text-align:center;margin:40px 0;">` +
            `<span style="display:inline-flex;flex-direction:column;border:1px solid ${T};">` +
              `<span style="display:flex;justify-content:space-between;padding:3px 3px 0;">` +
                `<span style="width:10px;height:10px;border-top:2px solid ${T};border-left:2px solid ${T};"></span>` +
                `<span style="width:10px;height:10px;border-top:2px solid ${T};border-right:2px solid ${T};"></span>` +
              `</span>` +
              `<h2 style="margin:0;padding:8px 22px;font-size:18px;color:${T};font-family:'Songti SC',serif;font-weight:bold;">${wtxt}</h2>` +
              `<span style="display:flex;justify-content:space-between;padding:0 3px 3px;">` +
                `<span style="width:10px;height:10px;border-bottom:2px solid ${T};border-left:2px solid ${T};"></span>` +
                `<span style="width:10px;height:10px;border-bottom:2px solid ${T};border-right:2px solid ${T};"></span>` +
              `</span>` +
            `</span>` +
          `</section>`);
          break;
        }
        case 'centeredCapsuleTitle': {
          // 居中胶囊
          const cct = child.querySelector('h2');
          const cctxt = cct ? cct.innerHTML : child.textContent.trim();
          out.push(`<section style="text-align:center;margin:40px 0;">` +
            `<h2 style="display:inline-block;font-size:16px;color:${T};background-color:${TL};padding:8px 25px;border-radius:50px;margin:0;font-weight:bold;letter-spacing:1px;">${cctxt}</h2>` +
          `</section>`);
          break;
        }
        case 'dashedCenterTitle': {
          // 虚框居中
          const dct = child.querySelector('h2');
          const dctxt = dct ? dct.innerHTML : child.textContent.trim();
          out.push(`<section style="margin:30px 10px;">` +
            `<h2 style="font-size:18px;color:${T};background-color:${TL};padding:15px;border:1px dashed ${T};border-radius:4px;margin:0;text-align:center;box-shadow:2px 2px 0px ${TL};">${dctxt}</h2>` +
          `</section>`);
          break;
        }
        case 'solidCenterFrameTitle': {
          // 实线居中框：上下横实线 + 左右竖线
          const scft = child.querySelector('h2');
          const scftxt = scft ? scft.innerHTML : child.textContent.trim();
          out.push(`<section style="text-align:center;margin:40px 0;">` +
            `<h2 style="display:inline-block;font-size:22px;color:${T};margin:0;font-weight:bold;border-top:2px solid ${T};border-bottom:2px solid ${T};padding:8px 30px;">` +
              `<span style="display:inline-block;border-left:2px solid ${T};border-right:2px solid ${T};padding:0 10px;">${scftxt}</span>` +
            `</h2>` +
          `</section>`);
          break;
        }

        case 'titleShuName': {
          // 术名段：16px 加粗 朱砂红固定 居中（全系列视觉签名，留白更足）
          const sn = child.querySelector('span')?.innerHTML || child.textContent.trim() || '易命X术 · 术名';
          out.push(`<section style="text-align:center;margin:32px 0 24px;font-size:16px;font-weight:700;color:#B0392E;line-height:1.7;letter-spacing:1px;">${sn}</section>`);
          break;
        }

        case 'titleVolBlock': {
          // 板块小标题：16px 加粗 #1A1A1A + 卷色小方块 ▍ 引导
          const vb = child.querySelector('span:last-child')?.innerHTML || child.textContent.trim() || '板块小标题';
          out.push(`<section style="display:flex;align-items:center;margin:20px 0 10px;">` +
            `<span style="display:inline-block;width:4px;height:16px;background-color:${VC};margin-right:10px;flex-shrink:0;"></span>` +
            `<span style="font-size:16px;font-weight:700;color:#1A1A1A;line-height:1.4;">${vb}</span>` +
          `</section>`);
          break;
        }

        case 'cardVolume': {
          // 卷色浅底卡片：关联总结 / 下一篇预告
          out.push(`<section style="background-color:${VL};border-left:3px solid ${VC};border-radius:8px;padding:16px 18px;margin:16px 0;font-size:${fs}px;color:#444;line-height:1.8;">${txt}</section>`);
          break;
        }

        case 'dividerDots': {
          // 板块弱装饰分隔（不用粗横线）：· · · 浅灰居中
          out.push(`<p style="text-align:center;margin:24px 0;color:#CCCCCC;font-size:14px;letter-spacing:6px;">· · ·</p>`);
          break;
        }

        case 'dividerTextCenter': {
          // 居中文字基础款：左线 + 居中文字 + 右线（table 替代 flex，跟随主题色）
          // 线条用 1px 高内嵌元素（非 border-top），配合 vertical-align:middle 实现文字与线垂直居中
          const dtc = child.querySelector('.dt-text')?.innerHTML || txt || '秋序';
          out.push(`<table style="width:100%;margin:32px 0;border-collapse:collapse"><tr>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
            `<td style="white-space:nowrap;padding:0 16px;font-size:14px;letter-spacing:2px;color:${T};vertical-align:middle;">${dtc}</td>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
          `</tr></table>`);
          break;
        }

        case 'dividerDotsText': {
          // 文字 + 小圆点：左线 + [圆点 文字 圆点] + 右线（跟随主题色）
          const ddt = child.querySelector('.dt-text')?.innerHTML || txt || '正文篇章';
          out.push(`<table style="width:100%;margin:32px 0;border-collapse:collapse"><tr>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
            `<td style="white-space:nowrap;padding:0 12px;vertical-align:middle;">` +
              `<span style="display:inline-block;width:5px;height:5px;background:${T};border-radius:50%;vertical-align:middle;margin-right:10px;"></span>` +
              `<span class="dt-text" style="font-size:14px;letter-spacing:2px;color:${T};vertical-align:middle;">${ddt}</span>` +
              `<span style="display:inline-block;width:5px;height:5px;background:${T};border-radius:50%;vertical-align:middle;margin-left:10px;"></span>` +
            `</td>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
          `</tr></table>`);
          break;
        }

        case 'dividerGradient': {
          // 渐变柔线：左右透明、中间主题色的极淡分隔线（跟随主题色）
          out.push(`<div style="width:100%;height:1px;background:linear-gradient(to right,transparent,${T},transparent);margin:32px 10px"></div>`);
          break;
        }

        case 'topicSectionCard': {
          // 主题章节卡片（简化）：左对齐章节标题(无编号) + 横线 + 白底文本框
          // 标题：优先读 .tsc-title，兼容旧内容（旧数据可能含 "01." 编号前缀，正则剔除）
          const titleEl = child.querySelector('.tsc-title');
          const titleText = titleEl ? titleEl.textContent.trim()
            : (() => { const h = child.querySelector('[style*="border-bottom"]'); return h ? (h.textContent?.trim() || '').replace(/^\d{1,2}\.\s*/, '') : ''; })();
          const bodyP = child.querySelector('p');
          const bodyHtml = bodyP ? bodyP.innerHTML : '';
          out.push(`<section style="background-color:${VL};border-radius:12px;padding:20px;margin:20px 0">` +
            `<section style="font-size:20px;font-weight:800;color:#333;line-height:1;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${T}">${titleText || '章节标题'}</section>` +
            `<section style="background-color:#ffffff;border-radius:10px;padding:18px 20px;">` +
              `<p style="margin:0;font-size:${fs}px;color:#444;line-height:1.9;text-align:justify">${bodyHtml}</p>` +
            `</section>` +
          `</section>`);
          break;
        }

        case 'doubleLayerFrame': {
          // 国风双层框：外层浅底(主题浅色) + 内层白底 + 主题色边框 + 标题(主题色) + 正文
          const dlfTitleEl = child.querySelector('.dlf-title');
          const dlfTitleHtml = dlfTitleEl ? dlfTitleEl.innerHTML : '';
          const dlfBody = child.querySelector('p');
          const dlfBodyHtml = dlfBody ? dlfBody.innerHTML : '';
          out.push(`<section style="background-color:${TL};border-radius:4px;padding:20px;margin:20px 0">` +
            `<section style="background-color:#ffffff;border:1px solid ${T};padding:24px 28px">` +
              `<div style="font-size:18px;color:${T};font-weight:500;letter-spacing:2px;margin-bottom:16px">${dlfTitleHtml || '立秋 · 节气 <span style="font-size:14px;opacity:0.65;font-weight:normal;letter-spacing:1px">/ START OF AUTUMN</span>'}</div>` +
              `<p style="margin:0;font-size:${fs}px;color:#4a4a4a;line-height:1.8;text-align:justify">${dlfBodyHtml}</p>` +
            `</section>` +
          `</section>`);
          break;
        }

        case 'noteSmall': {
          // 小字注释：中性灰底灰字（注释用途，固定中性色，不随主题）
          const ns = child.querySelector('.ns-text');
          const nsHtml = ns ? ns.innerHTML : '';
          out.push(`<section style="padding:12px 16px;background:#f5f5f5;border-radius:4px;margin:14px 4px">` +
            `<div style="font-size:13px;color:#777;line-height:1.7">${nsHtml || '注：这里是小字注释内容，用于补充说明、引用来源或备注信息。'}</div>` +
          `</section>`);
          break;
        }

        case 'luxuryThinFrame': {
          // 轻奢细框：主题色渐变外框(随主题色) + 内白底 + 居中文字(主题色)
          const lt = child.querySelector('.ltf-text');
          const ltHtml = lt ? lt.innerHTML : '';
          out.push(`<section style="padding:3px;background:linear-gradient(135deg,${T},${TL});border-radius:4px;margin:20px 8px">` +
            `<section style="padding:24px 28px;background:#ffffff;border-radius:2px">` +
              `<div style="font-size:15px;color:${T};line-height:1.9;text-align:center;letter-spacing:1px">${ltHtml || '愿你在这个秋天，<br>有收获，有期待，<br>所有的努力都能结出硕果。'}</div>` +
            `</section>` +
          `</section>`);
          break;
        }

        case 'topBottomDoubleLine': {
          // 上下双线：主题色细线夹居中文字
          const tb = child.querySelector('.tb-text');
          const tbHtml = tb ? tb.innerHTML : '';
          out.push(`<section style="padding:12px 0;margin:20px 10px">` +
            `<div style="width:100%;height:1px;background:${T}"></div>` +
            `<div style="padding:20px 16px;font-size:16px;color:#333;line-height:1.9;text-align:center;letter-spacing:1px">${tbHtml || '万物收敛锋芒、蓄力生长，人间也迎来了最适合沉淀、精进的时节。'}</div>` +
            `<div style="width:100%;height:1px;background:${T}"></div>` +
          `</section>`);
          break;
        }

        case 'dividerQuote': {
          // 分割线金句：主题色侧线 + 主题色标题 + 居中正文
          const dqt = child.querySelector('.dq-title');
          const dqTitle = dqt ? dqt.innerHTML : '';
          const dq = child.querySelector('.dq-text');
          const dqHtml = dq ? dq.innerHTML : '';
          out.push(`<section style="padding:20px 0;text-align:center;margin:20px 0">` +
            `<div><span style="display:inline-block;width:60px;height:1px;background:${A};vertical-align:middle"></span><span style="margin:0 16px;font-size:16px;color:${A};letter-spacing:3px">${dqTitle || '核心观点'}</span><span style="display:inline-block;width:60px;height:1px;background:${A};vertical-align:middle"></span></div>` +
            `<div style="margin-top:18px;font-size:15px;color:#333;line-height:1.8;padding:0 20px">${dqHtml || '真正的高级感，从来不是堆砌元素，而是克制的留白与舒适的配色。'}</div>` +
          `</section>`);
          break;
        }

        case 'doubleLayerFrameRound': {
          // 国风双层框·圆角版：外浅底(主题浅色)+外圆角 + 内白底+主题色边框+圆角 + 标题(主题色)+正文
          const dltr = child.querySelector('.dlfr-title');
          const dltrHtml = dltr ? dltr.innerHTML : '';
          const dlbr = child.querySelector('.dlfr-body') || child.querySelector('p');
          const dlbrHtml = dlbr ? dlbr.innerHTML : '';
          out.push(`<section style="background-color:${TL};border-radius:12px;padding:18px;margin:20px 0">` +
            `<section style="background-color:#ffffff;border:1px solid ${T};border-radius:8px;padding:24px 28px">` +
              `<div style="font-size:18px;color:${T};font-weight:500;letter-spacing:2px;margin-bottom:16px">${dltrHtml || '立秋 · 节气 <span style="font-size:14px;opacity:0.65;font-weight:normal;letter-spacing:1px">/ START OF AUTUMN</span>'}</div>` +
              `<p style="margin:0;font-size:${fs}px;color:#4a4a4a;line-height:1.8;text-align:justify">${dlbrHtml}</p>` +
            `</section>` +
          `</section>`);
          break;
        }

        case 'waistSealRounded': {
          // 腰封圆角：外浅底(主题浅色)+大圆角 + 内白底+主题色细边 + 顶部腰封标题(主题色)+正文
          const wsrTitleEl = child.querySelector('.wsr-title');
          const wsrTitleHtml = wsrTitleEl ? wsrTitleEl.innerHTML : '';
          const wsrBodyEl = child.querySelector('.wsr-body');
          const wsrBodyHtml = wsrBodyEl ? wsrBodyEl.innerHTML : '';
          out.push(`<section style="padding:16px;background-color:${TL};border-radius:14px;margin:20px 0">` +
            `<section style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid ${T}">` +
              `<div style="padding:14px 24px;background:${T};color:#fff;font-size:16px;letter-spacing:2px">${wsrTitleHtml || '三伏养生三原则'}</div>` +
              `<div style="padding:22px 26px;font-size:15px;color:#444;line-height:1.9;text-align:justify">${wsrBodyHtml || '一曰顺时养阳，不贪寒凉；二曰健脾祛湿，饮食清淡；三曰静心安神，戒骄戒躁。三者兼顾，方能安然度夏，不伤元气。'}</div>` +
            `</section>` +
          `</section>`);
          break;
        }

        case 'bambooJoint': {
          // 竹节分割：外浅底(主题浅色)+圆角 + 左侧竹节竖条(主题色)+主题色标题+右侧细线(主题色) + 正文
          const bjTitleEl = child.querySelector('.bj-title');
          const bjTitleHtml = bjTitleEl ? bjTitleEl.innerHTML : '';
          const bjBodyEl = child.querySelector('.bj-body');
          const bjBodyHtml = bjBodyEl ? bjBodyEl.innerHTML : '';
          out.push(`<section style="padding:24px 28px;background-color:${TL};border-radius:12px;margin:20px 0">` +
            `<table style="width:100%;border-collapse:collapse;margin-bottom:18px"><tr>` +
              `<td style="white-space:nowrap;vertical-align:middle">` +
                `<span style="display:inline-block;width:4px;height:18px;background:${T};border-radius:2px;margin-right:10px;vertical-align:middle"></span>` +
                `<span style="font-size:17px;color:${T};font-weight:500;letter-spacing:1.5px;vertical-align:middle">${bjTitleHtml || '初伏 · 养阳'}</span>` +
              `</td>` +
              `<td style="width:100%;vertical-align:middle">` +
                `<div style="height:1px;background:${T};margin-left:16px"></div>` +
              `</td>` +
            `</tr></table>` +
            `<div style="padding-left:4px;font-size:15px;color:#444a3e;line-height:1.9;text-align:justify">${bjBodyHtml || '三伏天是一年中阳气最盛的时段，此时人体阳气浮于体表，内里虚寒，最忌贪凉饮冷。饮食宜温不宜寒，作息宜静不宜躁，顺势养阳，方能为秋冬积蓄能量。'}</div>` +
          `</section>`);
          break;
        }

        case 'bodyText': {
          // 正文：宣纸质感长文段（背景跟随主题色，极浅）+ 首行缩进 + 两端对齐
          const btInner = child.querySelector('div')?.innerHTML || txt;
          out.push(`<section style="padding:30px 32px;background-color:${TF};border-radius:6px;margin:20px 0">` +
            `<div style="font-size:15px;color:#3a3630;line-height:2;text-align:justify;text-indent:2em">${btInner}</div>` +
          `</section>`);
          break;
        }

        case 'qaBox': {
          // 互动提问框：外层主题浅底+大圆角，内层白卡+主题浅边+居中；跟随主题色
          const qaTitleHtml = child.querySelector('.qa-title')?.innerHTML || '· 互动话题 ·';
          const qaBodyHtml = child.querySelector('.qa-body')?.innerHTML || '关于三伏养生，你还有什么私藏的小妙招？<br>欢迎在留言区分享给大家～';
          const qaFooterHtml = child.querySelector('.qa-footer')?.innerHTML || '点赞 + 在看，夏日安康 ❤';
          out.push(`<section style="margin-top:30px;padding:18px;background-color:${TF};border-radius:12px">` +
            `<div style="padding:24px 28px;background:#ffffff;border:1px solid ${TL};border-radius:8px;text-align:center">` +
              `<div class="qa-title" style="font-size:16px;color:${T};font-weight:500;letter-spacing:2px;margin-bottom:14px">${qaTitleHtml}</div>` +
              `<div class="qa-body" style="font-size:15px;color:#4a4a4a;line-height:1.8;margin-bottom:18px">${qaBodyHtml}</div>` +
              `<div class="qa-footer" style="font-size:13px;color:${T};letter-spacing:1px">${qaFooterHtml}</div>` +
            `</div>` +
          `</section>`);
          break;
        }

        case 'nextPreview': {
          // 下期预告：书卷式预告（三部分：np-head 标题 / np-body 内容 / np-follow 引导关注）
          const npHeadEl = child.querySelector('.np-head');
          const npBodyEl = child.querySelector('.np-body');
          const npFollowEl = child.querySelector('.np-follow');
          const npHeadHtml = npHeadEl ? npHeadEl.innerHTML : '易命四十二术·逐成者务修者';
          const npBodyHtml = npBodyEl ? npBodyEl.innerHTML : '下期内容预告文案，从饮食到作息全攻略，不想错过记得星标。';
          const npFollowHtml = npFollowEl ? npFollowEl.innerHTML : '';
          out.push(`<section style="margin-top:30px;padding:20px;background-color:${TF};border-radius:12px;border:none;overflow:hidden">` +
            `<table style="width:100%;border-collapse:collapse"><tr>` +
              `<td style="width:1%;white-space:nowrap;vertical-align:top;padding:8px 5px 8px 3px;border-right:1px solid ${TL};writing-mode:vertical-rl;text-orientation:upright;font-size:14px;color:${T};letter-spacing:3px">下期预告</td>` +
              `<td style="vertical-align:top;padding:4px 4px 4px 12px">` +
                `<div class="np-head" style="font-size:16px;color:${T};font-weight:500;margin-bottom:10px;letter-spacing:1px">${npHeadHtml}</div>` +
                (npBodyHtml ? `<div class="np-body" style="font-size:14.5px;color:#554a3d;line-height:1.8;margin-bottom:12px">${npBodyHtml}</div>` : '') +
                (npFollowHtml ? `<div class="np-follow" style="font-size:13px;color:${T};letter-spacing:1px;margin-top:14px;padding-top:12px;border-top:1px solid ${TL}">${npFollowHtml}</div>` : '') +
              `</td>` +
            `</tr></table>` +
          `</section>`);
          break;
        }

        case 'noteNoBg': {
          // 注释无背景：顶部细分割线 + 小字次要色 + 无背景；跟随主题边框/次要文字
          const noteHtml = child.querySelector('.note-text')?.innerHTML || '（本文只做观点层面的借用与生活化的再解读，不涉及原作情节。）';
          out.push(`<section style="margin-top:24px;border:none">` +
            `<div style="height:1px;background:${BD};margin-bottom:12px"></div>` +
            `<div class="note-text" style="font-size:12.5px;color:${TMT};line-height:1.7;letter-spacing:.3px">${noteHtml}</div>` +
          `</section>`);
          break;
        }

        case 'zenQuote': {
          // 留白金句：禅意留白款；居中，主句+细分隔线+落款；跟随主题色
          const zqMainHtml = child.querySelector('.zq-main')?.innerHTML || '愿你安然度夏<br>心静自然凉';
          const zqFooterEl = child.querySelector('.zq-footer');
          const zqFooterHtml = zqFooterEl ? zqFooterEl.innerHTML : getCompText('zenQuote.footer', '晚安，我们明天见');
          out.push(`<section style="margin-top:40px;text-align:center;padding:10px 20px">` +
            `<div class="zq-main" style="font-size:15px;color:${T};letter-spacing:2px;line-height:2;margin-bottom:20px">${zqMainHtml}</div>` +
            `<div style="width:30px;height:1px;background:${T};margin:0 auto 16px"></div>` +
            `<div class="zq-footer" style="font-size:13px;color:${T};letter-spacing:1px">${zqFooterHtml}</div>` +
          `</section>`);
          break;
        }

        default:
          out.push(child.outerHTML);
      }
    }

    // 最外层容器：模拟页面背景（微信不支持 CSS 变量，必须用具体色值；样式随 pageBgMode）
    const ls = (appearance.value.letterSpacing || 0).toFixed(1);
    const baseStyle = `padding:28px 18px;border-radius:10px;box-sizing:border-box;` +
      `font-size:${fs}px;line-height:${lh};color:${TM};letter-spacing:${ls}px;`;
    const wrapperStyle = (pageBgInline.value ? pageBgInline.value : '') + baseStyle;
    return `<div style="${wrapperStyle}">${out.join('')}</div>`;
  };

  // 自动计算步骤/编号标题下一个编号
  const getNextStepNum = () => {
    if (typeof document === 'undefined') return 1;
    const tmp = document.createElement('div');
    tmp.innerHTML = editorContent.value || '';
    let maxNum = 0;
    // 统计 numberTitle
    const numBlocks = tmp.querySelectorAll('.style-number-title .num');
    for (const n of numBlocks) {
      const num = parseInt(n.textContent.trim(), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
    // 统计 circleStepBadge
    const badgeBlocks = tmp.querySelectorAll('.style-circle-step-badge .csb-num');
    for (const n of badgeBlocks) {
      const num = parseInt(n.textContent.trim(), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
    return maxNum + 1;
  };

  // 组件 HTML 模板生成器（编辑区使用，带 data-style 属性）
  // text 参数：替换默认文字（不传则用默认示例文字）
  // 组件默认文案（可在右侧面板「组件默认文案」配置），localStorage 持久化
  const COMP_TEXT_KEY = 'wechat_comp_text'
  function getCompText(key, fallback) {
    try {
      const map = JSON.parse(localStorage.getItem(COMP_TEXT_KEY) || '{}')
      const v = map[key]
      return (v === undefined || v === null) ? fallback : String(v)
    } catch (e) {
      return fallback
    }
  }

  const componentHTML = (comp, text, stepNum) => {
    const T = 'var(--theme-color, #0066ff)';
    const TL = 'var(--theme-light, #e6f0ff)';
    const TF = 'var(--theme-faint, #f8fbff)';
    const VC = 'var(--volume-color, #C8A15A)';
    const VL = 'var(--volume-light, #F7F1E6)';
    const A = 'var(--theme-accent, var(--theme-color, #C45C5C))';   // 强调色：金句/印章/重点
    const S = 'var(--theme-second, var(--theme-color, #8A9A5B))';   // 辅助色：小标题/点缀
    const TM = 'var(--theme-text-main, #444038)';                   // 正文主色
    const TMT = 'var(--theme-text-muted, #887F6A)';                 // 次要文字
    const BP = 'var(--theme-bg-page, #FFFFFF)';                     // 页面背景
    const BC = 'var(--theme-bg-card, #FFFFFF)';                     // 卡片底色
    const BD = 'var(--theme-border, #E6E2D3)';                       // 边框/分割线
    const txt = text || '';
    // 换行符 → <br>（组件内换行支持）
    const br = (s) => s.replace(/\n/g, '<br>');

    switch (comp.type) {
      case 'numberTitle': {
        const n = stepNum && !isNaN(stepNum) ? parseInt(stepNum, 10) : (comp.num ? parseInt(comp.num, 10) : 1);
        const numStr = String(n).padStart(2, '0');
        const title = txt || '编号标题';
        return `<div class="editable-block style-number-title" data-style="numberTitle"><span class="num">${numStr}</span><span class="title-text">${title}</span></div>`;
      }

      case 'gradientTitle': {
        const gt = txt || '渐变标题';
        return `<div class="editable-block style-gradient-title" data-style="gradientTitle"><h2 style="font-size:20px;font-weight:700;background:linear-gradient(90deg,${T},#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:22px 0 12px;">${gt}</h2></div>`;
      }

      case 'tagTitle': {
        const tt = txt || '标签标题';
        return `<div class="editable-block style-tag-title" data-style="tagTitle"><h2 style="font-size:18px;font-weight:700;border-left:4px solid ${T};padding-left:12px;margin:22px 0 12px;color:#333;">${tt}</h2></div>`;
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

      case 'arrowTitle': {
        const at = txt || '箭头标题';
        return `<div class="editable-block style-arrow-title" data-style="arrowTitle" style="margin:18px 0 10px"><span class="arrow-icon" style="color:${T};font-size:16px;font-weight:700">→</span><span class="arrow-text" style="font-size:16px;font-weight:700;color:#222;margin-left:8px">${at}</span></div>`;
      }

      case 'doubleLineTitle': {
        const dlt = txt || '双竖线标题';
        return `<div class="editable-block style-double-line-title" data-style="doubleLineTitle" style="text-align:center;margin:20px 0 12px"><h2 style="display:inline-block;border-left:4px solid ${S};border-right:4px solid ${S};padding:4px 12px;font-size:17px;font-weight:700;color:#333;margin:0;">${dlt}</h2></div>`;
      }

      case 'diamondTitle': {
        const dmt = txt || '菱形标题';
        return `<div class="editable-block style-diamond-title" data-style="diamondTitle" style="display:flex;align-items:center;gap:8px;margin:16px 0 10px"><span style="color:${T};font-size:14px;flex-shrink:0">◆</span><span style="font-weight:700;font-size:16px;color:#222">${dmt}</span></div>`;
      }

      case 'goldenQuote': {
        const gqt = txt || '金句名言，字字珠玑，发人深省。';
        return `<div class="editable-block style-golden-quote" data-style="goldenQuote" style="text-align:center;padding:24px 20px;margin:20px 0;background:${TL};border-radius:8px"><div style="font-size:32px;color:${A};line-height:1;margin-bottom:8px;font-family:serif">&ldquo;</div><div style="font-size:16px;color:${A};line-height:1.8">${gqt}</div></div>`;
      }

      case 'leadParagraph': {
        const lpt = br(txt) || '这是文章导语，用于概括全文要点，吸引读者继续阅读。';
        return `<div class="editable-block style-lead-paragraph" data-style="leadParagraph" style="background:${TL};border-left:4px solid ${T};padding:14px 18px;margin:16px 0;font-size:${Math.max(15, (appearance.value?.fontSize || 16) + 1)}px;color:#555;line-height:1.8">${lpt}</div>`;
      }

      case 'dividerOrnate':
        return `<div class="editable-block style-divider style-divider-ornate" data-style="dividerOrnate" style="text-align:center;margin:24px 0;color:#ccc;font-size:14px;letter-spacing:8px">✽ ✽ ✽</div>`;

      case 'quoteBlock': {
        const qt = br(txt) || '引用一段话或名人名言，让文章更有说服力和深度。';
        return `<div class="editable-block style-quote-block" data-style="quoteBlock">${qt}</div>`;
      }

      case 'highlightBlock': {
        const ht = br(txt) || '这是需要重点强调的内容，会以色块加重的形式显示，吸引读者注意力。';
        return `<div class="editable-block style-highlight-block" data-style="highlightBlock">${ht}</div>`;
      }

      case 'cardBox': {
        const cbt = br(txt) || '这里是卡片框内的内容，可以放任何文字、图片或其他元素。';
        return `<div class="editable-block style-card-box" data-style="cardBox">${cbt}</div>`;
      }

      case 'dividerSolid':
        return `<div class="editable-block style-divider" data-style="dividerSolid" style="height:1px;background:${TL}"></div>`;

      case 'dividerDashed':
        return `<div class="editable-block style-divider" data-style="dividerDashed" style="height:0px;border-top:1px dashed ${T};margin:20px 0;"></div>`;

      case 'dividerDot':
        return `<div class="editable-block style-divider" data-style="dividerDot" style="height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 3px,transparent 3px,transparent 7px);opacity:0.6"></div>`;

      case 'dividerThick':
        return `<div class="editable-block style-divider" data-style="dividerThick" style="height:2px;background:${T};opacity:0.25;border-radius:1px"></div>`;

      case 'spacer':
        return `<div data-style="spacer" style="height:24px;"></div>`;

      // ── 列表类 ──
      case 'iconList': {
        const items = ['✦ 第一个要点，言简意赅', '✦ 第二个要点，条理清晰', '✦ 第三个要点，画龙点睛'].map(
          item => `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0"><span style="color:${T};flex-shrink:0;font-size:13px">✦</span><span style="font-size:14px;color:#333;line-height:1.7">${item.replace(/^✦ /, '')}</span></div>`
        ).join('');
        return `<div class="editable-block style-icon-list" data-style="iconList" style="background:${TL};border-radius:8px;padding:14px 18px;margin:14px 0">${items}</div>`;
      }

      case 'numList': {
        const items = ['第一项内容，大字编号让层次一目了然', '第二项内容，适合排列并列的观点或步骤', '第三项内容，视觉冲击力强，记忆深刻'].map(
          (item, i) => `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #eee"><span style="font-size:22px;font-weight:800;color:${T};line-height:1;flex-shrink:0;min-width:28px">${i + 1}</span><span style="font-size:14px;color:#333;line-height:1.7;padding-top:2px">${item}</span></div>`
        ).join('');
        return `<div class="editable-block style-num-list" data-style="numList" style="padding:4px 0;margin:14px 0">${items}</div>`;
      }

      case 'colorCardList': {
        const colors = [T, '#f59e0b', '#10b981', '#8b5cf6'];
        const items = [
          { label: '优点', text: '这里描述核心优势或正向要点' },
          { label: '特点', text: '这里描述独特之处或关键特征' },
          { label: '建议', text: '这里给出实用的行动建议' },
        ].map((item, i) => {
          const c = colors[i % colors.length];
          return `<div style="display:flex;align-items:stretch;margin:6px 0;border-radius:4px;overflow:hidden"><span style="width:6px;background:${c};flex-shrink:0"></span><div style="flex:1;background:#fafafa;padding:10px 14px;font-size:14px;color:#333;line-height:1.6"><span style="font-weight:700;color:${c}">${item.label}</span> ${item.text}</div></div>`;
        }).join('');
        return `<div class="editable-block style-color-card-list" data-style="colorCardList" style="margin:14px 0">${items}</div>`;
      }

      // ── 表格类 ──
      case 'simpleTable': {
        const headers = ['项目', '说明', '备注'];
        const dataRows = [
          ['数据一', '详细描述文字', '✅'],
          ['数据二', '详细描述文字', '⚠️'],
          ['数据三', '详细描述文字', '✅'],
        ];
        const thead = headers.map(h => `<th style="padding:10px 12px;text-align:left;font-size:14px;font-weight:700;color:#fff;background:${T}">${h}</th>`).join('');
        const tbody = dataRows.map(row =>
          `<tr>${row.map(cell => `<td style="padding:9px 12px;font-size:14px;color:#333;border:1px solid #e5e7eb">${cell}</td>`).join('')}</tr>`
        ).join('');
        return `<div class="editable-block style-simple-table" data-style="simpleTable" style="margin:16px 0;overflow:hidden;border-radius:6px"><table style="width:100%;border-collapse:collapse"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      }

      case 'striTable': {
        const headers = ['指标', '本月', '上月', '变化'];
        const dataRows = [
          ['阅读量', '12,400', '9,800', '↑ 26.5%'],
          ['转化率', '3.2%', '2.8%', '↑ 0.4%'],
          ['完读率', '68%', '71%', '↓ 3%'],
        ];
        const thead = headers.map(h => `<th style="padding:10px 12px;text-align:left;font-size:14px;font-weight:700;color:${T};background:${TL};border-bottom:2px solid ${T}">${h}</th>`).join('');
        const tbody = dataRows.map((row, i) => {
          const bg = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
          return `<tr>${row.map(cell => `<td style="padding:9px 12px;font-size:14px;color:#333;background:${bg}">${cell}</td>`).join('')}</tr>`;
        }).join('');
        return `<div class="editable-block style-stri-table" data-style="striTable" style="margin:16px 0"><table style="width:100%;border-collapse:collapse"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      }

      case 'borderTable': {
        const headers = ['维度', '方案 A', '方案 B', '推荐'];
        const dataRows = [
          ['成本', '低', '中', '✅ A'],
          ['效果', '中', '高', '✅ B'],
          ['周期', '短', '长', '✅ A'],
        ];
        const thead = headers.map(h => `<th style="padding:10px 12px;text-align:center;font-size:14px;font-weight:700;color:${T};border:1px solid #ddd;background:${TL}">${h}</th>`).join('');
        const tbody = dataRows.map(row =>
          `<tr>${row.map(cell => `<td style="padding:9px 12px;font-size:14px;color:#444;text-align:center;border:1px solid #ddd">${cell}</td>`).join('')}</tr>`
        ).join('');
        return `<div class="editable-block style-border-table" data-style="borderTable" style="margin:16px 0"><table style="width:100%;border-collapse:collapse"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
      }

      case 'statCard': {
        const stats = [
          { num: '128+', label: '完成项目' },
          { num: '98%', label: '好评率' },
          { num: '3年', label: '从业经验' },
        ];
        const cells = stats.map(s =>
          `<td style="width:33%;padding:16px 8px;text-align:center;border-right:1px solid #eee;vertical-align:middle"><p style="margin:0;font-size:26px;font-weight:800;color:${T};line-height:1.2">${s.num}</p><p style="margin:4px 0 0;font-size:12px;color:#888">${s.label}</p></td>`
        ).join('');
        return `<div class="editable-block style-stat-card" data-style="statCard" style="margin:16px 0;border-radius:8px;overflow:hidden;border:1px solid #eee;background:#fff"><table style="width:100%;border-collapse:collapse"><tr>${cells}</tr></table></div>`;
      }

      // ── 新增标题类 ──
      case 'dotLineTitle': {
        const t = txt || '框线标题';
        return `<div class="editable-block style-dot-line-title" data-style="dotLineTitle" style="text-align:center;margin:18px auto;display:inline-block;padding:10px 22px;border:2px solid ${T};border-radius:6px"><span class="dl-text" style="font-size:17px;font-weight:700;color:#222">${t}</span></div>`;
      }
      case 'solidBarTitle': {
        const t = txt || '主题色底条标题';
        return `<section class="editable-block style-solid-bar-title" data-style="solidBarTitle" style="background-color:${T};border-radius:4px;padding:10px 16px;margin:14px 0"><span class="sb-text" style="font-size:15px;font-weight:700;color:#fff;letter-spacing:1px">${t}</span></section>`;
      }
      case 'diamondLineTitle': {
        const t = txt || '菱形延伸线标题';
        return `<div class="editable-block style-diamond-line-title" data-style="diamondLineTitle" style="display:flex;align-items:center;margin:20px 0;gap:0"><span style="flex:1;height:0;border-bottom:1px solid ${TL}"></span><span style="color:${T};font-size:13px;margin:0 8px;flex-shrink:0">◇</span><span class="dl-diamond-text" style="font-size:17px;font-weight:700;color:#222;flex-shrink:0">${t}</span><span style="color:${T};font-size:13px;margin:0 8px;flex-shrink:0">◇</span><span style="flex:1;height:0;border-bottom:1px solid ${TL}"></span></div>`;
      }
      case 'circleStepBadge': {
        const n = typeof stepNum === 'number' ? stepNum : getNextStepNum();
        return `<div class="editable-block style-circle-step-badge" data-style="circleStepBadge" data-step-num="${n}" style="display:flex;align-items:center;margin:22px 0"><span style="flex:1;height:0;border-bottom:1px solid #ddd"></span><span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background:${T};color:#fff;font-size:18px;font-weight:800;border-radius:50%;flex-shrink:0;margin:0 10px"><span class="csb-num">${n}</span></span><span style="flex:1;height:0;border-bottom:1px solid #ddd"></span></div>`;
      }

      // ── 易命术系列专用组件（编辑区模板，卷色用 --volume-* 变量）──
      case 'seriesLabel': {
        const sl = txt || '易命术手记 · 卷一';
        return `<div class="editable-block style-series-label" data-style="seriesLabel" style="text-align:center;margin:6px 0 18px;"><span style="font-size:13px;font-weight:500;letter-spacing:3px;color:${VC};">${sl}</span></div>`;
      }
      case 'seriesOpening': {
        const so = txt || '易命术 · 卷一 · 安身';
        return `<div class="editable-block style-series-opening" data-style="seriesOpening" style="text-align:center;margin:4px 0 18px;"><span style="font-size:13px;font-weight:500;letter-spacing:3px;color:${VC};">${so}</span></div>`;
      }

      case 'inkAxisTitle': {
        // 居中下双横（原墨韵中轴）：居中 + 主题色下划线 + 下方装饰小短线 + 宋体
        const iat = txt || '居中下双横';
        return `<div class="editable-block style-ink-axis-title" data-style="inkAxisTitle" style="text-align:center;margin:40px 0 25px 0">` +
          `<h2 style="display:inline-block;font-size:20px;color:${T};border-bottom:2px solid ${T};padding:0 10px 8px 10px;margin:0;font-weight:bold;letter-spacing:2px;font-family:'Songti SC',serif;">${iat}</h2>` +
          `<div style="width:20px;height:2px;background-color:${T};margin:5px auto 0;"></div>` +
        `</div>`;
      }

      // ── 新增强化标题（编辑区模板）──
      case 'windowLatticeTitle': {
        // 居中窗棂：四角括号框（flex 实现，避免 position:absolute 微信不支持）
        const wt = txt || '居中窗棂';
        return `<div class="editable-block style-window-lattice-title" data-style="windowLatticeTitle" style="text-align:center;margin:40px 0;">` +
          `<span style="display:inline-flex;flex-direction:column;border:1px solid ${T};">` +
            `<span style="display:flex;justify-content:space-between;padding:3px 3px 0;">` +
              `<span style="width:10px;height:10px;border-top:2px solid ${T};border-left:2px solid ${T};"></span>` +
              `<span style="width:10px;height:10px;border-top:2px solid ${T};border-right:2px solid ${T};"></span>` +
            `</span>` +
            `<h2 style="margin:0;padding:8px 22px;font-size:18px;color:${T};font-family:'Songti SC',serif;font-weight:bold;">${wt}</h2>` +
            `<span style="display:flex;justify-content:space-between;padding:0 3px 3px;">` +
              `<span style="width:10px;height:10px;border-bottom:2px solid ${T};border-left:2px solid ${T};"></span>` +
              `<span style="width:10px;height:10px;border-bottom:2px solid ${T};border-right:2px solid ${T};"></span>` +
            `</span>` +
          `</span>` +
        `</div>`;
      }
      case 'centeredCapsuleTitle': {
        // 居中胶囊：主题浅底 + 全圆角胶囊
        const cct = txt || '居中胶囊';
        return `<div class="editable-block style-centered-capsule-title" data-style="centeredCapsuleTitle" style="text-align:center;margin:40px 0;">` +
          `<h2 style="display:inline-block;font-size:16px;color:${T};background-color:${TL};padding:8px 25px;border-radius:50px;margin:0;font-weight:bold;letter-spacing:1px;">${cct}</h2>` +
        `</div>`;
      }
      case 'dashedCenterTitle': {
        // 虚框居中：虚线框 + 主题浅底 + 同色偏移阴影
        const dct = txt || '虚框居中';
        return `<div class="editable-block style-dashed-center-title" data-style="dashedCenterTitle" style="margin:30px 10px;">` +
          `<h2 style="font-size:18px;color:${T};background-color:${TL};padding:15px;border:1px dashed ${T};border-radius:4px;margin:0;text-align:center;box-shadow:2px 2px 0px ${TL};">${dct}</h2>` +
        `</div>`;
      }
      case 'solidCenterFrameTitle': {
        // 实线居中框：上下横实线 + 左右竖线（嵌套 span 边框，避免 position:absolute）
        const scft = txt || '实线居中框';
        return `<div class="editable-block style-solid-center-frame-title" data-style="solidCenterFrameTitle" style="text-align:center;margin:40px 0;">` +
          `<h2 style="display:inline-block;font-size:22px;color:${T};margin:0;font-weight:bold;border-top:2px solid ${T};border-bottom:2px solid ${T};padding:8px 30px;">` +
            `<span style="display:inline-block;border-left:2px solid ${T};border-right:2px solid ${T};padding:0 10px;">${scft}</span>` +
          `</h2>` +
        `</div>`;
      }
      case 'titleShuName': {
        const st = txt || '易命X术 · 术名';
        return `<div class="editable-block style-shu-name" data-style="titleShuName"><span style="display:block;text-align:center;font-size:16px;font-weight:700;color:#B0392E;line-height:1.6;letter-spacing:0.5px">${st}</span></div>`;
      }
      case 'titleVolBlock': {
        const vb = txt || '板块小标题';
        return `<div class="editable-block style-vol-block" data-style="titleVolBlock" style="display:flex;align-items:center;gap:10px;margin:20px 0 10px"><span style="display:inline-block;width:4px;height:16px;background:${VC};flex-shrink:0"></span><span style="font-size:16px;font-weight:700;color:#1A1A1A">${vb}</span></div>`;
      }
      case 'cardVolume': {
        const cbt = br(txt) || '卷色浅底卡片：用于「本卷小结」或「下一篇预告」，标题以朱砂加粗。';
        return `<div class="editable-block style-card-volume" data-style="cardVolume" style="background:${VL};border-left:3px solid ${VC};border-radius:8px;padding:16px 18px;margin:16px 0;font-size:14px;color:#444;line-height:1.8">${cbt}</div>`;
      }
      case 'dividerDots': {
        return `<div class="editable-block style-divider" data-style="dividerDots" style="text-align:center;margin:24px 0;color:#CCCCCC;font-size:14px;letter-spacing:6px">· · ·</div>`;
      }

      case 'dividerTextCenter': {
        // 居中文字基础款：左线 + 居中文字 + 右线（table 替代 flex，跟随主题色）
        const dtc = txt || '秋序';
        return `<div class="editable-block style-divider" data-style="dividerTextCenter" style="margin:32px 0">` +
          `<table style="width:100%;border-collapse:collapse"><tr>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
            `<td style="white-space:nowrap;padding:0 16px;font-size:14px;letter-spacing:2px;color:${T};vertical-align:middle;"><span class="dt-text">${dtc}</span></td>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
          `</tr></table>` +
        `</div>`;
      }

      case 'dividerDotsText': {
        // 文字 + 小圆点：左线 + [圆点 文字 圆点] + 右线（跟随主题色）
        const ddt = txt || '正文篇章';
        return `<div class="editable-block style-divider" data-style="dividerDotsText" style="margin:32px 0">` +
          `<table style="width:100%;border-collapse:collapse"><tr>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
            `<td style="white-space:nowrap;padding:0 12px;vertical-align:middle;">` +
              `<span style="display:inline-block;width:5px;height:5px;background:${T};border-radius:50%;vertical-align:middle;margin-right:10px;"></span>` +
              `<span class="dt-text" style="font-size:14px;letter-spacing:2px;color:${T};vertical-align:middle;">${ddt}</span>` +
              `<span style="display:inline-block;width:5px;height:5px;background:${T};border-radius:50%;vertical-align:middle;margin-left:10px;"></span>` +
            `</td>` +
            `<td style="width:50%;vertical-align:middle;"><div style="height:1px;background:${T};"></div></td>` +
          `</tr></table>` +
        `</div>`;
      }

      case 'dividerGradient': {
        // 渐变柔线：左右透明、中间主题色的极淡分隔线（跟随主题色）
        return `<div class="editable-block style-divider" data-style="dividerGradient" style="margin:32px 10px">` +
          `<div style="width:100%;height:1px;background:linear-gradient(to right,transparent,${T},transparent);"></div>` +
        `</div>`;
      }

      case 'topicSectionCard': {
        // 主题章节卡片（简化）：浅色底 + 左对齐章节标题(无编号) + 横线 + 白底文本框（无图片/无装饰）
        const title = comp.title || '章节标题';
        const bodyText = comp.bodyText || txt || '输入';
        return `<div class="editable-block style-topic-section-card" data-style="topicSectionCard" style="background:${VL};border-radius:12px;padding:20px;margin:20px 0">` +
          // 标题栏：左对齐（无编号），下方横线
          `<div class="tsc-title" style="font-size:20px;font-weight:800;color:#333;line-height:1;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid ${T}">${title}</div>` +
          // 白底文本框
          `<div style="background:#fff;border-radius:10px;padding:18px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">` +
            `<p style="margin:0;font-size:${appearance.value?.fontSize || 15}px;color:#444;line-height:1.9;text-align:justify">${br(bodyText)}</p>` +
          `</div>` +
        `</div>`;
      }

      case 'doubleLayerFrame': {
        // 国风双层框：外层浅底(主题浅色) + 内层白底 + 主题色边框 + 标题(主题色) + 正文
        const dlfTitle = comp.title || txt || '立秋 · 节气';
        const bodyText = comp.bodyText || '盛夏的热烈已然沉淀，秋日的温柔缓缓登场。万物收敛锋芒、蓄力生长，人间也迎来了最适合沉淀、精进的时节。愿我们在这个初秋，褪去浮躁、静心沉淀，如秋日万物一般，收敛心性、深耕自我。';
        const dlfSub = comp.subtitle ? ` <span class="dlf-sub" style="font-size:14px;color:${T};opacity:0.65;font-weight:normal;letter-spacing:1px">${comp.subtitle}</span>` : '';
        return `<div class="editable-block style-double-layer-frame" data-style="doubleLayerFrame" style="background:${TL};border-radius:4px;padding:20px;margin:18px 0">` +
          `<div style="background-color:#ffffff;border:1px solid ${T};padding:24px 28px">` +
            `<div class="dlf-title" style="font-size:18px;color:${T};font-weight:500;letter-spacing:2px;margin-bottom:16px">${dlfTitle}${dlfSub}</div>` +
            `<p style="margin:0;font-size:${appearance.value?.fontSize || 15}px;color:#4a4a4a;line-height:1.8;text-align:justify">${br(bodyText)}</p>` +
          `</div>` +
        `</div>`;
      }

      case 'noteSmall': {
        // 小字注释：选中文字作为注释正文（中性灰，不随主题）
        const nsBody = txt || '注：这里是小字注释内容，用于补充说明、引用来源或备注信息。';
        return `<div class="editable-block style-note-small" data-style="noteSmall" style="padding:12px 16px;background:#f5f5f5;border-radius:4px;margin:14px 4px">` +
          `<div class="ns-text" style="font-size:13px;color:#777;line-height:1.7">${br(nsBody)}</div>` +
        `</div>`;
      }

      case 'luxuryThinFrame': {
        // 轻奢细框：主题色渐变外框(随主题色) + 内白底 + 居中文字(主题色)
        const ltBody = txt || '愿你在这个秋天，<br>有收获，有期待，<br>所有的努力都能结出硕果。';
        return `<div class="editable-block style-luxury-thin-frame" data-style="luxuryThinFrame" style="padding:3px;background:linear-gradient(135deg,${T},${TL});border-radius:4px;margin:18px 0">` +
          `<div style="padding:24px 28px;background:#ffffff;border-radius:2px">` +
            `<div class="ltf-text" style="font-size:15px;color:${T};line-height:1.9;text-align:center;letter-spacing:1px">${ltBody}</div>` +
          `</div>` +
        `</div>`;
      }

      case 'topBottomDoubleLine': {
        // 上下双线：主题色细线夹居中文字
        const tbBody = txt || '万物收敛锋芒、蓄力生长，人间也迎来了最适合沉淀、精进的时节。';
        return `<div class="editable-block style-top-bottom-double-line" data-style="topBottomDoubleLine" style="padding:12px 0;margin:20px 10px">` +
          `<div style="width:100%;height:1px;background:${T}"></div>` +
          `<div class="tb-text" style="padding:20px 16px;font-size:16px;color:#333;line-height:1.9;text-align:center;letter-spacing:1px">${br(tbBody)}</div>` +
          `<div style="width:100%;height:1px;background:${T}"></div>` +
        `</div>`;
      }

      case 'dividerQuote': {
        // 分割线金句：主题色侧线 + 主题色标题 + 居中正文
        const dqBody = txt || '真正的高级感，从来不是堆砌元素，而是克制的留白与舒适的配色。';
        return `<div class="editable-block style-divider-quote" data-style="dividerQuote" style="padding:20px 0;text-align:center;margin:18px 0">` +
          `<div><span style="display:inline-block;width:60px;height:1px;background:${A};vertical-align:middle"></span><span class="dq-title" style="margin:0 16px;font-size:16px;color:${A};letter-spacing:3px">核心观点</span><span style="display:inline-block;width:60px;height:1px;background:${A};vertical-align:middle"></span></div>` +
          `<div class="dq-text" style="margin-top:18px;font-size:15px;color:#333;line-height:1.8;padding:0 20px;text-align:center">${br(dqBody)}</div>` +
        `</div>`;
      }

      case 'doubleLayerFrameRound': {
        // 国风双层框·圆角版：外浅底(主题浅色)+圆角 + 内白底+主题色边框+圆角 + 标题(主题色)+正文
        const dlfrTitle = comp.title || txt || '立秋 · 节气';
        const dlfrBody = comp.bodyText || '盛夏的热烈已然沉淀，秋日的温柔缓缓登场。万物收敛锋芒、蓄力生长，人间也迎来了最适合沉淀、精进的时节。愿我们在这个初秋，褪去浮躁、静心沉淀，如秋日万物一般，收敛心性、深耕自我。';
        const dlfrSub = comp.subtitle ? ` <span class="dlfr-sub" style="font-size:14px;color:${T};opacity:0.65;font-weight:normal;letter-spacing:1px">${comp.subtitle}</span>` : '';
        return `<div class="editable-block style-double-layer-frame-round" data-style="doubleLayerFrameRound" style="background:${TL};border-radius:12px;padding:18px;margin:18px 0">` +
          `<div style="background-color:#ffffff;border:1px solid ${T};border-radius:8px;padding:24px 28px">` +
            `<div class="dlfr-title" style="font-size:18px;color:${T};font-weight:500;letter-spacing:2px;margin-bottom:16px">${dlfrTitle}${dlfrSub}</div>` +
            `<p class="dlfr-body" style="margin:0;font-size:${appearance.value?.fontSize || 15}px;color:#4a4a4a;line-height:1.8;text-align:justify">${br(dlfrBody)}</p>` +
          `</div>` +
        `</div>`;
      }

      case 'waistSealRounded': {
        // 腰封圆角：外浅底(主题浅色)+大圆角 + 内白底+主题色细边 + 顶部腰封标题(主题色)+正文
        const wsrTitle = comp.title || txt || '三伏养生三原则';
        const wsrBody = comp.bodyText || '一曰顺时养阳，不贪寒凉；二曰健脾祛湿，饮食清淡；三曰静心安神，戒骄戒躁。三者兼顾，方能安然度夏，不伤元气。';
        return `<div class="editable-block style-waist-seal-rounded" data-style="waistSealRounded" style="padding:16px;background:${TL};border-radius:14px;margin:18px 0">` +
          `<div style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid ${T}">` +
            `<div class="wsr-title" style="padding:14px 24px;background:${T};color:#fff;font-size:16px;letter-spacing:2px">${wsrTitle}</div>` +
            `<div class="wsr-body" style="padding:22px 26px;font-size:${appearance.value?.fontSize || 15}px;color:#444;line-height:1.9;text-align:justify">${br(wsrBody)}</div>` +
          `</div>` +
        `</div>`;
      }

      case 'bambooJoint': {
        // 竹节分割：外浅底(主题浅色)+圆角 + 左侧竹节竖条(主题色)+主题色标题+右侧细线(主题色) + 正文
        const bjTitle = comp.title || txt || '初伏 · 养阳';
        const bjBody = comp.bodyText || '三伏天是一年中阳气最盛的时段，此时人体阳气浮于体表，内里虚寒，最忌贪凉饮冷。饮食宜温不宜寒，作息宜静不宜躁，顺势养阳，方能为秋冬积蓄能量。';
        return `<div class="editable-block style-bamboo-joint" data-style="bambooJoint" style="padding:24px 28px;background:${TL};border-radius:12px;margin:18px 0">` +
          `<table style="width:100%;border-collapse:collapse;margin-bottom:18px"><tr>` +
            `<td style="white-space:nowrap;vertical-align:middle">` +
              `<span style="display:inline-block;width:4px;height:18px;background:${T};border-radius:2px;margin-right:10px;vertical-align:middle"></span>` +
              `<span class="bj-title" style="font-size:17px;color:${T};font-weight:500;letter-spacing:1.5px;vertical-align:middle">${bjTitle}</span>` +
            `</td>` +
            `<td style="width:100%;vertical-align:middle">` +
              `<div style="height:1px;background:${T};margin-left:16px"></div>` +
            `</td>` +
          `</tr></table>` +
          `<div class="bj-body" style="padding-left:4px;font-size:${appearance.value?.fontSize || 15}px;color:#444a3e;line-height:1.9;text-align:justify">${br(bjBody)}</div>` +
        `</div>`;
      }

      case 'bodyText': {
        // 正文：宣纸质感长文段（背景跟随主题色，极浅）+ 首行缩进 2em + 两端对齐
        const bt = br(txt) || '盛夏的热烈已然沉淀，秋日的温柔缓缓登场。万物收敛锋芒、蓄力生长，人间也迎来了最适合沉淀、精进的时节。愿我们在这个初秋，褪去浮躁、静心沉淀，如秋日万物一般，收敛心性、深耕自我。';
        return `<div class="editable-block style-body-text" data-style="bodyText" style="padding:30px 32px;background:${TF};border-radius:6px;margin:18px 0">` +
          `<div style="font-size:15px;color:#3a3630;line-height:2;text-align:justify;text-indent:2em">${bt}</div>` +
        `</div>`;
      }

      case 'qaBox': {
        // 互动提问框：外层主题浅底+大圆角，内层白卡+主题浅边+居中；跟随主题色
        // 标题/结尾固定，中间内容区可传入 comp.bodyText 或 txt
        const qaBody = comp.bodyText || txt || '关于三伏养生，你还有什么私藏的小妙招？<br>欢迎在留言区分享给大家～';
        const qaFooter = getCompText('qaBox.footer', '点赞 + 在看，夏日安康 ❤');
        return `<div class="editable-block style-qa-box" data-style="qaBox" style="margin-top:30px;padding:18px;background:${TF};border-radius:12px">` +
          `<div style="padding:24px 28px;background:#ffffff;border:1px solid ${TL};border-radius:8px;text-align:center">` +
            `<div class="qa-title" style="font-size:16px;color:${T};font-weight:500;letter-spacing:2px;margin-bottom:14px">· 互动话题 ·</div>` +
            `<div class="qa-body" style="font-size:15px;color:#4a4a4a;line-height:1.8;margin-bottom:18px">${qaBody}</div>` +
            `<div class="qa-footer" style="font-size:13px;color:${T};letter-spacing:1px">${qaFooter}</div>` +
          `</div>` +
        `</div>`;
      }

      case 'nextPreview': {
        // 下期预告：书卷式预告（np-head 标题 / np-body 内容 / np-follow 引导关注）
        // 优先用 applyBlockStyle 传入的 comp.title / comp.bodyText（标题+正文双段卡片）
        // 兼容旧 txt（Markdown/关键字映射）路径：按首个「：」拆标题/正文，「关注我」起为引导关注
        const dFollow = getCompText('nextPreview.follow', '关注我，一起读懂改运的底层逻辑。')
        let npHead, npBody, npFollow
        if (comp.title || comp.bodyText) {
          npHead = comp.title || (txt ? txt.split('：')[0] : '下期预告')
          npBody = comp.bodyText || ''
          npFollow = dFollow
        } else if (txt) {
          const idx = txt.indexOf('：')
          const head = idx > -1 ? txt.slice(0, idx) : txt
          const rest = idx > -1 ? txt.slice(idx + 1) : ''
          const fIdx = rest.indexOf('关注我')
          if (fIdx > -1) {
            npHead = head
            npBody = rest.slice(0, fIdx).replace(/[。.\s]+$/, '')
            npFollow = rest.slice(fIdx)
          } else {
            npHead = head
            npBody = rest
            npFollow = dFollow
          }
        } else {
          npHead = '易命四十二术·逐成者务修者'
          npBody = '越急着要结果的人，越容易把路走歪——修己的人，反而先到终点。'
          npFollow = dFollow
        }
        return `<div class="editable-block style-next-preview" data-style="nextPreview" style="margin-top:30px;padding:20px;background:${TF};border-radius:12px">` +
          `<table style="width:100%;border-collapse:collapse"><tr>` +
            `<td style="width:1%;white-space:nowrap;vertical-align:top;padding:8px 5px 8px 3px;border-right:1px solid ${TL};writing-mode:vertical-rl;text-orientation:upright;font-size:14px;color:${T};letter-spacing:3px">下期预告</td>` +
            `<td style="vertical-align:top;padding:4px 4px 4px 12px">` +
              `<div class="np-head" style="font-size:16px;color:${T};font-weight:500;margin-bottom:10px;letter-spacing:1px">${npHead}</div>` +
              (npBody ? `<div class="np-body" style="font-size:14.5px;color:#554a3d;line-height:1.8;margin-bottom:12px">${br(npBody)}</div>` : '') +
              (npFollow ? `<div class="np-follow" style="font-size:13px;color:${T};letter-spacing:1px;margin-top:14px;padding-top:12px;border-top:1px solid ${TL}">${npFollow}</div>` : '') +
            `</td>` +
          `</tr></table>` +
        `</div>`;
      }

      case 'zenQuote': {
        // 留白金句：禅意留白款；居中，主句(来自段落/配置)+细分隔线+落款(可配置)
        // 主句优先用当前段落内容(comp.bodyText)或传入 txt；落款读可配置文案，留空则不显示
        const zqMain = comp.bodyText || txt || '愿你安然度夏<br>心静自然凉';
        const zqFooter = getCompText('zenQuote.footer', '晚安，我们明天见');
        return `<div class="editable-block style-zen-quote" data-style="zenQuote" style="margin-top:40px;text-align:center;padding:10px 20px">` +
          `<div class="zq-main" style="font-size:15px;color:${T};letter-spacing:2px;line-height:2;margin-bottom:20px">${zqMain}</div>` +
          `<div style="width:30px;height:1px;background:${T};margin:0 auto 16px"></div>` +
          (zqFooter ? `<div class="zq-footer" style="font-size:13px;color:${T};letter-spacing:1px">${zqFooter}</div>` : '') +
        `</div>`;
      }

      case 'noteNoBg': {
        // 注释无背景：顶部细分割线 + 小字次要色 + 无背景；跟随主题边框/次要文字
        const txtNote = txt || '（这一术出自小说《改运奇书》，本文只做观点层面的借用与生活化的再解读，不涉及小说情节。）';
        return `<div class="editable-block style-note-no-bg" data-style="noteNoBg" style="margin-top:24px">` +
          `<div style="height:1px;background:${BD};margin-bottom:12px"></div>` +
          `<div class="note-text" style="font-size:12.5px;color:${TMT};line-height:1.7;letter-spacing:.3px">${txtNote}</div>` +
        `</div>`;
      }

      default:
        return `<p>${comp.name || '组件'}</p>`;
    }
  };

  // 预览用计算属性：使用 buildWechatHTML() 输出，确保「预览 = 微信渲染效果」完全一致
  const previewHTML = computed(() => {
    const app = appearance.value;

    if (!editorContent.value || !editorContent.value.trim()) {
      return `<p style="color:#bbb;text-align:center;padding:60px 0;">在中间编辑区输入内容，或从左侧选择组件插入...</p>`;
    }

    try {
      return buildWechatHTML(editorContent.value);
    } catch (e) {
      return `<div style="font-size:${app.fontSize}px;line-height:${(1.8*app.lineSpacing).toFixed(1)};color:${app.bodyColor};letter-spacing:${app.letterSpacing}px;">
<p style="color:red;font-size:13px;background:#fee;padding:8px 12px;border-radius:6px;margin:14px 0;">⚠️ previewHTML 渲染出错：${e.message || e}</p>
${editorContent.value}
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
    themeOverrides,
    saveThemeOverride,
    resetThemeOverride,
    hasThemeOverride,
    keywordMaps,
    getKeywordMaps,
    saveKeywordMaps,
    deleteKeywordMap,
    setTheme,
    currentThemeColor,
    currentThemeLight,
    currentVolumeColor,
    currentVolumeLight,
    currentThemeAccent,
    currentThemeSecond,
    currentThemeTextMain,
    currentThemeTextMuted,
    currentThemeBgPage,
    currentThemeBgCard,
    currentThemeBorder,
    // 样式预设系统
    currentStylePreset,
    customStylePresets,
    allStylePresets,
    stylePresetList,
    createStylePreset,
    deleteStylePreset,
    updateStylePreset,
    setStylePreset,
    // 样式预设覆盖层
    stylePresetOverrides,
    saveStylePresetOverride,
    resetStylePresetOverride,
    hasStylePresetOverride,
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
    pageBgMode,
    setPageBgMode,
    pageBgInline,
    PAGE_BG_OPTIONS,
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

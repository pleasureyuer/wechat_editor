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

  // 外观配置（双层容器 + 元素样式）
  const appearance = ref({
    // 正文参数
    fontSize: 16,           // 正文字号大小
    lineSpacing: 1,         // 段间距倍数
    // 双层容器
    contentBgColor: '#ffffff',   // 内容区背景色
    contentPadding: 8,      // 内容区内边距
    contentRadius: 15,      // 内容区圆角
    outerBgColor: '#f5efe6',    // 外层背景色
    outerPadding: 16,       // 外层边距大小
    outerRadius: 12,        // 外层圆角大小
    // 标题样式映射（MD的# ## ### 对应哪个组件模板）
    h1Style: 'gradientTitle',
    h2Style: 'leftLineTitle',
    h3Style: 'softPillTitle',
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
  const titleStylePresets = [
    { id: 'gradientTitle', name: '渐变大标题', icon: '🎨' },
    { id: 'tagTitle', name: '标签边框', icon: '🏷️' },
    { id: 'leftLineTitle', name: '左竖线', icon: '▎' },
    { id: 'rightLineTitle', name: '右竖线', icon: '▐' },
    { id: 'centerLineTitle', name: '居中分割线', icon: '➖' },
    { id: 'underlineTitle', name: '下划线', icon: 'Ｕ' },
    { id: 'cardTitle', name: '卡片底色', icon: '📋' },
    { id: 'numberTitle', name: '编号圆标', icon: '①' },
    { id: 'pillTitle', name: '胶囊圆点', icon: '●' },
    { id: 'stepTitle', name: '步骤序号', icon: '1️⃣' },
    { id: 'circleIconTitle', name: '圆形图标', icon: '💡' },
    { id: 'dotLine', name: '圆点横线', icon: '●—' },
    { id: 'softPillTitle', name: '软标签', icon: '🏷️' },
  ];

  const setAppearance = (key, value) => {
    if (key in appearance.value) {
      appearance.value[key] = value;
    }
  };

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

      // 只处理 editable-block
      if (!child.classList.contains('editable-block')) continue;

      const ds = child.getAttribute('data-style') || '';
      // 组件整体内容（用于直接取文本的组件）
      const txt = child.innerHTML;

      switch(ds) {
        case 'numberTitle': {
          const n = child.querySelector('.num');
          const t = child.querySelector('.title-text');
          const numTxt = n ? n.textContent.trim() : '';
          const textHtml = t ? t.innerHTML : '';
          out.push(`<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 16px;border-collapse:collapse;border:none;">` +
            `<tr>` +
              `<td style="width:44px;vertical-align:middle;text-align:center;border:none;padding:0;">` +
                `<span style="background:${T};color:${TC};width:44px;height:44px;border-radius:50%;text-align:center;line-height:44px;font-size:18px;font-weight:700;display:inline-block;">${numTxt}</span>` +
              `</td>` +
              `<td style="vertical-align:middle;border:none;padding:0 0 0 12px;">` +
                `<section style="font-size:20px;font-weight:700;color:${T};padding-bottom:10px;border-bottom:2px solid ${TL};margin:0;">${textHtml}</section>` +
              `</td>` +
            `</tr>` +
          `</table>`);
          break;
        }

        case 'gradientTitle': {
          out.push(`<section style="background:${T};color:${TC};padding:14px 20px;font-size:20px;font-weight:700;border-radius:10px;margin:16px 0;">${child.textContent.trim()}</section>`);
          break;
        }

        case 'tagTitle': {
          out.push(`<section style="text-align:center;margin:24px 0 16px;">` +
            `<span style="border-top:2px solid ${T};border-right:2px solid ${T};border-bottom:2px solid ${T};border-left:2px solid ${T};border-radius:30px;padding:10px 28px;font-size:18px;font-weight:700;color:${T};">${child.textContent.trim()}</span></section>`);
          break;
        }

        case 'pillTitle': {
          const p = child.querySelector('.pill');
          const t = child.querySelector('.pill-text');
          const pillTxt = p ? p.textContent.trim() : '';
          const textHtml = t ? t.innerHTML : '';
          out.push(`<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 16px;border-collapse:collapse;border:none;">` +
            `<tr>` +
              `<td style="width:36px;vertical-align:middle;text-align:center;border:none;padding:0;">` +
                `<span style="background:${T};color:${TC};width:36px;height:36px;border-radius:50%;text-align:center;line-height:36px;font-size:16px;font-weight:700;display:inline-block;">${pillTxt}</span>` +
              `</td>` +
              `<td style="vertical-align:middle;border:none;padding:0 0 0 10px;">` +
                `<section style="font-size:18px;font-weight:700;color:${T};padding-bottom:8px;border-bottom:2px solid ${TL};margin:0;">${textHtml}</section>` +
              `</td>` +
            `</tr>` +
          `</table>`);
          break;
        }

        case 'softPillTitle': {
          out.push(`<p style="margin:20px 0 12px;"><span style="background:#f0f0f0;color:#666;padding:2px 10px;border-radius:10px;font-size:11px;margin-right:8px;">标签</span><span style="font-size:16px;font-weight:600;">${child.textContent.trim()}</span></p>`);
          break;
        }

        case 'leftLineTitle': {
          out.push(`<section style="padding:6px 0 6px 14px;border-left:5px solid ${T};margin:24px 0 16px;font-size:18px;font-weight:700;color:#333;line-height:1.4;">${txt}</section>`);
          break;
        }

        case 'rightLineTitle': {
          out.push(`<section style="padding:6px 14px 6px 0;border-right:5px solid ${T};margin:24px 0 16px;font-size:18px;font-weight:700;color:#333;text-align:right;line-height:1.4;">${txt}</section>`);
          break;
        }

        case 'centerLineTitle': {
          out.push(`<section align="center" style="margin:28px 0 18px;padding:0;"><span style="display:inline-block;width:30%;border-bottom:2px solid ${TL};vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span><span style="padding:0 14px;white-space:nowrap;font-size:17px;font-weight:700;color:#333;vertical-align:middle;">${txt}</span><span style="display:inline-block;width:30%;border-bottom:2px solid ${TL};vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span></section>`);
          break;
        }

        case 'circleIconTitle': {
          out.push(`<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:20px 0 12px;border-collapse:collapse;border:none;">` +
            `<tr>` +
              `<td style="width:36px;vertical-align:middle;text-align:center;border:none;padding:0;">` +
                `<span style="display:inline-block;background:${T};color:${TC};width:36px;height:36px;border-radius:50%;text-align:center;line-height:36px;font-size:16px;">💡</span>` +
              `</td>` +
              `<td style="vertical-align:middle;border:none;padding:0 0 0 10px;">` +
                `<span style="font-size:17px;font-weight:700;color:#333;">${child.querySelector('span:last-child')?.innerHTML || child.textContent.trim()}</span>` +
              `</td>` +
            `</tr>` +
          `</table>`);
          break;
        }

        case 'dotLine': {
          const t = child.querySelector('.dot-text');
          const textHtml = t ? t.innerHTML : child.querySelectorAll('span')[2]?.innerHTML || '';
          out.push(`<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:20px 0 12px;border-collapse:collapse;border:none;">` +
            `<tr>` +
              `<td style="width:40px;vertical-align:middle;text-align:center;border:none;padding:0;">` +
                `<span style="color:${T};font-size:18px;">●</span>` +
              `</td>` +
              `<td style="vertical-align:middle;border:none;padding:0 8px;">` +
                `<span style="font-size:16px;font-weight:600;color:${T};">${textHtml}</span>` +
              `</td>` +
              `<td style="width:25%;vertical-align:middle;border:none;padding:0;">` +
                `<span style="display:inline-block;width:100%;border-bottom:2px solid ${TL};font-size:1px;line-height:1px;">&nbsp;</span>` +
              `</td>` +
            `</tr>` +
          `</table>`);
          break;
        }

        case 'underlineTitle': {
          out.push(`<section align="center" style="margin:24px 0 16px;padding:0;"><span style="font-size:18px;font-weight:700;color:${T};padding-bottom:10px;border-bottom:3px solid ${T};">${child.textContent.trim()}</span></section>`);
          break;
        }

        case 'cardTitle': {
          out.push(`<section style="border-left:4px solid ${T};background:${TL};color:${T};padding:10px 18px;font-size:17px;font-weight:700;border-radius:8px;margin:16px 0;">${child.textContent.trim()}</section>`);
          break;
        }

        case 'stepTitle': {
          const sn = child.querySelector('b') || child.querySelector('.step-num');
          const stxt = child.querySelector('span:last-child') || child.querySelector('.step-text');
          const stepTxt = sn ? sn.textContent.trim() : '';
          const stepTextHtml = stxt ? stxt.innerHTML : '';
          out.push(`<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 16px;border-collapse:collapse;border:none;">` +
            `<tr>` +
              `<td style="width:32px;vertical-align:middle;text-align:center;border:none;padding:0;">` +
                `<span style="background:${T};color:${TC};width:32px;height:32px;border-radius:8px;text-align:center;line-height:32px;font-size:15px;font-weight:700;display:inline-block;">${stepTxt}</span>` +
              `</td>` +
              `<td style="vertical-align:middle;border:none;padding:0 0 0 10px;">` +
                `<section style="font-size:17px;font-weight:700;color:#333;padding-bottom:6px;border-bottom:2px solid ${TL};margin:0;">${stepTextHtml}</section>` +
              `</td>` +
            `</tr>` +
          `</table>`);
          break;
        }

        case 'cardBox': {
          out.push(`<section style="border-top:1px solid #e0e6ed;border-right:1px solid #e0e6ed;border-bottom:1px solid #e0e6ed;border-left:1px solid #e0e6ed;background-color:#ffffff;padding:20px;margin:16px 0;">${txt}</section>`);
          break;
        }

        case 'highlightBlock': {
          out.push(`<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse;border:none;">` +
            `<tr>` +
              `<td style="border:none;padding:0;width:40px;vertical-align:top;text-align:center;">` +
                `<span style="font-size:18px;color:${T};">◆</span>` +
              `</td>` +
              `<td style="border:none;padding:0 0 0 12px;background:${TL};">` +
                `<section style="font-size:16px;color:#444;line-height:1.8;padding:14px 8px;">${txt}</section>` +
              `</td>` +
            `</tr>` +
          `</table>`);
          break;
        }

        case 'quoteBlock': {
          out.push(`<blockquote style="border-left:4px solid ${T};background:#f7f7f7;padding:14px 18px;color:#595959;font-size:16px;line-height:1.8;margin:16px 0;">${child.textContent}</blockquote>`);
          break;
        }

        case 'infoBox': {
          out.push(`<section style="background:${TL};border-top:1px solid rgba(0,102,255,0.1);border-right:1px solid rgba(0,102,255,0.1);border-bottom:1px solid rgba(0,102,255,0.1);border-left:1px solid rgba(0,102,255,0.1);border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;">${txt}</section>`);
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
          out.push(`<p><span style="display:inline-block;width:100%;height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 6px,transparent 6px,transparent 10px);vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span></p>`);
          break;
        }

        case 'dividerDot': {
          out.push(`<p style="text-align:center;margin:24px 0;color:${TL};font-size:14px;letter-spacing:10px;">● ● ●</p>`);
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

  // 预览用的计算属性（自动转换编辑器内容为公众号兼容HTML + 双层容器）
  const previewHTML = computed(() => {
    const app = appearance.value;
    const T = currentThemeColor.value;
    const fs = app.fontSize;

    if (!editorContent.value || !editorContent.value.trim()) {
      return `<div style="background:${app.outerBgColor};padding:${app.outerPadding}px;border-radius:${app.outerRadius}px;display:flex;align-items:center;justify-content:center;min-height:300px;"><p style="color:#bbb;text-align:center;">在中间编辑区输入内容，或从左侧选择组件插入...</p></div>`;
    }

    const innerContent = buildWechatHTML(editorContent.value);

    // 双层容器结构
    // 外层：模拟手机/公众号阅读界面背景
    // 内层：文章内容区域
    return `<div style="background:${app.outerBgColor};padding:${app.outerPadding}px;border-radius:${app.outerRadius}px;">
<div style="background:${app.contentBgColor};border-radius:${app.contentRadius}px;padding:${app.contentPadding * (fs/16)}px ${Math.max(16, app.contentPadding * 1.5) * (fs/16)}px;font-size:${fs}px;line-height:${(1.8 * app.lineSpacing).toFixed(1)};color:#262626;">
${innerContent}
</div>
</div>`;
  });

  return {
    currentTheme,
    themes,
    editorContent,
    selectedComponent,
    setTheme,
    currentThemeColor,
    currentThemeLight,
    buildWechatHTML,
    previewHTML,
    appearance,
    bgPresets,
    titleStylePresets,
    setAppearance
  };
});

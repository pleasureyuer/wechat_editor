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

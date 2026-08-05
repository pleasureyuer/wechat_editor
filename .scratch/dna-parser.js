// C1 原型：公众号文章 → styleDNA 解析器
// 用法: node dna-parser.js <htmlPath> [url]
const cheerio = require('cheerio');
const fs = require('fs');

function parseInlineStyle(style = '') {
  const out = {};
  style.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx < 0) return;
    const k = decl.slice(0, idx).trim().toLowerCase();
    const v = decl.slice(idx + 1).trim();
    if (k && v) out[k] = v;
  });
  return out;
}

function normHex(c) {
  if (!c) return null;
  c = c.trim().toLowerCase();
  if (c.startsWith('#')) {
    if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    return /^#[0-9a-f]{6}$/.test(c) ? c : null;
  }
  if (c.startsWith('rgb')) {
    const m = c.match(/\d+/g);
    if (m && m.length >= 3) {
      return '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');
    }
  }
  return null;
}

// 判断是否为“装饰/无视觉意义”的纯包装层
function isDecorative(decl, tag) {
  const visual = [
    'background', 'background-color', 'border', 'border-top', 'border-bottom',
    'border-left', 'border-right', 'box-shadow', 'border-radius', 'padding',
    'color', 'font-size', 'font-weight',
  ];
  const hasVisual = visual.some((k) => decl[k] && decl[k] !== 'none' && decl[k] !== '0' && decl[k] !== 'transparent');
  return !hasVisual; // 没有任何视觉属性 = 装饰层，应折叠跳过
}

function parseDNA(html, url = '') {
  const $ = cheerio.load(html, { decodeEntities: false });
  const $content = $('#js_content');
  if (!$content.length) throw new Error('未找到 #js_content，可能不是公众号文章或已被删除');

  const colors = {};       // 文本色: 出现次数
  const bgColors = {};      // 背景色
  const accentColors = {};  // 边框/强调色
  const fontSizes = {};
  const lineHeights = {};
  const components = {};      // role -> {count, sampleStyle, confidences}
  const imgSlots = [];

  let hCount = { h1: 0, h2: 0, h3: 0 };
  let paraCount = 0, charTotal = 0;
  let firstRole = null, lastRole = null;

  // 遍历所有元素（含嵌套）
  $content.find('*').addBack().each((i, el) => {
    const $el = $(el);
    const tag = (el.tagName || '').toLowerCase();
    const rawStyle = $el.attr('style') || '';
    const decl = parseInlineStyle(rawStyle);

    // ---- 颜色收集 ----
    const c = normHex(decl['color']);
    if (c) colors[c] = (colors[c] || 0) + 1;
    const bg = normHex(decl['background-color']) || normHex(decl['background']);
    if (bg) bgColors[bg] = (bgColors[bg] || 0) + 1;
    ['border-color', 'border-top-color', 'border-left-color', 'border-bottom-color', 'border-right-color']
      .forEach((k) => {
        const ac = normHex(decl[k]);
        if (ac) accentColors[ac] = (accentColors[ac] || 0) + 1;
      });

    if (decl['font-size']) fontSizes[decl['font-size']] = (fontSizes[decl['font-size']] || 0) + 1;
    if (decl['line-height']) lineHeights[decl['line-height']] = (lineHeights[decl['line-height']] || 0) + 1;

    // ---- 组件识别（装饰层折叠）----
    const visualStyle = !isDecorative(decl, tag);
    let role = null;
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      role = tag; hCount[tag]++;
    } else if (tag === 'blockquote' || (tag === 'section' && visualStyle && decl['border-left'])) {
      role = 'quote';
    } else if ((tag === 'section' || tag === 'p') && visualStyle && (decl['background-color'] || decl['background'])) {
      role = 'card';
    } else if (tag === 'hr' || (tag === 'section' && visualStyle && (decl['border-top'] || decl['border-bottom']) && !decl['background-color'])) {
      role = 'divider';
    } else if (tag === 'p' || tag === 'section') {
      if (visualStyle) role = 'paragraph';
    }
    if (role) {
      components[role] = components[role] || { count: 0, samples: [] };
      components[role].count++;
      if (components[role].samples.length < 2 && rawStyle) components[role].samples.push(rawStyle.slice(0, 160));
      if (!firstRole) firstRole = role;
      lastRole = role;
    }

    if (tag === 'p') {
      const txt = $el.text().trim();
      if (txt) { paraCount++; charTotal += txt.length; }
    }
  });

  // ---- 图片槽位（零下载，只读比例）----
  $content.find('img').each((i, el) => {
    const $el = $(el);
    const ratio = parseFloat($el.attr('data-ratio'));
    const w = parseFloat($el.attr('data-w'));
    const decl = parseInlineStyle($el.attr('style') || '');
    const wpctRaw = decl['width'] || '';
    let widthPct = 100;
    if (wpctRaw.includes('%')) widthPct = parseInt(wpctRaw, 10) || 100;
    let position = 'inline';
    if (/100/.test(wpctRaw) || widthPct >= 90) position = 'fullwidth';
    imgSlots.push({
      index: i,
      position,
      ratio: isNaN(ratio) ? null : +ratio.toFixed(3),
      widthPct,
      dataW: isNaN(w) ? null : w,
      captionHint: position === 'fullwidth' ? '通栏/封面图' : '段落配图',
    });
  });

  // ---- 颜色聚类：挑主色/强调色 ----
  const GRAY = new Set(['#000000', '#ffffff', '#f7f7f7', '#f5f5f5', '#eeeeee', '#333333', '#666666', '#999999', '#cccccc']);
  const topColors = Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topAccent = Object.entries(accentColors).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const mainColor = topColors.find(([c]) => !GRAY.has(c))?.[0] || null;
  const accentColor = topAccent.find(([c]) => !GRAY.has(c) && c !== mainColor)?.[0] || null;

  const topFont = Object.entries(fontSizes).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const overallFont = topFont[0]?.[0] || null;
  const topLH = Object.entries(lineHeights).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const wordCount = charTotal;
  const perImgChars = imgSlots.length ? Math.round(wordCount / imgSlots.length) : 0;
  const imageRatioDesc = imgSlots.length ? `约每 ${perImgChars} 字 1 图（共 ${imgSlots.length} 图）` : '无图';

  const styleDNA = {
    source: { url, title: $('meta[property="og:title"]').attr('content') || '', fetchedAt: new Date().toISOString() },
    themeColors: {
      main: mainColor,
      accent: accentColor,
      text: topColors[0]?.[0] || '#333333',
      background: Object.entries(bgColors).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      palette: topColors.map(([c, n]) => ({ hex: c, weight: n })),
    },
    typography: {
      bodyFontSize: overallFont,
      bodyLineHeight: topLH,
      headingCounts: hCount,
    },
    components: Object.fromEntries(
      Object.entries(components).map(([k, v]) => [k, { count: v.count, sampleStyle: v.samples[0] || '' }])
    ),
    imgSlots,
    skeleton: {
      headingRhythm: `H1:${hCount.h1} H2:${hCount.h2} H3:${hCount.h3}，正文段落 ${paraCount}`,
      paraAvgChars: paraCount ? Math.round(charTotal / paraCount) : 0,
      imageCount: imgSlots.length,
      imageRatio: imageRatioDesc,
      opening: firstRole,
      ending: lastRole,
    },
    _note: '复刻仅记录图片位置+长宽比，原图内容不保存不下载',
  };
  return styleDNA;
}

// ---- CLI ----
if (require.main === module) {
  const path = process.argv[2];
  const url = process.argv[3] || '';
  if (!path) { console.error('用法: node dna-parser.js <html文件> [url]'); process.exit(1); }
  const html = fs.readFileSync(path, 'utf8');
  const dna = parseDNA(html, url);
  const out = JSON.stringify(dna, null, 2);
  fs.writeFileSync(path.replace(/\.html$/, '.dna.json'), out);
  console.log(out);
}

module.exports = { parseDNA };

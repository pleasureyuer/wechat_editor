# 微信公众号排版工具 —— 代码优化方案

> 基于审查报告 [stellar-cascade-curie.md](C:\Users\Administrator\.workbuddy\plans\stellar-cascade-curie.md)
> 优化日期：2026-06-17

---

## 一、总体评估

| 优先级 | 项数 | 涉及文件 | 影响 | 工作量 | 风险 |
|--------|------|---------|------|--------|------|
| **P0** | 3项 | editor.js, App.vue | 6组件布局 + 多处CSS属性 | 中等 | 低 |
| **P1** | 2项 | editor.js, Editor.vue | 虚线分割线 + 图片提示 | 小 | 低 |
| **P2** | 3项 | editor.js, Editor.vue | 代码块/表格/排版 | 小 | 低 |

---

## 二、P0：必须修复

### P0-1：flex → table 布局（6个组件）

**根因**：微信编辑器完全过滤 `display:flex`、`align-items`、`gap`、`flex-shrink`、`flex:1` 等属性。

**统一方案**：用 `<table cellspacing="0" cellpadding="0">` + `<tr><td>` + `vertical-align:middle` 实现水平排列。

**修改文件**：`F:\wechat_editor\frontend\src\stores\editor.js`

---

#### ① numberTitle（行 211-214）—— 2列水平

**❌ 修改前**：
```js
out.push(`<section style="display:flex;align-items:center;gap:10px;margin:18px 0 10px;">` +
  `<span style="background:${T};color:${TC};width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;flex-shrink:0;display:inline-block;">${numTxt}</span>` +
  `<span style="font-size:17px;font-weight:700;color:#222;">${textHtml}</span>` +
`</section>`);
```

**✅ 修改后**：
```js
out.push(`<table cellspacing="0" cellpadding="0" style="margin:18px 0 10px;"><tr>` +
  `<td style="vertical-align:middle;width:38px;"><span style="background-color:${T};color:${TC};display:inline-block;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;">${numTxt}</span></td>` +
  `<td style="vertical-align:middle;padding-left:10px;"><span style="font-size:17px;font-weight:700;color:#222;">${textHtml}</span></td>` +
`</tr></table>`);
```

---

#### ② pillTitle（行 238-241）—— 2列水平（胶囊数字 + 标题文字）

**❌ 修改前**：
```js
out.push(`<section style="display:flex;align-items:center;gap:8px;margin:18px 0 10px;">` +
  `<span style="background:${T};color:${TC};min-width:22px;height:22px;padding:0 7px;border-radius:11px;text-align:center;line-height:22px;font-size:12px;font-weight:700;flex-shrink:0;display:inline-block;">${pillTxt}</span>` +
  `<span style="font-size:16px;font-weight:600;color:#222;">${textHtml}</span>` +
`</section>`);
```

**✅ 修改后**：
```js
out.push(`<table cellspacing="0" cellpadding="0" style="margin:18px 0 10px;"><tr>` +
  `<td style="vertical-align:middle;"><span style="background-color:${T};color:${TC};display:inline-block;min-width:22px;height:22px;padding:0 7px;border-radius:11px;text-align:center;line-height:22px;font-size:12px;font-weight:700;">${pillTxt}</span></td>` +
  `<td style="vertical-align:middle;padding-left:8px;"><span style="font-size:16px;font-weight:600;color:#222;">${textHtml}</span></td>` +
`</tr></table>`);
```

---

#### ③ circleIconTitle（行 295-298）—— 2列水平（图标圆圈 + 标题）

**❌ 修改前**：
```js
out.push(`<section style="display:flex;align-items:center;gap:10px;margin:16px 0 10px;">` +
  `<span style="background:${T};color:${TC};width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;font-size:13px;flex-shrink:0;display:inline-block;">${iconTxt}</span>` +
  `<span style="font-size:17px;font-weight:700;color:#333;">${titleText}</span>` +
`</section>`);
```

**✅ 修改后**：
```js
out.push(`<table cellspacing="0" cellpadding="0" style="margin:16px 0 10px;"><tr>` +
  `<td style="vertical-align:middle;width:36px;"><span style="background-color:${T};color:${TC};display:inline-block;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;font-size:13px;">${iconTxt}</span></td>` +
  `<td style="vertical-align:middle;padding-left:10px;"><span style="font-size:17px;font-weight:700;color:#333;">${titleText}</span></td>` +
`</tr></table>`);
```

---

#### ④ dotLine（行 306-311）—— 3列水平（圆点 + 自适应横线 + 文字）

**❌ 修改前**：
```js
out.push(`<section style="display:flex;align-items:center;gap:8px;margin:16px 0;">` +
  `<span style="width:8px;height:8px;border-radius:50%;background:${T};flex-shrink:0;display:inline-block;"></span>` +
  `<span style="flex:1;height:1px;background:#ddd;display:inline-block;"></span>` +
  `<span style="font-size:15px;color:#444;">${textHtml}</span>` +
`</section>`);
```

**✅ 修改后**：
```js
out.push(`<table cellspacing="0" cellpadding="0" style="margin:16px 0;width:100%;"><tr>` +
  `<td style="vertical-align:middle;width:16px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${T};"></span></td>` +
  `<td style="vertical-align:middle;"><span style="display:inline-block;width:100%;height:1px;background-color:#ddd;"></span></td>` +
  `<td style="vertical-align:middle;width:8px;"></td>` +
  `<td style="vertical-align:middle;white-space:nowrap;"><span style="font-size:15px;color:#444;">${textHtml}</span></td>` +
`</tr></table>`);
```

---

#### ⑤ stepTitle（行 339-343）—— 2列水平（步骤号 + 标题）

**❌ 修改前**：
```js
out.push(`<section style="display:flex;align-items:center;gap:10px;margin:16px 0 10px;">` +
  `<span style="color:${T};font-size:18px;font-weight:800;">${stepTxt}</span>` +
  `<span style="font-weight:700;font-size:16px;color:#222;">${stepTextHtml}</span>` +
`</section>`);
```

**✅ 修改后**：
```js
out.push(`<table cellspacing="0" cellpadding="0" style="margin:16px 0 10px;"><tr>` +
  `<td style="vertical-align:middle;padding-right:10px;"><span style="color:${T};font-size:18px;font-weight:800;">${stepTxt}</span></td>` +
  `<td style="vertical-align:middle;"><span style="font-weight:700;font-size:16px;color:#222;">${stepTextHtml}</span></td>` +
`</tr></table>`);
```

---

#### ⑥ highlightBlock（行 353-357，修改后行号可能偏移）—— 2列水平（◆ + 文字）

**❌ 修改前**：
```js
out.push(`<section style="display:flex;align-items:flex-start;gap:8px;padding:12px 16px;margin:14px 0;background:${TL};border-radius:8px;font-size:14px;color:#444;line-height:1.8;">` +
  `<span style="font-size:16px;flex-shrink:0;">◆</span>` +
  `<span>${txt}</span>` +
`</section>`);
```

**✅ 修改后**：
```js
out.push(`<table cellspacing="0" cellpadding="0" style="margin:14px 0;width:100%;background-color:${TL};border-radius:8px;"><tr>` +
  `<td style="vertical-align:top;width:24px;padding:12px 0 12px 16px;"><span style="font-size:16px;">◆</span></td>` +
  `<td style="vertical-align:top;padding:12px 16px 12px 8px;font-size:14px;color:#444;line-height:1.8;">${txt}</td>` +
`</tr></table>`);
```

---

### P0-2：`background` 简写 → `background-color`

**根因**：微信对 `background` 简写过滤严格，`background-color` 是安全的。

**修改文件**：

| 文件 | 行号 | 修改前 | 修改后 |
|------|------|--------|--------|
| editor.js | 189 | `background:#f7f7f7;` | `background-color:#f7f7f7;` |
| editor.js | 251 | `background:#f0f0f0;` | `background-color:#f0f0f0;` |
| editor.js | 324 | `background:${TL};` | `background-color:${TL};` |
| editor.js | 361 | `background:#f7f7f7;` | `background-color:#f7f7f7;` |
| editor.js | 366 | `background:${TL};` | `background-color:${TL};` |
| App.vue | 199 | `background:${app.outerBgColor}` | `background-color:${app.outerBgColor}` |
| App.vue | 199 | `background:${app.contentBgColor}` | `background-color:${app.contentBgColor}` |
| editor.js | 421 | `background:${app.outerBgColor}` | `background-color:${app.outerBgColor}` |
| editor.js | 422 | `background:${app.contentBgColor}` | `background-color:${app.contentBgColor}` |
| editor.js | 415 | `background:${app.outerBgColor}` | `background-color:${app.outerBgColor}` |

> **注意**：P0-1 修改中已同步将各组件内的 `background:` 改为 `background-color:`，上面仅列出非 flex 组件的修改点。

---

### P0-3：`rgba()` → 纯色十六进制

**根因**：微信对 `rgba()` 颜色支持有限。

**修改文件**：`F:\wechat_editor\frontend\src\stores\editor.js`

**位置**：infoBox case（行 366）

**❌ 修改前**：
```js
case 'infoBox': {
  out.push(`<section style="background:${TL};border-top:1px solid rgba(0,102,255,0.1);border-right:1px solid rgba(0,102,255,0.1);border-bottom:1px solid rgba(0,102,255,0.1);border-left:1px solid rgba(0,102,255,0.1);border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;">${txt}</section>`);
  break;
}
```

**✅ 修改后**：
```js
case 'infoBox': {
  out.push(`<section style="background-color:${TL};border-top:1px solid ${TL};border-right:1px solid ${TL};border-bottom:1px solid ${TL};border-left:1px solid ${TL};border-radius:8px;padding:14px 18px;margin:14px 0;font-size:14px;color:#555;">${txt}</section>`);
  break;
}
```

> 各主题的 `light` 值本身就是浅色（蓝色 `#e6f0ff`、橙色 `#fff0e8` 等），替代 `rgba(0,102,255,0.1)` 视觉效果几乎相同。

---

## 三、P1：建议修复

### P1-1：dividerDashed 渐变 → 虚线边框

**根因**：`repeating-linear-gradient` 在微信中完全被过滤。

**修改文件**：`F:\wechat_editor\frontend\src\stores\editor.js`

**位置**：dividerDashed case（行 381）

**❌ 修改前**：
```js
case 'dividerDashed': {
  out.push(`<p><span style="display:inline-block;width:100%;height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 6px,transparent 6px,transparent 10px);vertical-align:middle;font-size:1px;line-height:1px;">&nbsp;</span></p>`);
  break;
}
```

**✅ 修改后**：
```js
case 'dividerDashed': {
  out.push(`<p><span style="display:inline-block;width:100%;border-top:1px dashed ${TL};height:1px;font-size:1px;line-height:1px;">&nbsp;</span></p>`);
  break;
}
```

> 虚线边框 `border-top: 1px dashed` 是微信中可靠的虚线实现方式。

---

### P1-2：图片插入增加微信 CDN 提示

**修改文件**：`F:\wechat_editor\frontend\src\components\Editor.vue`

**位置**：`insertImg` 函数（行 244-247）

**❌ 修改前**：
```js
function insertImg() {
  const url = prompt('图片地址：', '')
  if (url) run('insertImage', url)
}
```

**✅ 修改后**：
```js
function insertImg() {
  const url = prompt('图片地址：\n\n⚠️ 请使用微信公众平台素材库的图片链接（已上传至公众号的图片），外部链接在公众号后台可能无法显示。', '')
  if (!url) return
  // 检测是否是外部链接
  if (!url.includes('mmbiz.qpic.cn') && !url.includes('mp.weixin.qq.com')) {
    if (!confirm('⚠️ 该图片链接看起来不是微信 CDN 地址，粘贴到公众号后台后可能无法显示。\n\n是否继续插入？')) return
  }
  run('insertImage', url)
}
```

---

## 四、P2：可选增强

### P2-1：代码块微信兼容

**修改文件**：`F:\wechat_editor\frontend\src\stores\editor.js`

**建议**：在 `buildWechatHTML()` 的循环中增加 `<pre><code>` 的处理分支：

```js
// 代码块 → 用 <section> 模拟（微信不支持 <pre>）
if (child.tagName === 'PRE') {
  const codeText = child.textContent || '';
  out.push(`<section style="background-color:#f4f4f4;padding:12px 16px;margin:14px 0;font-family:Consolas,monospace;font-size:13px;color:#333;border-left:3px solid ${T};white-space:pre-wrap;word-break:break-all;">${codeText}</section>`);
  continue;
}
```

### P2-2：表格嵌套处理

**当前状态**：`insertTable`（Editor.vue 行 249-268）生成的是普通 `<table>`。由于编辑器组件已经用 `<div class="editable-block">` 包裹，插入的表格是独立的根级元素，不会嵌套。此风险**当前较低**。

**建议**：如果未来需要表格放在卡片框（cardBox）等高亮组件内，需额外处理。暂时可跳过。

### P2-3：字号间距微调

| 参数 | 当前值 | 建议值 | 理由 |
|------|--------|--------|------|
| 正文行高 | 1.8 | 1.75 | 稍密一些，移动端阅读更紧凑 |
| 段间距 | 14px | 16px | 视觉呼吸感更好 |
| 一级标题字号 | 22px | 21px | 与正文差距稍小，更协调 |

> 这三项微调非必要，如果当前效果满意可忽略。

---

## 五、实施顺序（推荐）

```
第1步：备份当前状态（Git commit / 本地备份）

第2步：P0-1 flex→table（6个组件，editor.js）
     ├── numberTitle
     ├── pillTitle
     ├── circleIconTitle
     ├── dotLine
     ├── stepTitle
     └── highlightBlock

第3步：P0-2 background→background-color（全局替换，editor.js + App.vue）

第4步：P0-3 rgba→hex（1处，editor.js infoBox）

第5步：P1-1 dividerDashed（1处，editor.js）

第6步：P1-2 图片CDN提示（1处，Editor.vue）

第7步：测试验证
     ├── 复制后粘贴到微信公众号后台
     ├── 手机端预览检查各组件样式
     └── 与编辑区预览对比
```

---

## 六、潜在副作用

1. **table 布局的外间距**：`<table>` 的 margin 在微信中表现可能与 `<section>` 略有差异，需要实测调整
2. **dotLine 横线宽度**：改用 table 后横线依赖 `width:100%` 撑满，需确认 table 总宽度与内容区匹配
3. **highlightBlock 圆角**：`border-radius` 在 `<table>` 上的支持可能不如 `<section>`，需要实测
4. **cardTitle**：当前在 `<span>` 上设 `border-radius`，实测微信部分支持，当前效果可接受

---

*优化方案文档版本：v1.0 | 2026-06-17*

// ═══════════════════════════════════════════════════════════
//  组件目录（唯一数据源 / Single Source of Truth）
//  左侧栏面板、PC 浮动工具条、移动端抽屉、主题样式预设下拉
//  全部从此处派生，保证「左侧栏显示的 / 主题内可选择的 / 弹窗唤起的 /
//  PC 端与移动端」四者组件集合完全一致。
// ═══════════════════════════════════════════════════════════

// ── 标题组件（26 个）──
export const TITLE_COMPONENTS = [
  { type: 'numberTitle',     name: '编号标题',       icon: '①',  preview: '<b style="color:var(--theme-color,#0066ff)">01</b> 编号标题' },
  { type: 'gradientTitle',   name: '渐变标题',       icon: '🌈', preview: '<span style="background:linear-gradient(90deg,var(--theme-color,#0066ff),#a78bfa);-webkit-background-clip:text;-webkit-text-fill:transparent;font-weight:bold">渐变标题</span>' },
  { type: 'tagTitle',        name: '标签标题',       icon: '🏷️', preview: '<span style="border-left:4px solid var(--theme-color,#0066ff);padding-left:10px;font-weight:bold">标签标题</span>' },
  { type: 'leftLineTitle',   name: '左竖线标题',     icon: '▎', preview: '<span style="display:inline-block;border-left:4px solid var(--theme-color,#0066ff);padding-left:10px;font-weight:bold;line-height:1.4">左竖线标题</span>' },
  { type: 'rightLineTitle',  name: '右竖线标题',     icon: '▐', preview: '<span style="display:inline-block;text-align:right;border-right:4px solid var(--theme-color,#0066ff);padding-right:10px;font-weight:bold;line-height:1.4">右竖线标题</span>' },
  { type: 'centerLineTitle', name: '居中标题',       icon: '⬥', preview: '<span style="display:block;text-align:center;font-weight:bold;border-bottom:2px solid var(--theme-color,#0066ff);padding-bottom:6px">居中标题</span>' },
  { type: 'circleIconTitle', name: '圆形图标标题',   icon: '💡', preview: '<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--theme-color,#0066ff);color:#fff;font-size:12px;font-weight:bold;margin-right:8px">💡</span>圆形图标标题' },
  { type: 'dotLine',         name: '圆点横线',       icon: '●',  preview: '<span>●————————————— 圆点横线</span>' },
  { type: 'underlineTitle',  name: '下划线标题',     icon: 'Ｕ', preview: '<span style="font-weight:bold;border-bottom:2px solid var(--theme-color,#0066ff);padding-bottom:2px">下划线标题</span>' },
  { type: 'arrowTitle',      name: '箭头标题',       icon: '→',  preview: '<span style="color:var(--theme-color,#0066ff);font-weight:bold">→</span> 箭头标题' },
  { type: 'doubleLineTitle', name: '双竖线标题',     icon: '‖',  preview: '<span style="display:inline-block;border-left:3px solid var(--theme-color,#0066ff);border-right:3px solid var(--theme-color,#0066ff);padding:2px 8px;font-weight:bold">双竖线</span>' },
  { type: 'diamondTitle',    name: '菱形标题',       icon: '◆',  preview: '<span style="color:var(--theme-color,#0066ff)">◆</span> 菱形标题' },
  { type: 'dotLineTitle',    name: '圆点框线标题',   icon: '•',  preview: '<span style="border:2px solid var(--theme-color,#0066ff);border-radius:4px;padding:3px 10px;display:inline-block;font-size:12px;position:relative"><span style="position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:5px;height:5px;background:var(--theme-color);border-radius:50%"></span> 输入标题</span>' },
  { type: 'solidBarTitle',   name: '主题色底条标题', icon: '▬',  preview: '<span style="background:var(--theme-color,#0066ff);color:#fff;padding:2px 10px;border-radius:3px;font-size:11px;font-weight:bold">输入标题</span>' },
  { type: 'diamondLineTitle',name: '菱形延伸线标题', icon: '◇',  preview: '<span style="color:var(--theme-color)">◇</span><span style="font-weight:bold"> 输入标题 </span><span style="color:var(--theme-color)">◇</span>' },
  { type: 'circleStepBadge', name: '圆形步骤徽章',   icon: '⭕', preview: '<span style="display:inline-block;width:22px;height:22px;line-height:20px;background:#ff8c42;color:#fff;font-size:12px;font-weight:800;border-radius:50%;text-align:center;vertical-align:middle">1</span>' },
  // ── 易命术系列专用 ──
  { type: 'titleShuName',    name: '术名段·朱砂',     icon: '❖', preview: '<span style="display:block;text-align:center;font-size:16px;font-weight:700;color:var(--theme-color,#B0392E)">易命X术 · 术名</span>' },
  { type: 'titleVolBlock',   name: '小标题·卷色块',   icon: '▍', preview: '<span style="display:inline-flex;align-items:center"><span style="display:inline-block;width:4px;height:16px;background:var(--volume-color,#C8A15A);margin-right:8px"></span><span style="font-size:16px;font-weight:700;color:#1A1A1A">板块小标题</span></span>' },
  { type: 'seriesLabel',     name: '系列署名·卷色',   icon: '✶', preview: '<span style="display:block;text-align:center;font-size:12px;letter-spacing:3px;color:var(--volume-color,#C8A15A)">易命术手记 · 卷一</span>' },
  { type: 'seriesOpening',   name: '开头署名·三段式', icon: '✷', preview: '<span style="display:block;text-align:center;font-size:12px;letter-spacing:3px;color:var(--volume-color,#C8A15A)">易命术 · 卷一 · 安身</span>' },
  // ── 墨韵风格 ──
  { type: 'inkAxisTitle',    name: '居中下双横',     icon: '🖋', preview: '<span style="display:block;text-align:center"><span style="display:inline-block;font-weight:bold;border-bottom:2px solid var(--theme-color,#8B4513);padding:0 10px 8px;letter-spacing:2px;font-family:\'Songti SC\',serif">居中下双横</span><span style="display:block;width:20px;height:2px;background:var(--theme-color,#8B4513);margin:5px auto 0"></span></span>' },
  // ── 新增强化标题 ──
  { type: 'windowLatticeTitle', name: '居中窗棂',   icon: '🪟', preview: '<span style="border:1px solid var(--theme-color,#8B4513);padding:2px 8px;font-family:\'Songti SC\',serif">窗棂</span>' },
  { type: 'centeredCapsuleTitle', name: '居中胶囊', icon: '💊', preview: '<span style="background:var(--theme-light,#e6f0ff);border-radius:50px;padding:2px 12px;font-weight:bold;color:var(--theme-color,#0066ff)">胶囊</span>' },
  { type: 'dashedCenterTitle', name: '虚框居中',     icon: '🗒', preview: '<span style="border:1px dashed var(--theme-color,#0066ff);padding:3px 10px;color:var(--theme-color,#0066ff)">虚框</span>' },
  { type: 'solidCenterFrameTitle', name: '实线居中框', icon: '🔳', preview: '<span style="border-top:2px solid var(--theme-color,#0066ff);border-bottom:2px solid var(--theme-color,#0066ff);padding:2px 10px;font-weight:bold;color:var(--theme-color,#0066ff)">实线框</span>' },
];

// ── 卡片组件（20 个）──
export const CARD_COMPONENTS = [
  { type: 'cardBox',        name: '底色框线',     icon: '📦', desc: '通用卡片容器', preview: '<div style="background:var(--theme-light,#e6f0ff);border-radius:6px;padding:8px 10px;border-left:3px solid var(--theme-color,#0066ff);font-size:11px;color:#555">底色框线卡片内容</div>' },
  { type: 'highlightBlock', name: '底色无框线',   icon: '🎨', desc: '背景色块高亮', styleKind: 'quote', preview: '<div style="background:var(--theme-light,#e6f0ff);border-radius:6px;padding:8px 10px;font-size:11px;color:#555">底色无框线高亮块</div>' },
  { type: 'quoteBlock',     name: '引用灰色',     icon: '💬', desc: '左竖线引用',   styleKind: 'quote', preview: '<div style="border-left:3px solid #ccc;background:#f7f7f7;padding:6px 10px;font-size:11px;color:#666">引用灰色文字</div>' },
  { type: 'leadParagraph',  name: '引用主题色',   icon: '📝', desc: '文章导语', preview: '<div style="border-left:3px solid var(--theme-color,#0066ff);background:var(--theme-light,#e6f0ff);padding:6px 10px;font-size:11px;color:#555">引用主题色导语</div>' },
  { type: 'goldenQuote',    name: '金句卡片',     icon: '✨', desc: '金句强调', preview: '<div style="text-align:center;padding:8px;font-size:11px"><span style="font-size:14px;color:var(--theme-color,#0066ff)">✦</span><br><span style="color:#444;font-style:italic">金句文字</span></div>' },
  { type: 'cardVolume',     name: '引用圆弧',     icon: '🗂', desc: '易命术卷色卡', preview: '<div style="border:1px solid var(--volume-color,#C8A15A);border-radius:0 12px 12px 0;padding:6px 10px;font-size:11px;color:#555;border-left:3px solid var(--volume-color,#C8A15A)">引用圆弧</div>' },
  { type: 'seriesOpening',  name: '主题色小字居中', icon: '✷', desc: '易命术开头署名', preview: '<div style="text-align:center;font-size:10px;letter-spacing:2px;color:var(--theme-color,#0066ff);padding:4px">✷ 主题色小字居中</div>' },
  { type: 'topicSectionCard', name: '主题章节卡', icon: '📑', desc: '章节内容卡片', preview: '<div style="background:var(--theme-light,#e6f0ff);border-radius:8px;padding:8px 10px;font-size:11px"><b style="color:var(--theme-color,#0066ff)">章节标题</b><br><span style="color:#666">章节内容…</span></div>' },
  { type: 'doubleLayerFrame', name: '双层框', icon: '🖼', desc: '国风双层框卡片', preview: '<div style="background:var(--theme-light,#e6f0ff);border:1px solid var(--theme-color,#0066ff);border-radius:6px;padding:4px"><div style="background:#fff;border:2px solid var(--theme-color,#0066ff);border-radius:4px;padding:6px 8px;font-size:11px;color:#555">双层框内容</div></div>' },
  { type: 'noteSmall', name: '小字注释', icon: '📝', desc: '轻量注释小字框', preview: '<div style="background:#fafafa;border-radius:4px;padding:6px 8px;font-size:10px;color:#999;border:1px solid #eee">📝 小字注释说明文字</div>' },
  { type: 'noteNoBg', name: '注释无背景', icon: '🔖', desc: '无背景注释小字（顶部细线）', preview: '<div style="padding-top:6px"><div style="height:1px;background:var(--theme-border,#E6E2D3);margin-bottom:5px"></div><div style="font-size:10px;color:var(--theme-text-muted,#887F6A);line-height:1.5">🔖 注释说明文字（无背景）</div></div>' },
  { type: 'luxuryThinFrame', name: '轻奢细框', icon: '🪙', desc: '轻奢细金边框卡片', preview: '<div style="border:2px solid transparent;border-image:linear-gradient(135deg,var(--theme-color,#0066ff),var(--theme-light,#e6f0ff)) 1;border-radius:8px;padding:8px 10px;font-size:11px;color:#555">轻奢细框内容</div>' },
  { type: 'topBottomDoubleLine', name: '上下双线', icon: '⇕', desc: '上下双线金句框', preview: '<div style="border-top:2px solid var(--theme-color,#0066ff);border-bottom:2px solid var(--theme-color,#0066ff);padding:6px 10px;text-align:center;font-size:11px;color:#444">上下双线金句</div>' },
  { type: 'dividerQuote', name: '分割线金句', icon: '💬', desc: '分割线金句款', preview: '<div style="text-align:center;font-size:11px;color:#888">———————<br><span style="color:var(--theme-color,#0066ff)">分割线金句</span><br>———————</div>' },
  { type: 'doubleLayerFrameRound', name: '双层框圆角', icon: '🖼', desc: '国风双层框圆角版', preview: '<div style="background:var(--theme-light,#e6f0ff);border:1px solid var(--theme-color,#0066ff);border-radius:12px;padding:4px"><div style="background:#fff;border:2px solid var(--theme-color,#0066ff);border-radius:10px;padding:6px 8px;font-size:11px;color:#555">双层框圆角</div></div>' },
  { type: 'waistSealRounded', name: '腰封圆角', icon: '🎴', desc: '腰封标题双层圆角框', preview: '<div style="background:var(--theme-faint,#f8fbff);border-radius:12px;overflow:hidden;font-size:11px"><div style="background:var(--theme-color,#0066ff);color:#fff;text-align:center;padding:3px;font-size:10px">腰封标题</div><div style="padding:6px 8px;color:#555">圆角框内容</div></div>' },
  { type: 'bambooJoint', name: '竹节分割', icon: '🎋', desc: '竹节竖条分割清雅框', preview: '<div style="background:var(--theme-faint,#f8fbff);border-radius:8px;padding:8px;font-size:11px;display:flex;align-items:center;gap:6px"><span style="width:3px;height:24px;background:var(--theme-color,#0066ff);border-radius:2px;display:inline-block"></span><span style="color:var(--theme-color,#0066ff);font-weight:bold;font-size:10px">竹节</span><span style="flex:1;height:1px;background:var(--theme-color,#0066ff);opacity:.3"></span><span style="color:#555">清雅框内容</span></div>' },
  { type: 'bodyText',    name: '正文',     icon: '📜', desc: '宣纸质感长正文（主题浅底）', preview: '<div style="background:var(--theme-faint,#f8fbff);border-radius:4px;padding:8px 10px;font-size:11px;color:#3a3630;line-height:1.6;text-indent:1em">宣纸质感正文段落示例文字…</div>' },
  { type: 'qaBox',       name: '互动提问框', icon: '💬', desc: '结尾互动·双层圆角提问框', preview: '<div style="background:var(--theme-faint,#f8fbff);border-radius:10px;padding:6px;font-size:10px"><div style="background:#fff;border-radius:6px;padding:6px;text-align:center"><div style="color:var(--theme-color,#0066ff);font-size:9px;letter-spacing:1px">· 互动话题 ·</div><div style="color:#666;margin-top:2px">提问内容？</div></div></div>' },
  { type: 'nextPreview', name: '下期预告',   icon: '📜', desc: '结尾互动·书卷式下期预告（标题/内容/引导关注）', preview: '<div style="background:var(--theme-faint,#f8fbff);border-radius:8px;padding:6px;font-size:10px;display:flex;gap:4px"><span style="writing-mode:vertical-rl;color:var(--theme-color,#0066ff);font-size:9px;letter-spacing:2px;padding:0 2px">下期预告</span><div style="color:#555;flex:1"><b style="color:var(--theme-color,#0066ff)">预告标题</b><br>简介内容文字…<div style="color:var(--theme-color,#0066ff);border-top:1px solid var(--theme-light,#e6f0ff);margin-top:4px;padding-top:4px;font-size:9px">关注我，一起读懂…</div></div></div>' },
  { type: 'zenQuote',    name: '留白金句',   icon: '🌿', desc: '结尾互动·禅意留白金句', preview: '<div style="text-align:center;padding:6px;font-size:11px"><div style="color:var(--theme-color,#0066ff);letter-spacing:1px">禅意金句文字</div><div style="width:20px;height:1px;background:#d0c8b4;margin:4px auto"></div><div style="font-size:9px;color:#999">晚安，明天见</div></div>' },
];

// ── 列表组件（3 个）──
export const LIST_COMPONENTS = [
  { type: 'iconList',     name: '图标列表',   icon: '✦', desc: '带前缀图标的要点列表', preview: '<div style="font-size:11px;color:#555"><div style="padding:2px 0"><span style="color:var(--theme-color,#0066ff);margin-right:6px">✦</span>列表要点一</div><div style="padding:2px 0"><span style="color:var(--theme-color,#0066ff);margin-right:6px">✦</span>列表要点二</div></div>' },
  { type: 'numList',      name: '大字编号列表', icon: '①', desc: '大号数字+要点描述', preview: '<div style="font-size:11px;color:#555;display:flex;align-items:center;gap:6px;padding:3px 0"><span style="font-size:16px;font-weight:800;color:var(--theme-color,#0066ff)">1</span><span>编号内容描述</span></div><div style="font-size:11px;color:#555;display:flex;align-items:center;gap:6px;padding:3px 0"><span style="font-size:16px;font-weight:800;color:var(--theme-color,#0066ff)">2</span><span>编号内容描述</span></div>' },
  { type: 'colorCardList',name: '色卡列表',   icon: '🎨', desc: '左侧彩色竖条标注', preview: '<div style="font-size:11px;color:#555"><div style="border-left:3px solid var(--theme-color,#0066ff);background:var(--theme-light,#e6f0ff);padding:3px 8px;margin:2px 0;border-radius:0 4px 4px 0">色卡列表项</div><div style="border-left:3px solid var(--theme-color,#0066ff);background:var(--theme-light,#e6f0ff);padding:3px 8px;margin:2px 0;border-radius:0 4px 4px 0">色卡列表项</div></div>' },
];

// ── 表格组件（4 个）──
export const TABLE_COMPONENTS = [
  { type: 'simpleTable', name: '简约表格', icon: '📊', desc: '深色表头，清晰简洁' },
  { type: 'striTable',   name: '斑马纹表格', icon: '🦓', desc: '隔行换色，阅读轻松' },
  { type: 'borderTable', name: '全边框表格', icon: '⊞', desc: '格线清晰，方案对比' },
  { type: 'statCard',    name: '数据统计卡', icon: '📈', desc: '大数字展示核心指标' },
];

// ── 分割线组件（10 个）──
export const DIVIDER_COMPONENTS = [
  { type: 'dividerSolid',  name: '实线分割线',   icon: '―', preview: '<div style="height:1px;background:var(--theme-color,#0066ff);margin:10px 0"></div>' },
  { type: 'dividerDashed', name: '虚线分割线',   icon: '┄', preview: '<div style="height:0;border-top:1px dashed var(--theme-color,#0066ff);margin:10px 0"></div>' },
  { type: 'dividerDot',    name: '点状分割线',   icon: '⋯', preview: '<div style="text-align:center;color:var(--theme-color,#0066ff);font-size:10px;letter-spacing:4px;margin:8px 0">• • • • •</div>' },
  { type: 'dividerOrnate', name: '花体分割线',   icon: '✽', preview: '<div style="text-align:center;color:var(--theme-color,#0066ff);font-size:13px;margin:8px 0">✽ ✽ ✽</div>' },
  { type: 'dividerThick',  name: '粗分割线',     icon: '━', preview: '<div style="height:3px;background:var(--theme-color,#0066ff);margin:10px 0"></div>' },
  { type: 'spacer',        name: '留白间距',     icon: '⤵', preview: '<div style="height:20px;border:1px dashed #ddd;margin:6px 0;font-size:9px;color:#bbb;display:flex;align-items:center;justify-content:center">留白间距</div>' },
  { type: 'dividerDots',   name: '点隔·弱装饰',  icon: '· · ·', preview: '<div style="text-align:center;color:#ccc;font-size:12px;letter-spacing:4px;margin:8px 0">· · ·</div>' },
  { type: 'dividerTextCenter', name: '居中文字分割线', icon: '⊟', desc: '左右细线 + 居中文字', preview: '<table style="width:100%;border-collapse:collapse"><tr><td style="width:50%;vertical-align:middle"><div style="height:1px;background:var(--theme-color,#0066ff)"></div></td><td style="white-space:nowrap;padding:0 10px;font-size:11px;letter-spacing:2px;color:var(--theme-color,#0066ff);vertical-align:middle">居中文字</td><td style="width:50%;vertical-align:middle"><div style="height:1px;background:var(--theme-color,#0066ff)"></div></td></tr></table>' },
  { type: 'dividerDotsText',   name: '圆点文字分割线', icon: '⊙', desc: '左右细线 + 两端圆点文字', preview: '<table style="width:100%;border-collapse:collapse"><tr><td style="width:50%;vertical-align:middle"><div style="height:1px;background:var(--theme-color,#0066ff)"></div></td><td style="white-space:nowrap;padding:0 8px;vertical-align:middle"><span style="display:inline-block;width:4px;height:4px;background:var(--theme-color,#0066ff);border-radius:50%;vertical-align:middle;margin-right:6px"></span><span style="font-size:11px;letter-spacing:2px;color:var(--theme-color,#0066ff);vertical-align:middle">圆点文字</span><span style="display:inline-block;width:4px;height:4px;background:var(--theme-color,#0066ff);border-radius:50%;vertical-align:middle;margin-left:6px"></span></td><td style="width:50%;vertical-align:middle"><div style="height:1px;background:var(--theme-color,#0066ff)"></div></td></tr></table>' },
  { type: 'dividerGradient',    name: '渐变柔线',     icon: '▽', desc: '左右透明渐变细线', preview: '<div style="width:100%;height:1px;background:linear-gradient(to right,transparent,var(--theme-color,#0066ff),transparent);margin:10px 0"></div>' },
];

// ── 派生：主题样式预设下拉选项 ──
// 标题：全部标题组件均可作为 h1~h4 的样式映射目标
export const TITLE_STYLE_OPTIONS = TITLE_COMPONENTS.map(c => ({ id: c.type, name: c.name, icon: c.icon }));

// 引用：仅「引用型」卡片
export const QUOTE_STYLE_OPTIONS = CARD_COMPONENTS
  .filter(c => c.styleKind === 'quote')
  .map(c => ({ id: c.type, name: c.name, icon: c.icon }));

// 卡片：通用卡片容器（排除引用型与系列专属，保持语义清晰）
export const CARD_STYLE_OPTIONS = CARD_COMPONENTS
  .filter(c => !c.styleKind && c.type !== 'seriesOpening' && c.type !== 'topicSectionCard'
    && c.type !== 'qaBox' && c.type !== 'nextPreview' && c.type !== 'zenQuote' && c.type !== 'noteNoBg')
  .map(c => ({ id: c.type, name: c.name, icon: c.icon }));

// 互动组件：从卡片中派生（结尾互动区），归入左侧「互动」分组
export const INTERACTIVE_COMPONENTS = CARD_COMPONENTS
  .filter(c => c.type === 'qaBox' || c.type === 'nextPreview' || c.type === 'zenQuote')
  .map(c => ({ ...c }));

// 分割线：全部分割线组件
export const DIVIDER_STYLE_OPTIONS = DIVIDER_COMPONENTS.map(c => ({ id: c.type, name: c.name, icon: c.icon }));

// ── 派生：关键字→组件映射 的组件下拉全集（带分组，供对话框 optgroup 使用）──
export const ALL_COMPONENT_OPTIONS = [
  ...TITLE_COMPONENTS.map(c => ({ type: c.type, name: c.name, group: '标题' })),
  ...CARD_COMPONENTS.map(c => ({ type: c.type, name: c.name, group: '卡片/引用' })),
  ...LIST_COMPONENTS.map(c => ({ type: c.type, name: c.name, group: '列表' })),
  ...DIVIDER_COMPONENTS.map(c => ({ type: c.type, name: c.name, group: '分割线' })),
  ...TABLE_COMPONENTS.map(c => ({ type: c.type, name: c.name, group: '表格' })),
];

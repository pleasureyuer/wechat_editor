# V3.5 - 组件样式主题解耦

**日期**: 2026-06-17
**作者**: AI助手

## 核心改动

### 1. 主题色 × 样式预设 完全解耦
- **主题色**（右侧面板）：只管颜色（主色 + 浅底色），7套预设 + 自定义
- **样式预设**（左侧「我的主题」面板）：只管组件映射，5套预设 + 自定义
- 两者任意组合，互不干扰

### 2. 样式预设数据模型（editor.js）
- 新增 `STYLE_PRESETS`（5套预设）
- 新增 `currentStylePreset` / `customStylePresets` / 全套 CRUD
- 扩展 `appearance`：h4Style, listStyle, codeStyle, emphasisStyle
- 新增选项常量：`LIST_STYLE_OPTIONS` / `CODE_STYLE_OPTIONS` / `EMPHASIS_STYLE_OPTIONS`
- `setTheme()` 不再同步 styleMap；新增 `setStylePreset()` 同步 appearance
- localStorage 持久化：`wechat_active_style_preset` / `wechat_custom_style_presets`

### 3. 预设样式组合
| 预设 | H1 | H2 | H3 | 引用 | 卡片 | 分割线 |
|------|----|----|----|------|------|--------|
| 简约商务 | 左竖线 | 下划线 | 软标签 | 左竖线 | 卡片框 | 实线 |
| 文艺清新 | 渐变 | 居中分割线 | 标签边框 | 色块加重 | 提示框 | 虚线 |
| 科技极客 | 编号圆标 | 标签边框 | 胶囊 | 色块加重 | 卡片框 | 实线 |
| 杂志排版 | 右竖线 | 圆点横线 | 步骤序号 | 左竖线 | 卡片框 | 粗线 |
| 活泼可爱 | 圆形图标 | 步骤序号 | 胶囊 | 色块加重 | 提示框 | 点线 |

### 4. RightPanel 简化
- 移除主题弹窗中的「组件样式映射」区域
- 主题只管理颜色（名称 + 主色 + 浅底色）

### 5. LeftSidebar 改造
- 「我的主题」面板改为「主题样式」面板
- 移除主题色选择（归 RightPanel 管）
- 新增样式预设卡片列表（预设 + 自定义）
- 新增样式预设 CRUD（新建/编辑/删除弹窗）
- 扩展组件映射选择器：H1~H4 + 引用 + 卡片 + 分割线 + 列表 + 代码块 + 强调
- 保留正文参数/内容区/外层容器配置

### 6. 标题样式面板
- 去掉 5 个分类 Tab，13 个标题组件直接平铺展示

### 7. 内容输入面板
- 新增「排版风格」快捷下拉选择器
- 选择预设后点「一键排版」立即生效

## 备份文件清单
- `editor.js` — Pinia store（主题 + 样式预设数据模型）
- `App.vue` — 主应用（Markdown 一键排版使用主题样式映射）
- `LeftSidebar.vue` — 左侧面板（主题样式 + 内容输入）
- `RightPanel.vue` — 右侧面板（纯主题色管理）
- `TopBar.vue` — 顶部栏（微信凭据配置）
- `Editor.vue` — 编辑器组件
- `index.js` — 后端（微信 API 代理）

## 技术要点
- 微信兼容：所有组件用 flex 内联样式，不用 table 布局
- Pinia 读取：ref 不需要 .value，computed 需要 .value
- buildWechatHTML() 只在复制时使用，预览区用原始 HTML + CSS
- 样式预设切换时同步 appearance，Markdown 排版自动使用对应组件模板

## 部署信息
- 域名：editor.ai2026.cloud
- 服务器：175.178.188.48（root / Yueyue123）
- 部署状态：已部署，200 OK

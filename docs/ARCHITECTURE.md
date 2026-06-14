# 公众号排版工具 - 项目架构文档

## 技术栈
- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: Node.js + Express + SQLite
- **部署**: 腾讯云服务器 + Nginx

## 目录结构

```
F:\wechat_editor\
├── frontend\               # 前端 Vue 3 项目
│   ├── src\
│   │   ├── components\   # Vue 组件
│   │   ├── stores\       # Pinia 状态管理
│   │   ├── utils\        # 工具函数
│   │   ├── views\        # 页面视图
│   │   ├── App.vue
│   │   └── main.js
│   ├── public\
│   ├── package.json
│   └── vite.config.js
├── backend\                # 后端 Node.js 项目
│   ├── src\
│   │   ├── routes\      # API 路由
│   │   ├── models\      # 数据模型
│   │   ├── middleware\  # 中间件
│   │   ├── utils\       # 工具函数
│   │   └── index.js    # 入口文件
│   ├── database\         # SQLite 数据库文件
│   ├── package.json
│   └── .env
├── deploy\                # 部署脚本
├── docs\                  # 文档
└── README.md
```

## 核心功能模块

### 1. 编辑器核心
- 富文本编辑区（contenteditable）
- Markdown 实时解析
- 组件插入（标题、卡片、分割线等）
- 主题配色切换

### 2. 组件系统
- 编号标题
- 标签标题
- 胶囊标题
- 圆形图标标题
- 圆点横线
- 卡片框
- 色块加重
- 分割线
- 原创声明

### 3. 输出系统
- 生成公众号兼容 HTML
- 一键复制（Ctrl+C 拦截）
- 推送到公众号草稿箱

### 4. 用户系统（后期）
- 微信授权登录
- 广告解锁功能
- 使用记录

## 数据库设计

### users 表
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_id TEXT UNIQUE,
  phone TEXT,
  unlock_expire_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### ad_logs 表
```sql
CREATE TABLE ad_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  ad_type TEXT,
  reward_hours INTEGER,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 开发计划

### Phase 1: 核心编辑器（当前）
- [ ] Vue 3 项目搭建
- [ ] 三栏布局实现
- [ ] 编辑器核心功能
- [ ] 组件系统
- [ ] 主题系统
- [ ] 输出生成

### Phase 2: 后端 API
- [ ] Express 服务器搭建
- [ ] 微信 API 代理
- [ ] 数据库设计

### Phase 3: 用户系统
- [ ] 微信授权登录
- [ ] 广告系统集成
- [ ] 解锁逻辑

### Phase 4: 部署上线
- [ ] 服务器部署
- [ ] 域名绑定
- [ ] HTTPS 配置

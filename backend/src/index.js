const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 微信 API 代理路由（后期实现）
app.post('/api/wechat/draft', async (req, res) => {
  // TODO: 实现微信草稿箱推送
  res.json({ message: 'Not implemented yet' });
});

// 用户系统路由（后期实现）
app.post('/api/user/auth', async (req, res) => {
  // TODO: 实现微信授权登录
  res.json({ message: 'Not implemented yet' });
});

app.post('/api/user/unlock', async (req, res) => {
  // TODO: 实现广告解锁
  res.json({ message: 'Not implemented yet' });
});

// 所有其他请求返回前端 index.html（用于 SPA 路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const path    = require('path');
const app     = express();

app.use(express.json({ limit: '5mb' }));

// ── 微信 API 配置 ──────────────────────────────────────────────
const WECHAT_APP_ID     = process.env.WECHAT_APP_ID     || '';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || '';
const WECHAT_API        = 'https://api.weixin.qq.com/cgi-bin';

// ── access_token 缓存 ─────────────────────────────────────────
let tokenCache = { token: '', expires: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }
  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
    throw new Error('未配置 WECHAT_APP_ID 或 WECHAT_APP_SECRET，请检查 .env 文件');
  }

  const url = `${WECHAT_API}/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode && data.errcode !== 0) {
    const msg = data.errmsg || '';
    if (data.errcode === 40164) {
      const ip = (msg.match(/invalid ip\s+([\d.]+)/i) || [])[1] || '未知';
      throw new Error(`IP 不在白名单。请将服务器 IP (${ip}) 加入公众号后台 → 设置与开发 → 基本配置 → IP 白名单`);
    }
    throw new Error(`获取 access_token 失败：[${data.errcode}] ${msg}`);
  }

  tokenCache = {
    token:   data.access_token,
    expires: Date.now() + (data.expires_in - 600) * 1000, // 提前10分钟刷新
  };
  return tokenCache.token;
}

// ── 上传图片到微信 CDN ────────────────────────────────────────
async function uploadImageToWechat(imageUrl, token) {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer      = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : contentType.includes('gif') ? '.gif' : '.jpg';

    const form = new FormData();
    form.append('media', new Blob([buffer], { type: contentType }), `img${ext}`);

    const upRes  = await fetch(`${WECHAT_API}/media/uploadimg?access_token=${token}`, { method: 'POST', body: form });
    const upData = await upRes.json();
    return upData.url || null;
  } catch { return null; }
}

// ── API: 推送到公众号草稿箱 ────────────────────────────────────
app.post('/api/wechat/draft', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title)   return res.status(400).json({ success: false, error: '缺少标题' });
    if (!content) return res.status(400).json({ success: false, error: '缺少内容' });

    // 获取 token
    let token;
    try {
      token = await getAccessToken();
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message, hint: '请检查公众号 AppID/AppSecret 和 IP 白名单' });
    }

    // 上传正文图片到微信 CDN
    const weixinDomains = ['mmbiz.qpic.cn', 'mmbiz.qlogo.cn', 'res.wx.qq.com'];
    const srcRegex = /\bsrc="(https?:\/\/[^"]+)"/g;
    const externalUrls = new Set();
    let m;
    while ((m = srcRegex.exec(content)) !== null) {
      if (!weixinDomains.some(d => m[1].includes(d))) externalUrls.add(m[1]);
    }

    let processedContent = content;
    for (const url of externalUrls) {
      const wxUrl = await uploadImageToWechat(url, token);
      if (wxUrl) {
        processedContent = processedContent.split(url).join(wxUrl);
      }
    }

    // 推送草稿 — 用内置图片 URL 做封面（取正文第一张）
    let thumbMediaId = '';
    const firstImgMatch = processedContent.match(/<img[^>]+src="([^"]+)"/);
    if (firstImgMatch) {
      try {
        const coverUrl = firstImgMatch[1];
        const imgRes = await fetch(coverUrl);
        if (imgRes.ok) {
          const buf  = Buffer.from(await imgRes.arrayBuffer());
          const ct   = imgRes.headers.get('content-type') || 'image/jpeg';
          const form = new FormData();
          form.append('media', new Blob([buf], { type: ct }), 'cover.jpg');
          const covRes  = await fetch(`${WECHAT_API}/material/add_material?access_token=${token}&type=image`, { method: 'POST', body: form });
          const covData = await covRes.json();
          thumbMediaId = covData.media_id || '';
        }
      } catch {}
    }

    const article = {
      title,
      content: processedContent,
      thumb_media_id: thumbMediaId || '',
      show_cover_pic: thumbMediaId ? 1 : 0,
      need_open_comment: 0,
    };
    if (author) article.author = author;

    const draftRes = await fetch(`${WECHAT_API}/draft/add?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles: [article] }),
    });
    const draftData = await draftRes.json();

    if (draftData.errcode && draftData.errcode !== 0) {
      return res.status(500).json({
        success: false,
        error: `推送失败：[${draftData.errcode}] ${draftData.errmsg}`,
      });
    }

    const imageCount = externalUrls.size;
    res.json({
      success: true,
      media_id: draftData.media_id,
      image_uploaded: imageCount,
      message: '已推送到公众号草稿箱，请前往 mp.weixin.qq.com → 草稿箱查看',
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── 健康检查 ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', config_ready: !!(WECHAT_APP_ID && WECHAT_APP_SECRET) });
});

// ── 生产环境：托管前端静态文件 ────────────────────────────────
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 微信排版服务已启动 → http://localhost:${PORT}`);
  console.log(`   公众号配置：${WECHAT_APP_ID ? '✅ 已配置' : '⚠️ 未配置（需在 .env 中填写）'}`);
});

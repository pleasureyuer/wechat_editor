require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const app     = express();

app.use(express.json({ limit: '5mb' }));

// ── 凭据存储路径（服务器文件，用户在前端配置后写入）───────────
const CREDENTIALS_FILE = path.join(__dirname, '..', 'credentials.json');

// .env 作为后备（首次部署或用户未在前端配置时使用）
const ENV_APP_ID     = process.env.WECHAT_APP_ID     || '';
const ENV_APP_SECRET = process.env.WECHAT_APP_SECRET || '';

/**
 * 读取凭据文件 → 返回 { accounts: [...], activeAppId: 'wx...' }
 * 兼容旧格式 { appId, appSecret } → 自动迁移
 */
function readCredentialsFile() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null;
    const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    // 旧格式兼容：{ appId, appSecret } → 升级为多账号格式
    if (data.appId && data.appSecret && !data.accounts) {
      const migrated = {
        accounts: [{ name: '默认账号', appId: data.appId, appSecret: data.appSecret, createdAt: data.updatedAt || new Date().toISOString() }],
        activeAppId: data.appId,
      };
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(migrated, null, 2), 'utf-8');
      return migrated;
    }
    if (data.accounts && Array.isArray(data.accounts)) return data;
  } catch {}
  return null;
}

function writeCredentialsFile(data) {
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/** 添加或更新一个账号（按 appId 去重） */
function upsertAccount(name, appId, appSecret) {
  let data = readCredentialsFile();
  if (!data) data = { accounts: [], activeAppId: null };
  const idx = data.accounts.findIndex(a => a.appId === appId);
  if (idx >= 0) {
    data.accounts[idx].name = name || data.accounts[idx].name;
    data.accounts[idx].appSecret = appSecret;
  } else {
    data.accounts.push({ name, appId, appSecret, createdAt: new Date().toISOString() });
  }
  data.activeAppId = appId; // 新添加/更新的账号自动激活
  writeCredentialsFile(data);
  return data;
}

/** 删除账号 */
function removeAccount(appId) {
  let data = readCredentialsFile();
  if (!data) return false;
  data.accounts = data.accounts.filter(a => a.appId !== appId);
  if (data.activeAppId === appId) {
    data.activeAppId = data.accounts.length > 0 ? data.accounts[0].appId : null;
  }
  writeCredentialsFile(data);
  return true;
}

/** 切换激活账号 */
function setActiveAccount(appId) {
  let data = readCredentialsFile();
  if (!data) return false;
  if (!data.accounts.some(a => a.appId === appId)) return false;
  data.activeAppId = appId;
  writeCredentialsFile(data);
  // 清除旧 token
  tokenCache = { token: '', expires: 0 };
  return true;
}

/** 只读：获取所有账号（脱敏）及当前激活账号 */
function getAccountsInfo() {
  const data = readCredentialsFile();
  if (!data) return { accounts: [], activeAppId: null };
  return {
    accounts: data.accounts.map(a => {
      const len = a.appId.length;
      return {
        name: a.name,
        appId: a.appId,
        appIdMasked: len > 8 ? a.appId.slice(0, 6) + '___' + a.appId.slice(-4) : a.appId,
        isActive: a.appId === data.activeAppId,
      };
    }),
    activeAppId: data.activeAppId,
  };
}

// 旧接口兼容
function getCredentials() {
  const data = readCredentialsFile();
  // 多账号：返回激活的账号
  if (data && data.accounts && data.activeAppId) {
    const active = data.accounts.find(a => a.appId === data.activeAppId);
    if (active) return { appId: active.appId, appSecret: active.appSecret };
  }
  // 旧格式兼容
  if (data && data.appId && data.appSecret) return { appId: data.appId, appSecret: data.appSecret };
  // 回退到 .env
  if (ENV_APP_ID && ENV_APP_SECRET) return { appId: ENV_APP_ID, appSecret: ENV_APP_SECRET };
  return null;
}

// ── 微信 API 配置 ──────────────────────────────────────────────
const WECHAT_API = 'https://api.weixin.qq.com/cgi-bin';

// ── access_token 缓存 ─────────────────────────────────────────
let tokenCache = { token: '', expires: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }

  const creds = getCredentials();
  if (!creds || !creds.appId || !creds.appSecret) {
    throw new Error('未配置公众号 AppID/AppSecret，请在顶部「添加新账号」中配置');
  }

  const { appId: WECHAT_APP_ID, appSecret: WECHAT_APP_SECRET } = creds;

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

// ── 上传图片到微信 CDN（正文图片，返回 url）───────────────────
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

// ── 上传图片到微信素材库（封面图，返回 media_id）───────────────
async function uploadMaterialToWechat(base64, token) {
  const match = base64.match(/^data:image\/(jpeg|png|gif|jpg|webp);base64,(.+)$/s);
  if (!match) throw new Error('仅支持 JPEG/PNG/GIF/WEBP 格式的 base64 图片');
  const mimeType = 'image/' + (match[1] === 'jpeg' ? 'jpeg' : match[1]);
  const ext      = match[1] === 'jpeg' ? 'jpg' : match[1];
  const imageBuffer = Buffer.from(match[2], 'base64');

  const boundary = '----FormBoundary' + Math.random().toString(16).slice(2);
  const crlf = '\r\n', dashes = '--';
  const head = Buffer.from(
    dashes + boundary + crlf +
    'Content-Disposition: form-data; name="media"; filename="cover.' + ext + '"' + crlf +
    'Content-Type: ' + mimeType + crlf + crlf
  );
  const tail = Buffer.from(crlf + dashes + boundary + dashes + crlf);
  const body = Buffer.concat([head, imageBuffer, tail]);

  const res = await fetch(
    `${WECHAT_API}/material/add_material?access_token=${token}&type=image`,
    { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': String(body.length) }, body }
  );
  const data = await res.json();
  if (!data.media_id) throw new Error(data.errmsg || '上传素材失败');
  return data.media_id;
}

// ── API: 推送到公众号草稿箱 ────────────────────────────────────
app.post('/api/wechat/draft', async (req, res) => {
  try {
    const { title, content, author, digest, content_source_url, need_open_comment, cover_base64 } = req.body;
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

    // ── 封面图处理 ─────────────────────────────────────────────
    let thumbMediaId = '';

    // 1️⃣ 优先使用前端传来的封面 base64
    if (cover_base64) {
      try {
        thumbMediaId = await uploadMaterialToWechat(cover_base64, token);
      } catch (e) {
        // 前端封面上传失败不阻断流程，继续尝试后备方案
        console.log('[draft] 前端封面上传失败:', e.message);
      }
    }

    // 2️⃣ 后备：取正文第一张图做封面
    if (!thumbMediaId) {
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
    }

    // 构建 article — 注意：thumb_media_id 为空时不传该字段（否则微信报 invalid media_id）
    const article = {
      title,
      content: processedContent,
      need_open_comment: need_open_comment ? 1 : 0,
    };
    if (thumbMediaId) {
      article.thumb_media_id = thumbMediaId;
      article.show_cover_pic = 1;
    }
    if (author) article.author = author;
    if (digest) article.digest = digest;
    if (content_source_url) article.content_source_url = content_source_url;

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

// ── API: 上传图片到微信素材库（封面图上传，返回 media_id）────
app.post('/api/upload/image', async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ errcode: -1, errmsg: '缺少 base64 图片数据' });

    let token;
    try {
      token = await getAccessToken();
    } catch (e) {
      return res.status(500).json({ errcode: -1, errmsg: e.message });
    }

    const mediaId = await uploadMaterialToWechat(base64, token);
    res.json({ media_id: mediaId });
  } catch (e) {
    res.status(500).json({ errcode: -1, errmsg: e.message });
  }
});

// ── API: base64 正文图片上传到微信 CDN（返回 url，用于装饰块截图嵌入）
// 与 /api/upload/image（素材库 media_id）不同，这里走 media/uploadimg 返回正文可用的 url
app.post('/api/wechat/upload-base64-image', async (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ success: false, error: '缺少 base64 图片数据' });

    const match = base64.match(/^data:(image\/(jpeg|png|gif|jpg|webp));base64,(.+)$/s);
    if (!match) return res.status(400).json({ success: false, error: '仅支持 JPEG/PNG/GIF/WEBP 的 base64 图片' });

    let token;
    try {
      token = await getAccessToken();
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const ext = contentType.includes('png') ? '.png' : contentType.includes('gif') ? '.gif' : '.jpg';

    const form = new FormData();
    form.append('media', new Blob([buffer], { type: contentType }), `deco${ext}`);

    const upRes = await fetch(`${WECHAT_API}/media/uploadimg?access_token=${token}`, { method: 'POST', body: form });
    const upData = await upRes.json();
    if (!upData.url) return res.status(500).json({ success: false, error: upData.errmsg || '上传图片到微信失败' });
    res.json({ success: true, url: upData.url });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── 微信凭据管理（多账号）─────────────────────────────────
// GET  → 查看当前所有账号配置状态（脱敏）
app.get('/api/settings/wechat', (req, res) => {
  const info = getAccountsInfo();
  if (info.accounts.length === 0 && ENV_APP_ID) {
    // .env 有配置但未在前端添加过账号
    const envAcc = {
      name: '环境变量配置',
      appId: ENV_APP_ID,
      appIdMasked: ENV_APP_ID.length > 8 ? ENV_APP_ID.slice(0, 6) + '___' + ENV_APP_ID.slice(-4) : ENV_APP_ID,
      isActive: true,
    };
    return res.json({ accounts: [envAcc], activeAppId: ENV_APP_ID, source: 'env' });
  }
  res.json({ ...info, source: info.accounts.length > 0 ? 'frontend' : 'none' });
});

// PUT → 切换激活账号（无需传 Secret，前端只管 appId）
app.put('/api/settings/wechat/active', (req, res) => {
  const { appId } = req.body;
  if (!appId) return res.status(400).json({ success: false, error: '缺少 appId' });
  const ok = setActiveAccount(appId);
  if (!ok) return res.status(404).json({ success: false, error: '未找到此账号，请先添加' });
  res.json({ success: true, activeAppId: appId });
});

// POST → 添加/更新账号
app.post('/api/settings/wechat', (req, res) => {
  const { name, appId, appSecret } = req.body;
  if (!appId || !appSecret) {
    return res.status(400).json({ success: false, error: '缺少 appId 或 appSecret' });
  }
  if (!appId.startsWith('wx')) {
    return res.status(400).json({ success: false, error: 'AppID 格式不正确（应以 wx 开头）' });
  }
  const accountName = name || '未命名账号';
  const data = upsertAccount(accountName, appId, appSecret);
  tokenCache = { token: '', expires: 0 };
  res.json({
    success: true,
    appId,
    name: accountName,
    activeAppId: data.activeAppId,
    accountCount: data.accounts.length,
  });
});

// PATCH → 修改账号昵称
app.patch('/api/settings/wechat/rename', (req, res) => {
  const { appId, name } = req.body;
  if (!appId || !name || !name.trim()) return res.status(400).json({ success: false, error: '缺少 appId 或 name' });
  const data = readCredentialsFile();
  if (!data) return res.status(404).json({ success: false, error: '无账号数据' });
  const acc = data.accounts.find(a => a.appId === appId);
  if (!acc) return res.status(404).json({ success: false, error: '未找到此账号' });
  acc.name = name.trim();
  writeCredentialsFile(data);
  res.json({ success: true, name: acc.name });
});

// DELETE → 删除账号
app.delete('/api/settings/wechat/:appId', (req, res) => {
  const { appId } = req.params;
  const ok = removeAccount(appId);
  if (!ok) return res.status(404).json({ success: false, error: '未找到此账号' });
  tokenCache = { token: '', expires: 0 };
  res.json({ success: true, activeAppId: getAccountsInfo().activeAppId });
});

// ── 健康检查 ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const creds = getCredentials();
  res.json({ status: 'ok', config_ready: !!(creds && creds.appId && creds.appSecret) });
});

// ── 生产环境：托管前端静态文件 ────────────────────────────────
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const creds = getCredentials();
  console.log(`✅ 微信排版服务已启动 → http://localhost:${PORT}`);
  console.log(`   公众号配置：${(creds && creds.appId) ? '✅ 已配置（' + creds.appId + '）' : '⚠️ 未配置（请在页面顶部「添加新账号」中配置）'}`);
});

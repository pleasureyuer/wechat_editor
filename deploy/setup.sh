#!/bin/bash
# ============================================================
# 公众号排版工具 - 一键部署脚本
# 服务器: 175.178.188.48 | 域名: editor.ai2026.cloud
# 用法: chmod +x setup.sh && bash setup.sh
# ============================================================
set -e

echo "🚀 开始部署公众号排版工具..."

# ── 1. 创建目录 ──────────────────────────────────────────
APP_DIR="/opt/wechat-editor"
mkdir -p "$APP_DIR"/{frontend/dist,backend/src,deploy/nginx}

# ── 2. 安装 Nginx ───────────────────────────────────────
if ! command -v nginx &>/dev/null; then
    echo "📦 安装 Nginx..."
    apt update -qq && apt install -y nginx
    systemctl enable nginx
fi

# ── 3. 部署前端静态文件 ─────────────────────────────────
echo "📁 部署前端文件..."
# 注意: 先在本地执行 npm run build，然后把 dist 上传到服务器
# scp -r frontend/dist/* root@175.178.188.48:/opt/wechat-editor/frontend/dist/

# ── 4. 部署后端 ─────────────────────────────────────────
echo "📁 部署后端..."
cd "$APP_DIR/backend"
if [ ! -f package.json ]; then
    cp /root/wechat-editor-deploy/package.json . 2>/dev/null || echo "⚠️ 请手动上传 package.json"
fi
npm install --production 2>/dev/null || echo "⚠️ npm install 失败，请检查网络"

# ── 5. 配置环境变量 ─────────────────────────────────────
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "⚠️ 请创建 $APP_DIR/backend/.env 文件，填写公众号 AppID 和 AppSecret"
    echo "   cp .env.example .env && nano .env"
fi

# ── 6. 配置 Nginx ───────────────────────────────────────
echo "🔧 配置 Nginx..."
NGINX_CONF="$APP_DIR/deploy/nginx/editor.ai2026.cloud.conf"
if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" /etc/nginx/sites-available/editor.ai2026.cloud
    ln -sf /etc/nginx/sites-available/editor.ai2026.cloud /etc/nginx/sites-enabled/
    # 移除默认站点
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo "   ✅ Nginx 配置完成"
else
    echo "   ⚠️ Nginx 配置文件未找到"
fi

# ── 7. 配置 systemd 服务（后端自动启动） ───────────────
echo "🔧 配置 systemd 服务..."
cat > /etc/systemd/system/wechat-editor.service << 'SYSTEMD'
[Unit]
Description=微信排版工具后端服务
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/wechat-editor/backend
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable wechat-editor
systemctl restart wechat-editor

# ── 8. 检查状态 ─────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo ""
echo "  前端: http://editor.ai2026.cloud"
echo "  API:  http://editor.ai2026.cloud/api/health"
echo "  状态检查: systemctl status wechat-editor nginx"
echo ""
echo "  下一步（如需 SSL）："
echo "  1. 安装 certbot: apt install -y certbot python3-certbot-nginx"
echo "  2. 申请证书: certbot --nginx -d editor.ai2026.cloud"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

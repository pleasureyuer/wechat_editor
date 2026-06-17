"""Deploy frontend credentials feature to server"""
import paramiko, os, sys

HOST = '175.178.188.48'
USER = 'root'
PASS = 'Yueyue123'
LOCAL_BASE = r'F:\wechat_editor'

def ssh():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASS, timeout=15)
    return c

def run(c, cmd):
    print(f'  → {cmd[:80]}')
    stdin, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err: print(f'  ⚠ {err}')
    return out

print('=== 上传前端 dist ===')
cli = ssh()
sftp = cli.open_sftp()

# Upload frontend dist
dist_src = os.path.join(LOCAL_BASE, 'frontend', 'dist')
dist_dst = '/opt/wechat_editor/frontend'

# Remove old frontend files first (keep directory)
run(cli, f'rm -rf {dist_dst}/*')

# Upload recursively
for root, dirs, files in os.walk(dist_src):
    rel = os.path.relpath(root, dist_src)
    remote_dir = os.path.join(dist_dst, rel).replace('\\', '/')
    try:
        sftp.stat(remote_dir)
    except:
        sftp.mkdir(remote_dir)
    for f in files:
        src = os.path.join(root, f)
        dst = os.path.join(remote_dir, f).replace('\\', '/')
        sftp.put(src, dst)
        print(f'  ✓ {rel}/{f}' if rel != '.' else f'  ✓ {f}')

sftp.close()

print('\n=== 上传后端 index.js ===')
sftp2 = cli.open_sftp()
sftp2.put(
    os.path.join(LOCAL_BASE, 'backend', 'src', 'index.js'),
    '/opt/wechat_editor/backend/src/index.js'
)
sftp2.close()

print('\n=== 重启服务 ===')
out = run(cli, 'pm2 restart wechat-backend 2>&1')
print(f'  PM2: {out}')

# Verify
print('\n=== 验证 API ===')
out = run(cli, "curl -s http://localhost:3000/api/settings/wechat 2>&1")
print(f'  GET /api/settings/wechat → {out}')

out = run(cli, "curl -s http://localhost:3000/api/health 2>&1")
print(f'  GET /api/health → {out}')

# Test credential save
out = run(cli, '''curl -s -X POST http://localhost:3000/api/settings/wechat -H "Content-Type: application/json" -d '{"appId":"wx_test","appSecret":"test_secret"}' 2>&1''')
print(f'  POST /api/settings/wechat → {out}')

# Cleanup test credentials
run(cli, 'rm -f /opt/wechat_editor/backend/credentials.json')

cli.close()
print('\n✅ 部署完成！')

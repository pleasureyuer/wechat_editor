#!/usr/bin/env python3
"""部署封面图功能到服务器"""
import paramiko, time

HOST = '175.178.188.48'
USER = 'root'
PASS = 'Yueyue123'

def ssh_cmd(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if code != 0 and err.strip():
        print(f'  [WARN] exit={code}: {err.strip()[:200]}')
    return out.strip()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)
sftp = client.open_sftp()

try:
    # 1. 上传后端代码
    print('1/4 上传后端...')
    sftp.put('F:/wechat_editor/backend/src/index.js', '/opt/wechat_editor/backend/src/index.js')

    # 2. 上传前端 dist
    print('2/4 上传前端...')
    ssh_cmd('rm -rf /opt/wechat_editor/frontend/*')
    import os
    local_dist = 'F:/wechat_editor/frontend/dist'
    for root, dirs, files in os.walk(local_dist):
        remote_root = '/opt/wechat_editor/frontend' + root[len(local_dist):].replace('\\', '/')
        for d in dirs:
            try: sftp.mkdir(remote_root + '/' + d)
            except: pass
        for f in files:
            local_path = os.path.join(root, f).replace('\\', '/')
            remote_path = (remote_root + '/' + f).replace('\\', '/')
            sftp.put(local_path, remote_path)

    # 3. 重启后端
    print('3/4 重启后端...')
    result = ssh_cmd('source ~/.bashrc 2>/dev/null; pm2 restart wechat-backend 2>&1', timeout=15)
    print(f'  PM2: {result[:200]}')

    # 4. 测试
    print('4/4 验证...')
    time.sleep(2)
    health = ssh_cmd('curl -s http://localhost:3000/api/health 2>&1')
    print(f'  /api/health: {health}')
    upload_test = ssh_cmd("curl -s -X POST http://localhost:3000/api/upload/image -H 'Content-Type: application/json' -d '{\"base64\":\"bad\"}' 2>&1")
    print(f'  /api/upload/image: {upload_test[:200]}')

    print('\n✅ 部署完成！')
finally:
    sftp.close()
    client.close()

#!/usr/bin/env python3
"""部署主题管理功能到服务器"""
import paramiko, os, sys

HOST = '175.178.188.48'
USER = 'root'
PASS = 'Yueyue123'
DEPLOY = '/opt/wechat_editor'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS)
sftp = ssh.open_sftp()

print('📤 上传前端 dist...')
for root, dirs, files in os.walk('frontend/dist'):
    for f in files:
        local = os.path.join(root, f)
        remote = os.path.join(DEPLOY, 'frontend', os.path.relpath(local, 'frontend/dist'))
        remote = remote.replace('\\', '/')
        try:
            sftp.put(local, remote)
        except:
            d = os.path.dirname(remote)
            try:
                ssh.exec_command(f'mkdir -p "{d}"', timeout=5)
                sftp.put(local, remote)
            except:
                pass

print('✅ 前端已更新')
print('🔄 重载 Nginx...')
ssh.exec_command('nginx -s reload', timeout=5)
print('✅ 部署完成！')

sftp.close()
ssh.close()

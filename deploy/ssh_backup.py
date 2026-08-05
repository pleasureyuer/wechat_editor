"""Backup current production code from server before deploying changes."""
import paramiko
import os
from datetime import datetime

HOST = "175.178.188.48"
USER = "root"
PASSWORD = "Yueyue123"
PORT = 22

PROJECT_DIR = "/opt/wechat_editor"
BACKUP_DIR = "/opt/wechat_editor_backups"

def ssh_connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[*] Connecting to {USER}@{HOST}:{PORT}...")
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)
    print("[+] Connected!")
    return client

def run_cmd(client, cmd, desc=""):
    if desc:
        print(f"[*] {desc}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        print(f"    {out.strip()[:800]}")
    if exit_code != 0 and err.strip():
        print(f"    stderr: {err.strip()[:500]}")
    return exit_code, out, err

def main():
    client = ssh_connect()
    # Ensure backup dir exists
    run_cmd(client, f"mkdir -p {BACKUP_DIR}", "Creating backup directory")
    # Tar current project with timestamp
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{BACKUP_DIR}/wechat_editor_{ts}.tar.gz"
    run_cmd(client, f"tar czf {backup_path} -C /opt wechat_editor", f"Backing up to {backup_path}")
    # List backups
    run_cmd(client, f"ls -lh {BACKUP_DIR}/", "Backup files on server")
    client.close()
    print("[+] Backup complete!")

if __name__ == "__main__":
    main()

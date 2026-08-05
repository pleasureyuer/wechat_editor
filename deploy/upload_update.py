"""Targeted deploy: upload frontend dist + updated backend index.js"""
import paramiko
import os
import time

HOST = "175.178.188.48"
USER = "root"
PASSWORD = "Yueyue123"
PROJECT_DIR = "/opt/wechat_editor"
LOCAL_FRONTEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
LOCAL_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "src", "index.js"))

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"[*] Connecting to {USER}@{HOST}...")
client.connect(HOST, username=USER, password=PASSWORD, timeout=10)
print("[+] Connected!")

try:
    # Step 1: Backup
    print("\n[1/4] Backing up current deployment...")
    client.exec_command(f"cp -r {PROJECT_DIR}/frontend {PROJECT_DIR}/frontend_bak_$(date +%Y%m%d_%H%M%S) 2>/dev/null; echo done")[1].channel.recv_exit_status()
    client.exec_command(f"cp {PROJECT_DIR}/backend/src/index.js {PROJECT_DIR}/backend/src/index.js.bak 2>/dev/null; echo done")[1].channel.recv_exit_status()
    print("[+] Backup done")

    # Step 2: Upload frontend dist
    print("\n[2/4] Uploading frontend...")
    sftp = client.open_sftp()
    try:
        sftp.stat(f"{PROJECT_DIR}/frontend")
    except:
        client.exec_command(f"mkdir -p {PROJECT_DIR}/frontend")

    for root, dirs, files in os.walk(LOCAL_FRONTEND):
        rel = os.path.relpath(root, LOCAL_FRONTEND)
        rpath = os.path.join(PROJECT_DIR, "frontend", rel).replace("\\", "/") if rel != "." else f"{PROJECT_DIR}/frontend"
        try:
            sftp.stat(rpath)
        except:
            client.exec_command(f'mkdir -p "{rpath}"')
        for f in files:
            lf = os.path.join(root, f)
            rf = rpath + "/" + f
            try:
                sftp.put(lf, rf)
            except Exception as e:
                print(f"  [!] {f}: {e}")
    sftp.close()
    print("[+] Frontend uploaded")

    # Step 3: Upload backend index.js
    print("\n[3/4] Uploading backend index.js...")
    sftp2 = client.open_sftp()
    sftp2.put(LOCAL_BACKEND, f"{PROJECT_DIR}/backend/src/index.js")
    sftp2.close()
    print("[+] Backend uploaded")

    # Step 4: Restart backend
    print("\n[4/4] Restarting backend...")
    stdin, stdout, stderr = client.exec_command(f"cd {PROJECT_DIR}/backend && pm2 restart wechat-backend 2>&1")
    print(stdout.read().decode())

    # Verify
    print("\n[*] Verifying...")
    time.sleep(2)
    stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost/')
    print(f"Frontend HTTP: {stdout.read().decode().strip()}")
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/api/health")
    print(f"Backend: {stdout.read().decode().strip()}")

    print("\n[+] Deploy complete! http://editor.ai2026.cloud")

finally:
    client.close()
    print("\n[*] SSH connection closed.")

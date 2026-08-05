"""Deploy frontend + backend, and clean old assets on server"""
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
    # Backup
    print("\n[1/5] Backing up...")
    client.exec_command(f"cp -r {PROJECT_DIR}/frontend {PROJECT_DIR}/frontend_bak_$(date +%Y%m%d_%H%M%S) 2>/dev/null")[1].channel.recv_exit_status()
    client.exec_command(f"cp {PROJECT_DIR}/backend/src/index.js {PROJECT_DIR}/backend/src/index.js.bak 2>/dev/null")[1].channel.recv_exit_status()
    print("[+] Done")

    # Clean old assets on server
    print("\n[2/5] Cleaning old assets...")
    stdin, stdout, stderr = client.exec_command(f"rm -f {PROJECT_DIR}/frontend/assets/index-*.js {PROJECT_DIR}/frontend/assets/index-*.css")
    stdout.channel.recv_exit_status()
    print("[+] Done")

    # Upload frontend
    print("\n[3/5] Uploading frontend...")
    sftp = client.open_sftp()
    try:
        sftp.stat(f"{PROJECT_DIR}/frontend/assets")
    except:
        client.exec_command(f"mkdir -p {PROJECT_DIR}/frontend/assets")
    for f in os.listdir(LOCAL_FRONTEND):
        lf = os.path.join(LOCAL_FRONTEND, f)
        if os.path.isfile(lf):
            rf = f"{PROJECT_DIR}/frontend/{f}"
            sftp.put(lf, rf)
            print(f"  {f}")
        elif os.path.isdir(lf) and f == "assets":
            for af in os.listdir(lf):
                sftp.put(os.path.join(lf, af), f"{PROJECT_DIR}/frontend/assets/{af}")
                print(f"  assets/{af}")
    sftp.close()
    print("[+] Done")

    # Upload backend
    print("\n[4/5] Uploading backend...")
    sftp2 = client.open_sftp()
    sftp2.put(LOCAL_BACKEND, f"{PROJECT_DIR}/backend/src/index.js")
    sftp2.close()
    print("[+] Done")

    # Restart
    print("\n[5/5] Restarting backend...")
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

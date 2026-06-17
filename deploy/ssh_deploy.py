"""SSH deployment script for wechat-editor to Tencent Cloud server"""
import paramiko
import os
import sys
import time

HOST = "175.178.188.48"
USER = "root"
PASSWORD = "Yueyue123"
PORT = 22

PROJECT_DIR = "/opt/wechat_editor"
LOCAL_FRONTEND = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
LOCAL_BACKEND = os.path.join(os.path.dirname(__file__), "..", "backend")

def ssh_connect():
    """Connect to remote server"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[*] Connecting to {USER}@{HOST}:{PORT}...")
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)
    print("[+] Connected!")
    return client

def run_cmd(client, cmd, desc=""):
    """Run a command on the remote server"""
    if desc:
        print(f"[*] {desc}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if exit_code != 0 and err.strip():
        print(f"    stderr: {err.strip()[:500]}")
    if out.strip():
        lines = out.strip().split('\n')
        for line in lines[:15]:
            print(f"    {line}")
        if len(lines) > 15:
            print(f"    ... ({len(lines)} lines total)")
    return exit_code, out, err

def upload_file(client, local_path, remote_path):
    """Upload a single file"""
    sftp = client.open_sftp()
    print(f"[*] Uploading {local_path} -> {remote_path}")
    sftp.put(local_path, remote_path)
    sftp.close()

def upload_dir(client, local_dir, remote_dir):
    """Upload a directory recursively"""
    sftp = client.open_sftp()
    
    # Ensure remote dir exists
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        run_cmd(client, f"mkdir -p {remote_dir}")
    
    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        if rel_path == '.':
            remote_path = remote_dir
        else:
            remote_path = os.path.join(remote_dir, rel_path).replace('\\', '/')
        
        try:
            sftp.stat(remote_path)
        except FileNotFoundError:
            run_cmd(client, f"mkdir -p '{remote_path}'")
        
        for fname in files:
            local_file = os.path.join(root, fname)
            remote_file = os.path.join(remote_path, fname).replace('\\', '/')
            try:
                sftp.put(local_file, remote_file)
            except Exception as e:
                print(f"    [!] Failed: {local_file} -> {remote_file}: {e}")
    
    sftp.close()
    print(f"[+] Upload complete: {local_dir} -> {remote_dir}")


def main():
    client = ssh_connect()
    
    try:
        # ==========================================
        # Step 1: Check server environment
        # ==========================================
        print("\n" + "="*60)
        print("Step 1: Checking server environment")
        print("="*60)
        run_cmd(client, "uname -a", "OS info")
        run_cmd(client, "cat /etc/os-release | head -3", "OS release")
        run_cmd(client, "node --version 2>/dev/null || echo 'node not installed'", "Node.js")
        run_cmd(client, "which nginx 2>/dev/null || echo 'nginx not installed'", "Nginx")
        run_cmd(client, "df -h / | tail -1", "Disk space")
        run_cmd(client, "free -h | head -2", "Memory")
        
        # ==========================================
        # Step 2: Install Node.js if needed
        # ==========================================
        print("\n" + "="*60)
        print("Step 2: Setting up Node.js")
        print("="*60)
        ec, out, _ = run_cmd(client, "node --version 2>/dev/null")
        if ec != 0:
            print("[*] Installing Node.js 22.x...")
            cmds = [
                "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
                "apt-get install -y nodejs",
            ]
            for cmd in cmds:
                run_cmd(client, cmd, "Installing...")
            run_cmd(client, "node --version", "Node.js version")
        else:
            print(f"[+] Node.js already installed: {out.strip()}")
        
        # ==========================================
        # Step 3: Install Nginx
        # ==========================================
        print("\n" + "="*60)
        print("Step 3: Setting up Nginx")
        print("="*60)
        ec, _, _ = run_cmd(client, "which nginx 2>/dev/null")
        if ec != 0:
            print("[*] Installing Nginx...")
            run_cmd(client, "apt-get update -qq && apt-get install -y nginx", "Installing Nginx")
        run_cmd(client, "nginx -v 2>&1", "Nginx version")
        run_cmd(client, "systemctl enable nginx", "Enable nginx on boot")
        run_cmd(client, "systemctl start nginx || nginx", "Start nginx")
        
        # ==========================================
        # Step 4: Create project directories
        # ==========================================
        print("\n" + "="*60)
        print("Step 4: Creating project directories")
        print("="*60)
        run_cmd(client, f"mkdir -p {PROJECT_DIR}/frontend {PROJECT_DIR}/backend", "Creating dirs")
        
        # ==========================================
        # Step 5: Upload frontend (dist)
        # ==========================================
        print("\n" + "="*60)
        print("Step 5: Uploading frontend")
        print("="*60)
        if os.path.exists(LOCAL_FRONTEND):
            upload_dir(client, LOCAL_FRONTEND, f"{PROJECT_DIR}/frontend")
        else:
            print(f"[!] Frontend dist not found at {LOCAL_FRONTEND}")
        
        # ==========================================
        # Step 6: Upload backend
        # ==========================================
        print("\n" + "="*60)
        print("Step 6: Uploading backend")
        print("="*60)
        if os.path.exists(LOCAL_BACKEND):
            upload_dir(client, LOCAL_BACKEND, f"{PROJECT_DIR}/backend")
        else:
            print(f"[!] Backend not found at {LOCAL_BACKEND}")
        
        # ==========================================
        # Step 7: Install backend dependencies
        # ==========================================
        print("\n" + "="*60)
        print("Step 7: Installing backend dependencies")
        print("="*60)
        run_cmd(client, f"cd {PROJECT_DIR}/backend && npm install --production 2>&1 | tail -10", "npm install")
        
        # ==========================================
        # Step 8: Create .env file (placeholder - user fills in later)
        # ==========================================
        print("\n" + "="*60)
        print("Step 8: Setting up environment config")
        print("="*60)
        ec, _, _ = run_cmd(client, f"test -f {PROJECT_DIR}/backend/.env && echo 'exists'")
        if ec != 0:
            env_content = """# 微信公众号配置 (请替换为真实值)
WECHAT_APPID=your_appid_here
WECHAT_APPSECRET=your_appsecret_here
PORT=3000
NODE_ENV=production
"""
            run_cmd(client, f"cat > {PROJECT_DIR}/backend/.env << 'ENVEOF'\n{env_content}\nENVEOF", "Creating .env")
        
        # ==========================================
        # Step 9: Configure Nginx
        # ==========================================
        print("\n" + "="*60)
        print("Step 9: Configuring Nginx")
        print("="*60)
        
        nginx_conf = """# wechat-editor: editor.ai2026.cloud
server {
    listen 80;
    server_name editor.ai2026.cloud;

    root /opt/wechat_editor/frontend;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
}
"""
        run_cmd(client, f"cat > /etc/nginx/sites-available/wechat-editor << 'NGXEOF'\n{nginx_conf}\nNGXEOF", "Writing nginx config")
        
        # Enable site
        run_cmd(client, "ln -sf /etc/nginx/sites-available/wechat-editor /etc/nginx/sites-enabled/", "Enable site")
        run_cmd(client, "rm -f /etc/nginx/sites-enabled/default", "Remove default site")
        run_cmd(client, "nginx -t 2>&1", "Test nginx config")
        run_cmd(client, "systemctl reload nginx 2>/dev/null || nginx -s reload", "Reload nginx")
        
        # ==========================================
        # Step 10: Set up PM2 for backend
        # ==========================================
        print("\n" + "="*60)
        print("Step 10: Setting up PM2 process manager")
        print("="*60)
        ec, _, _ = run_cmd(client, "which pm2 2>/dev/null")
        if ec != 0:
            run_cmd(client, "npm install -g pm2 2>&1 | tail -5", "Installing PM2")
        
        run_cmd(client, f"cd {PROJECT_DIR}/backend && pm2 delete wechat-backend 2>/dev/null; pm2 start src/index.js --name wechat-backend --env production", "Starting backend with PM2")
        run_cmd(client, "pm2 save", "Save PM2 process list")
        run_cmd(client, "pm2 startup systemd -u root --hp /root 2>&1 | tail -5", "Auto-start on boot")
        
        # ==========================================
        # Step 11: Verify deployment
        # ==========================================
        print("\n" + "="*60)
        print("Step 11: Verifying deployment")
        print("="*60)
        time.sleep(2)
        run_cmd(client, "systemctl status nginx 2>/dev/null | head -5 || echo 'nginx running'", "Nginx status")
        run_cmd(client, "pm2 status 2>&1", "PM2 status")
        run_cmd(client, "curl -s http://localhost:3000/api/health 2>&1", "Backend health check")
        run_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost/ 2>&1", "Frontend HTTP status")
        
        print("\n" + "="*60)
        print("[+] DEPLOYMENT COMPLETE!")
        print(f"[+] Open: http://editor.ai2026.cloud")
        print("="*60)
        
    finally:
        client.close()
        print("\n[*] SSH connection closed.")

if __name__ == "__main__":
    main()

"""Fix: Install nginx on OpenCloudOS (RHEL-based) and configure"""
import paramiko

HOST = "175.178.188.48"
USER = "root"
PASSWORD = "Yueyue123"

def ssh_connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=22, username=USER, password=PASSWORD, timeout=10)
    return client

def run_cmd(client, cmd, desc=""):
    if desc:
        print(f"[*] {desc}")
    stdin, stdout, stderr = client.exec_command(cmd)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        for line in out.strip().split('\n')[:20]:
            print(f"    {line}")
    if err.strip():
        print(f"    [!] {err.strip()[:300]}")
    return exit_code, out, err

client = ssh_connect()

try:
    # Check package manager
    print("Step 1: Detect package manager")
    run_cmd(client, "which dnf && echo dnf || (which yum && echo yum)", "Checking...")
    
    # Install nginx via dnf
    print("\nStep 2: Install Nginx")
    run_cmd(client, "dnf install -y nginx 2>&1 | tail -10", "Installing nginx via dnf")
    
    # Verify
    run_cmd(client, "nginx -v 2>&1", "Nginx version")
    
    # Create nginx config directory
    print("\nStep 3: Configure Nginx")
    run_cmd(client, "mkdir -p /etc/nginx/conf.d", "Create conf.d dir")
    
    # Write nginx config
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
    run_cmd(client, f"cat > /etc/nginx/conf.d/wechat-editor.conf << 'NGXEOF'\n{nginx_conf}\nNGXEOF", "Write nginx config")
    
    # Verify default config doesn't conflict (check default server block)
    run_cmd(client, "grep -n 'listen.*80' /etc/nginx/nginx.conf 2>/dev/null | head -3", "Check nginx.conf default server")
    
    # Comment out default server if needed
    run_cmd(client, "sed -i 's/^    listen       80;/    #listen       80;/' /etc/nginx/nginx.conf 2>/dev/null; sed -i 's/^    listen       \\[::\\]:80;/    #listen       [::]:80;/' /etc/nginx/nginx.conf 2>/dev/null; echo done", "Disable default server block")
    
    # Test config
    run_cmd(client, "nginx -t 2>&1", "Test nginx config")
    
    # Start nginx
    print("\nStep 4: Start Nginx")
    run_cmd(client, "systemctl enable nginx", "Enable on boot")
    run_cmd(client, "systemctl start nginx", "Start nginx")
    run_cmd(client, "systemctl status nginx 2>&1 | head -10", "Status")
    
    # Open firewall if needed
    print("\nStep 5: Configure firewall")
    run_cmd(client, "firewall-cmd --permanent --add-service=http 2>&1; firewall-cmd --reload 2>&1; echo done", "Open port 80")
    
    # Verify
    print("\nStep 6: Verify deployment")
    import time
    time.sleep(2)
    run_cmd(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost/ 2>&1", "Frontend HTTP status")
    run_cmd(client, "curl -s http://localhost:3000/api/health 2>&1", "Backend health")
    run_cmd(client, "curl -s http://localhost/ | head -5", "Frontend HTML preview")
    
    print("\n========================================")
    print("[+] Nginx installed and configured!")
    print("[+] Access: http://editor.ai2026.cloud")
    print("========================================")
    
finally:
    client.close()

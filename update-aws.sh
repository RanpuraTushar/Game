#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Updating Arcade Nexus on AWS..."
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure 2GB Swap Memory on t2.micro to prevent OOM crash during build
if [ ! -f /swapfile ] && [ $(free -m | awk '/^Swap:/ {print $2}') -eq 0 ]; then
    echo "⚙️ Creating 2GB Swap Memory..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Ensure Nginx (www-data) has permission to traverse home directory
sudo chmod 755 /home/ubuntu || true
sudo chmod 755 "$SCRIPT_DIR" || true

# 1. Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Rebuild Frontend
echo "🎨 Rebuilding Frontend..."
cd "$SCRIPT_DIR/client"
npm install
NODE_OPTIONS="--max-old-space-size=1536" npm run build
sudo chmod -R 755 "$SCRIPT_DIR/client/dist" || true

# 3. Update & Restart Backend
echo "🔧 Restarting Backend with PM2..."
cd "$SCRIPT_DIR/server"
npm install
pm2 restart game-backend || pm2 restart all

# 4. Reload Nginx
echo "🌐 Reloading Nginx..."
sudo nginx -t
sudo systemctl restart nginx

echo "=========================================="
echo "🎉 UPDATE COMPLETE! Changes are LIVE on AWS."
echo "=========================================="

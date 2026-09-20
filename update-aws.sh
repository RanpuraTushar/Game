#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Updating Arcade Nexus on AWS..."
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Rebuild Frontend
echo "🎨 Rebuilding Frontend..."
cd "$SCRIPT_DIR/client"
npm install
npm run build
sudo chmod -R 755 "$SCRIPT_DIR/client/dist" || true

# 3. Update & Restart Backend
echo "🔧 Restarting Backend with PM2..."
cd "$SCRIPT_DIR/server"
npm install
pm2 restart game-backend || pm2 restart all

# 4. Reload Nginx
echo "🌐 Reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "=========================================="
echo "🎉 UPDATE COMPLETE! Changes are LIVE on AWS."
echo "=========================================="

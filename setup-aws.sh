#!/bin/bash
set -e

echo "=========================================="
echo "🚀 ARCADE NEXUS - AWS Auto Deployer"
echo "=========================================="

# 1. Update & Prerequisites
echo "📦 Updating system & installing packages..."
sudo apt-get update -y
sudo apt-get install -y curl git nginx mysql-server

# 2. Setup 2GB Swap Memory (Crucial for t2.micro to prevent Out Of Memory during build)
if [ ! -f /swapfile ]; then
    echo "⚙️ Creating 2GB Swap..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 3. Install Node.js 20 & PM2
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# 4. Setup MySQL Database
echo "🗄️ Setting up MySQL..."
sudo systemctl start mysql
sudo mysql -e "CREATE DATABASE IF NOT EXISTS arcade_nexus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'gameuser'@'localhost' IDENTIFIED BY 'ArcadePass@2026';"
sudo mysql -e "ALTER USER 'gameuser'@'localhost' IDENTIFIED BY 'ArcadePass@2026';"
sudo mysql -e "GRANT ALL PRIVILEGES ON arcade_nexus.* TO 'gameuser'@'localhost'; FLUSH PRIVILEGES;"

# Import schema
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/database/schema.sql" ]; then
    echo "📥 Importing database schema..."
    sudo mysql -u gameuser -p'ArcadePass@2026' arcade_nexus < "$SCRIPT_DIR/database/schema.sql" || true
fi

# 5. Backend Setup
echo "🔧 Setting up Backend..."
cd "$SCRIPT_DIR/server"
cat <<EOF > .env
PORT=3001
DB_HOST=localhost
DB_USER=gameuser
DB_PASSWORD=ArcadePass@2026
DB_NAME=arcade_nexus
JWT_SECRET=super_secret_neon_production_key_998811
EOF

npm install
pm2 delete game-backend 2>/dev/null || true
pm2 start src/server.js --name "game-backend"
pm2 save

# 6. Frontend Build
echo "🎨 Building Frontend..."
cd "$SCRIPT_DIR/client"
npm install
npm run build

# 7. Configure Nginx & Permissions
echo "🌐 Configuring Nginx & Permissions..."
PUBLIC_IP=$(curl -s ifconfig.me || echo "localhost")
sudo chmod 755 /home/ubuntu || true
sudo chmod -R 755 "$SCRIPT_DIR/client/dist" || true

sudo bash -c "cat <<EOF > /etc/nginx/sites-available/game
server {
    listen 80 default_server;
    server_name _;

    root $SCRIPT_DIR/client/dist;
    index index.html;

    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF"

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. PM2 system startup hook
pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null || true

echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Game is LIVE at: http://$PUBLIC_IP"
echo "=========================================="

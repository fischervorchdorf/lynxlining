#!/bin/bash
# LYNX Lining - Server Setup Script
# Hetzner Cloud CX22 (Ubuntu 24.04)
# -----------------------------------

set -e

echo "=== LYNX Lining Server Setup ==="

# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 global installieren
sudo npm install -g pm2

# Nginx installieren
sudo apt install -y nginx

# Certbot (Let's Encrypt) installieren
sudo apt install -y certbot python3-certbot-nginx

# Projektverzeichnis
sudo mkdir -p /var/www/lynx-lining
sudo chown -R $USER:$USER /var/www/lynx-lining

# Log-Verzeichnis
sudo mkdir -p /var/log/lynx-lining
sudo chown -R $USER:$USER /var/log/lynx-lining

echo ""
echo "=== Nächste Schritte ==="
echo "1. Projekt nach /var/www/lynx-lining klonen oder kopieren"
echo "2. cd /var/www/lynx-lining && npm install --production"
echo "3. .env Datei erstellen: cp .env.example .env && nano .env"
echo "4. Nginx-Config kopieren:"
echo "   sudo mkdir -p /etc/nginx/snippets"
echo "   sudo cp deploy/lynx-proxy.conf /etc/nginx/snippets/lynx-proxy.conf"
echo "   sudo cp deploy/nginx.conf /etc/nginx/sites-available/lynx-lining"
echo "   sudo ln -s /etc/nginx/sites-available/lynx-lining /etc/nginx/sites-enabled/"
echo "   sudo rm /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo "5. SSL-Zertifikat holen:"
echo "   sudo certbot --nginx -d lynx-lining.com -d www.lynx-lining.com"
echo "6. App mit PM2 starten:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo "7. Tailwind CSS bauen: npm run css:build"
echo ""
echo "Setup abgeschlossen!"

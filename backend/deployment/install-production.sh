#!/bin/bash

# Production Server Installation Script for Tic-Tac-Toe Application
# This script sets up a fresh Ubuntu/Debian server for deployment

set -e

echo "========================================="
echo "Tic-Tac-Toe Production Server Setup"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Get domain name from user
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
read -p "Enter your email for SSL certificate: " SSL_EMAIL

if [ -z "$DOMAIN_NAME" ] || [ -z "$SSL_EMAIL" ]; then
    print_error "Domain name and email are required"
    exit 1
fi

print_status "Starting installation for domain: $DOMAIN_NAME"

# Update system
print_status "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js $NODE_VERSION installed"
print_status "npm $NPM_VERSION installed"

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
apt-get install -y nginx

# Install Certbot for SSL
print_status "Installing Certbot for SSL certificates..."
apt-get install -y certbot python3-certbot-nginx

# Install Git
print_status "Installing Git..."
apt-get install -y git

# Create application user
print_status "Creating application user 'tictactoe'..."
if id "tictactoe" &>/dev/null; then
    print_warning "User 'tictactoe' already exists"
else
    useradd -m -s /bin/bash tictactoe
    print_status "User 'tictactoe' created"
fi

# Create application directories
print_status "Creating application directories..."
mkdir -p /var/www/tictactoe/frontend
mkdir -p /var/www/tictactoe/backend
mkdir -p /var/www/certbot
mkdir -p /var/log/tictactoe

# Set ownership
chown -R tictactoe:tictactoe /var/www/tictactoe
chown -R tictactoe:tictactoe /var/log/tictactoe

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
print_status "Firewall configured (SSH, HTTP, HTTPS)"

# Stop default Nginx site
print_status "Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default

# Create temporary Nginx config for SSL certificate
cat > /etc/nginx/sites-available/tictactoe << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Server setup in progress';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tictactoe /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Obtain SSL certificate
print_status "Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --nginx \
    --non-interactive \
    --agree-tos \
    --email "$SSL_EMAIL" \
    -d "$DOMAIN_NAME" \
    -d "www.$DOMAIN_NAME"

if [ $? -eq 0 ]; then
    print_status "SSL certificate obtained successfully"
else
    print_error "Failed to obtain SSL certificate"
    print_warning "You may need to configure DNS first and run: certbot certonly --nginx -d $DOMAIN_NAME"
fi

# Setup PM2 startup script
print_status "Configuring PM2 startup..."
su - tictactoe -c "pm2 startup systemd -u tictactoe --hp /home/tictactoe" | grep -v "^$" | tail -n 1 > /tmp/pm2-startup.sh
chmod +x /tmp/pm2-startup.sh
/tmp/pm2-startup.sh
rm /tmp/pm2-startup.sh

# Setup log rotation for PM2
print_status "Installing PM2 log rotation..."
su - tictactoe -c "pm2 install pm2-logrotate"
su - tictactoe -c "pm2 set pm2-logrotate:max_size 10M"
su - tictactoe -c "pm2 set pm2-logrotate:retain 7"

# Create deployment directory structure
print_status "Creating deployment directory structure..."
su - tictactoe -c "mkdir -p ~/deployments"
su - tictactoe -c "mkdir -p ~/backups"

# Create environment file template
print_status "Creating environment file template..."
cat > /var/www/tictactoe/backend/.env.example << EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN_NAME

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000

# Room Configuration
MAX_ROOMS=1000
ROOM_CLEANUP_INTERVAL=300000
INACTIVE_ROOM_TIMEOUT=1800000
EOF

chown tictactoe:tictactoe /var/www/tictactoe/backend/.env.example

print_status "Creating production environment file..."
cp /var/www/tictactoe/backend/.env.example /var/www/tictactoe/backend/.env
chown tictactoe:tictactoe /var/www/tictactoe/backend/.env

# Setup Nginx log rotation
print_status "Configuring Nginx log rotation..."
cat > /etc/logrotate.d/tictactoe << EOF
/var/log/nginx/tictactoe-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

# Create deployment info file
cat > /var/www/tictactoe/deployment-info.txt << EOF
Deployment Information
=====================
Domain: $DOMAIN_NAME
SSL Email: $SSL_EMAIL
Installation Date: $(date)
Node.js Version: $NODE_VERSION
npm Version: $NPM_VERSION
PM2 Version: $(pm2 --version)
Nginx Version: $(nginx -v 2>&1 | cut -d'/' -f2)

Directory Structure:
- Application: /var/www/tictactoe
- Frontend: /var/www/tictactoe/frontend
- Backend: /var/www/tictactoe/backend
- Logs: /var/log/tictactoe
- Backups: /home/tictactoe/backups
- Deployments: /home/tictactoe/deployments

User: tictactoe
EOF

chown tictactoe:tictactoe /var/www/tictactoe/deployment-info.txt

echo ""
echo "========================================="
print_status "Installation completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Update DNS records to point to this server"
echo "2. Copy your application code to /var/www/tictactoe/"
echo "3. Update /var/www/tictactoe/backend/.env with your configuration"
echo "4. Deploy using the deploy.sh script"
echo ""
echo "Useful commands:"
echo "  - Switch to app user: sudo su - tictactoe"
echo "  - View PM2 processes: pm2 list"
echo "  - View PM2 logs: pm2 logs"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo "  - View Nginx logs: sudo tail -f /var/log/nginx/tictactoe-*.log"
echo ""
print_warning "Remember to update the Nginx configuration with the final version after deployment"
echo ""

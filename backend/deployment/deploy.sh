#!/bin/bash

set -e

echo "🚀 Starting deployment process..."

# Configuration
APP_NAME="tictactoe-api"
APP_DIR="/opt/tictactoe-backend"
REPO_URL="${REPO_URL:-https://github.com/yourusername/tictactoe.git}"
BRANCH="${BRANCH:-main}"
NODE_VERSION="${NODE_VERSION:-18}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root or with sudo"
    exit 1
fi

# Step 1: Install system dependencies
log_info "Installing system dependencies..."
apt-get update
apt-get install -y curl git build-essential

# Step 2: Install Node.js if not present
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
else
    log_info "Node.js already installed: $(node --version)"
fi

# Step 3: Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    npm install -g pm2
else
    log_info "PM2 already installed: $(pm2 --version)"
fi

# Step 4: Create application directory
log_info "Setting up application directory..."
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/logs

# Step 5: Clone or update repository
if [ -d "${APP_DIR}/.git" ]; then
    log_info "Updating existing repository..."
    cd ${APP_DIR}
    git fetch origin
    git reset --hard origin/${BRANCH}
else
    log_info "Cloning repository..."
    git clone -b ${BRANCH} ${REPO_URL} ${APP_DIR}
    cd ${APP_DIR}
fi

# Step 6: Navigate to backend directory
cd ${APP_DIR}/backend

# Step 7: Install dependencies
log_info "Installing dependencies..."
npm ci --production=false

# Step 8: Run tests
log_info "Running tests..."
npm test || {
    log_error "Tests failed! Deployment aborted."
    exit 1
}

# Step 9: Build application
log_info "Building application..."
npm run build

# Step 10: Setup environment file
if [ ! -f ".env" ]; then
    log_warn ".env file not found. Creating from .env.example..."
    cp .env.example .env
    log_warn "Please update .env file with production values!"
fi

# Step 11: Install production dependencies only
log_info "Installing production dependencies..."
npm ci --production

# Step 12: Setup PM2
log_info "Configuring PM2..."
pm2 delete ${APP_NAME} 2>/dev/null || true
pm2 start deployment/ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

# Step 13: Setup systemd service
log_info "Setting up systemd service..."
cat > /etc/systemd/system/${APP_NAME}.service << EOF
[Unit]
Description=Tic-Tac-Toe API Server
After=network.target

[Service]
Type=forking
User=root
WorkingDirectory=${APP_DIR}/backend
ExecStart=/usr/bin/pm2 start deployment/ecosystem.config.js --no-daemon
ExecReload=/usr/bin/pm2 reload deployment/ecosystem.config.js
ExecStop=/usr/bin/pm2 stop deployment/ecosystem.config.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${APP_NAME}
systemctl restart ${APP_NAME}

# Step 14: Verify deployment
log_info "Verifying deployment..."
sleep 5

if pm2 list | grep -q "${APP_NAME}.*online"; then
    log_info "✅ Deployment successful!"
    log_info "Application is running on port 3000"
    log_info "PM2 status:"
    pm2 list
    log_info ""
    log_info "Useful commands:"
    log_info "  - View logs: pm2 logs ${APP_NAME}"
    log_info "  - Monitor: pm2 monit"
    log_info "  - Restart: pm2 restart ${APP_NAME}"
    log_info "  - Stop: pm2 stop ${APP_NAME}"
else
    log_error "Deployment verification failed!"
    log_error "Check logs with: pm2 logs ${APP_NAME}"
    exit 1
fi

log_info "🎉 Deployment complete!"

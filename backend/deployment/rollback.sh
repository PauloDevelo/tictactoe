#!/bin/bash

set -e

# Configuration
APP_NAME="tictactoe-api"
APP_DIR="/opt/tictactoe-backend"
BACKUP_DIR="${APP_DIR}/backups"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory not found: $BACKUP_DIR"
    log_error "No backups available for rollback"
    exit 1
fi

# List available backups
log_info "Available backups:"
backups=($(ls -t "$BACKUP_DIR" 2>/dev/null || echo ""))

if [ ${#backups[@]} -eq 0 ]; then
    log_error "No backups found in $BACKUP_DIR"
    exit 1
fi

# Display backups with numbers
for i in "${!backups[@]}"; do
    echo "  $((i+1)). ${backups[$i]}"
done

# Get user selection
if [ -z "$1" ]; then
    echo ""
    read -p "Select backup to restore (1-${#backups[@]}): " selection
else
    selection=$1
fi

# Validate selection
if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backups[@]} ]; then
    log_error "Invalid selection"
    exit 1
fi

selected_backup="${backups[$((selection-1))]}"
backup_path="${BACKUP_DIR}/${selected_backup}"

log_warn "⚠️  You are about to rollback to: $selected_backup"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Rollback cancelled"
    exit 0
fi

log_info "Starting rollback process..."

# Stop the application
log_info "Stopping application..."
pm2 stop ${APP_NAME} || true

# Create a backup of current state before rollback
current_backup="${BACKUP_DIR}/pre-rollback-$(date +%Y%m%d-%H%M%S).tar.gz"
log_info "Creating backup of current state..."
cd ${APP_DIR}
tar -czf "$current_backup" \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='backups' \
    backend/ || log_warn "Failed to create pre-rollback backup"

# Restore from selected backup
log_info "Restoring from backup: $selected_backup"
cd ${APP_DIR}
tar -xzf "$backup_path"

# Navigate to backend directory
cd ${APP_DIR}/backend

# Install dependencies
log_info "Installing dependencies..."
npm ci --production

# Restart application
log_info "Restarting application..."
pm2 restart ${APP_NAME}

# Wait for application to start
sleep 5

# Verify rollback
log_info "Verifying rollback..."
if pm2 list | grep -q "${APP_NAME}.*online"; then
    log_info "✅ Rollback successful!"
    log_info "Application restored to: $selected_backup"
    log_info "Current state backed up to: $current_backup"
    
    # Run health check if available
    if [ -f "${APP_DIR}/backend/deployment/health-check.sh" ]; then
        log_info "Running health check..."
        bash "${APP_DIR}/backend/deployment/health-check.sh" || log_warn "Health check failed"
    fi
else
    log_error "Rollback verification failed!"
    log_error "Application is not running. Check logs with: pm2 logs ${APP_NAME}"
    exit 1
fi

log_info "🎉 Rollback complete!"

#!/bin/bash

set -e

# Configuration
APP_DIR="/opt/tictactoe-backend"
BACKUP_DIR="${APP_DIR}/backups"
MAX_BACKUPS="${MAX_BACKUPS:-10}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="backup-${TIMESTAMP}.tar.gz"

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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "Starting backup process..."
log_info "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup
cd ${APP_DIR}
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='backups' \
    backend/

if [ $? -eq 0 ]; then
    backup_size=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
    log_info "✅ Backup created successfully (${backup_size})"
else
    log_error "Backup failed!"
    exit 1
fi

# Clean up old backups
log_info "Cleaning up old backups (keeping last ${MAX_BACKUPS})..."
backup_count=$(ls -1 "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | wc -l)

if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
    files_to_delete=$((backup_count - MAX_BACKUPS))
    log_info "Removing ${files_to_delete} old backup(s)..."
    
    ls -t "$BACKUP_DIR"/backup-*.tar.gz | tail -n "$files_to_delete" | while read -r file; do
        log_info "Deleting: $(basename "$file")"
        rm -f "$file"
    done
fi

# Display backup summary
log_info "Backup Summary:"
log_info "  Total backups: $(ls -1 "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | wc -l)"
log_info "  Disk usage: $(du -sh "$BACKUP_DIR" | cut -f1)"
log_info ""
log_info "Recent backups:"
ls -lht "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | head -n 5 | awk '{print "  " $9 " (" $5 ")"}'

log_info "🎉 Backup complete!"

#!/bin/bash

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3021}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/health}"
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_DELAY="${RETRY_DELAY:-5}"

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

# Function to check health endpoint
check_health() {
    local url="${API_URL}${HEALTH_ENDPOINT}"
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" "${url}" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Function to check PM2 status
check_pm2() {
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "tictactoe-api.*online"; then
            return 0
        fi
    fi
    return 1
}

# Function to check system resources
check_resources() {
    local cpu_usage
    local mem_usage
    local disk_usage
    
    # CPU usage (average over 1 minute)
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    
    # Memory usage
    mem_usage=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')
    
    # Disk usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    log_info "System Resources:"
    log_info "  CPU Usage: ${cpu_usage}%"
    log_info "  Memory Usage: ${mem_usage}%"
    log_info "  Disk Usage: ${disk_usage}%"
    
    # Warning thresholds
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_warn "High CPU usage detected!"
    fi
    
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        log_warn "High memory usage detected!"
    fi
    
    if [ "$disk_usage" -gt 80 ]; then
        log_warn "High disk usage detected!"
    fi
}

# Main health check
log_info "Starting health check for Tic-Tac-Toe API..."
log_info "Target: ${API_URL}${HEALTH_ENDPOINT}"

# Check PM2 status
log_info "Checking PM2 status..."
if check_pm2; then
    log_info "✅ PM2 process is running"
else
    log_error "❌ PM2 process is not running"
    exit 1
fi

# Check health endpoint with retries
log_info "Checking health endpoint..."
retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    if check_health; then
        log_info "✅ Health endpoint is responding"
        break
    else
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log_warn "Health check failed (attempt $retry_count/$MAX_RETRIES). Retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        else
            log_error "❌ Health endpoint is not responding after $MAX_RETRIES attempts"
            exit 1
        fi
    fi
done

# Check system resources
check_resources

# Check application logs for errors
log_info "Checking recent logs for errors..."
if command -v pm2 &> /dev/null; then
    error_count=$(pm2 logs tictactoe-api --lines 100 --nostream 2>/dev/null | grep -i "error" | wc -l || echo "0")
    if [ "$error_count" -gt 0 ]; then
        log_warn "Found ${error_count} error(s) in recent logs"
    else
        log_info "✅ No errors in recent logs"
    fi
fi

log_info "🎉 Health check completed successfully!"
exit 0

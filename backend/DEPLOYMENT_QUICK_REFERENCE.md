# Deployment Quick Reference

Quick commands and configurations for common deployment tasks.

## Quick Start

### First Time Deployment

```bash
# 1. Clone repository
git clone https://github.com/yourusername/tictactoe.git /opt/tictactoe-backend
cd /opt/tictactoe-backend/backend

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Run automated deployment
sudo bash deployment/deploy.sh
```

### Update Existing Deployment

```bash
cd /opt/tictactoe-backend/backend
sudo bash deployment/deploy.sh
```

## Common Commands

### PM2 Management

```bash
# Start application
pm2 start deployment/ecosystem.config.js

# Stop application
pm2 stop tictactoe-api

# Restart application
pm2 restart tictactoe-api

# Reload (zero-downtime)
pm2 reload tictactoe-api

# View status
pm2 list

# View logs
pm2 logs tictactoe-api

# Monitor
pm2 monit

# Save configuration
pm2 save

# Setup startup script
pm2 startup systemd
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View access logs
sudo tail -f /var/log/nginx/tictactoe-access.log

# View error logs
sudo tail -f /var/log/nginx/tictactoe-error.log
```

### Systemd Service

```bash
# Start service
sudo systemctl start tictactoe-api

# Stop service
sudo systemctl stop tictactoe-api

# Restart service
sudo systemctl restart tictactoe-api

# Check status
sudo systemctl status tictactoe-api

# Enable on boot
sudo systemctl enable tictactoe-api

# Disable on boot
sudo systemctl disable tictactoe-api

# View logs
sudo journalctl -u tictactoe-api -f
```

### Docker Commands

```bash
# Build image
docker build -t tictactoe-api .

# Run container
docker run -p 3021:3021 --env-file .env tictactoe-api

# Docker Compose - Start
docker-compose up -d

# Docker Compose - Stop
docker-compose down

# Docker Compose - View logs
docker-compose logs -f

# Docker Compose - Rebuild
docker-compose up -d --build

# Execute command in container
docker-compose exec api sh
```

### Maintenance Scripts

```bash
# Create backup
sudo bash deployment/backup.sh

# Rollback to previous version
sudo bash deployment/rollback.sh

# Health check
bash deployment/health-check.sh
```

### Git Operations

```bash
# Pull latest changes
git pull origin main

# Check current branch
git branch

# View recent commits
git log --oneline -10

# Reset to specific commit
git reset --hard <commit-hash>
```

### NPM Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Run tests
npm test

# Test with coverage
npm run test:coverage

# Deployment scripts
npm run deploy
npm run health-check
npm run backup
npm run rollback

# Docker scripts
npm run docker:build
npm run docker:run
npm run docker:compose:up
npm run docker:compose:down
```

## Configuration Files

### Environment Variables (.env)

```env
NODE_ENV=production
PORT=3021
CORS_ORIGIN=https://your-domain.com
```

### PM2 Ecosystem (deployment/ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'tictactoe-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3021,
    }
  }]
};
```

### Nginx Configuration

Location: `/etc/nginx/sites-available/tictactoe`

Key sections:
- HTTP → HTTPS redirect
- SSL configuration
- WebSocket proxy
- API proxy
- Rate limiting

## Health Checks

### Manual Health Check

```bash
# Local
curl http://localhost:3021/health

# Remote
curl https://your-domain.com/health

# With details
curl -v http://localhost:3021/health
```

### Automated Health Check

```bash
bash deployment/health-check.sh
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 status
pm2 list

# View error logs
pm2 logs tictactoe-api --err

# Check if port is in use
sudo lsof -i :3021

# Kill process on port
sudo kill -9 $(sudo lsof -t -i:3021)
```

### High Memory Usage

```bash
# Check memory
free -h

# Check PM2 memory
pm2 list

# Restart application
pm2 restart tictactoe-api
```

### WebSocket Issues

```bash
# Check Nginx WebSocket config
grep -A 10 "location /socket.io/" /etc/nginx/sites-available/tictactoe

# Test WebSocket
wscat -c ws://localhost:3021/socket.io/

# Check firewall
sudo ufw status
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## Monitoring

### System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Disk I/O
iostat

# Network
netstat -tuln
```

### Application Metrics

```bash
# PM2 monitoring
pm2 monit

# PM2 metrics
pm2 describe tictactoe-api

# Application logs
pm2 logs tictactoe-api --lines 100
```

### Log Analysis

```bash
# Count errors in logs
pm2 logs tictactoe-api --lines 1000 | grep -i error | wc -l

# Find specific error
pm2 logs tictactoe-api | grep "specific error"

# Nginx access log analysis
sudo tail -1000 /var/log/nginx/tictactoe-access.log | awk '{print $9}' | sort | uniq -c
```

## Backup and Restore

### Create Backup

```bash
sudo bash deployment/backup.sh
```

Backups stored in: `/opt/tictactoe-backend/backups/`

### List Backups

```bash
ls -lht /opt/tictactoe-backend/backups/
```

### Restore Backup

```bash
sudo bash deployment/rollback.sh
# Select backup from list
```

## Security

### Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Firewall

```bash
# Check status
sudo ufw status

# Allow ports
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### SSL Certificate

```bash
# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Performance Optimization

### PM2 Cluster Mode

Already configured in `ecosystem.config.js`:
- Uses all CPU cores
- Automatic load balancing
- Zero-downtime reloads

### Nginx Optimization

- Gzip compression enabled
- Connection keep-alive
- Rate limiting
- Proxy buffering

## Emergency Procedures

### Complete Service Restart

```bash
# Stop everything
pm2 stop all
sudo systemctl stop nginx

# Start everything
sudo systemctl start nginx
pm2 start deployment/ecosystem.config.js
```

### Emergency Rollback

```bash
# Stop current version
pm2 stop tictactoe-api

# Rollback
sudo bash deployment/rollback.sh

# Verify
bash deployment/health-check.sh
```

### Clear All Logs

```bash
# PM2 logs
pm2 flush

# Nginx logs
sudo truncate -s 0 /var/log/nginx/tictactoe-access.log
sudo truncate -s 0 /var/log/nginx/tictactoe-error.log
```

## Useful Aliases

Add to `~/.bashrc`:

```bash
alias pm2-status='pm2 list'
alias pm2-logs='pm2 logs tictactoe-api'
alias pm2-restart='pm2 restart tictactoe-api'
alias nginx-reload='sudo systemctl reload nginx'
alias nginx-test='sudo nginx -t'
alias app-health='curl http://localhost:3021/health'
alias app-deploy='cd /opt/tictactoe-backend/backend && sudo bash deployment/deploy.sh'
```

## Support

- **Documentation**: See DEPLOYMENT.md for detailed guide
- **API Docs**: See REST_API.md and WEBSOCKET_API.md
- **Issues**: https://github.com/yourusername/tictactoe/issues

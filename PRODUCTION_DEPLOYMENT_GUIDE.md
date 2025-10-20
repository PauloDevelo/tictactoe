# Production Deployment Guide

Complete guide for deploying the Tic-Tac-Toe application to a production server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Initial Installation](#initial-installation)
4. [Application Deployment](#application-deployment)
5. [SSL Configuration](#ssl-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 20.04 LTS or later (or Debian 11+)
- **RAM**: Minimum 1GB (2GB recommended)
- **CPU**: 1 core minimum (2 cores recommended)
- **Storage**: 20GB minimum
- **Network**: Public IP address with ports 80 and 443 accessible

### Domain Configuration

- Domain name registered and DNS configured
- A record pointing to your server's IP address
- Optional: AAAA record for IPv6

### Local Requirements

- Git installed
- SSH access to the server
- Node.js 18+ installed locally (for building frontend)

## Server Setup

### Step 1: Initial Server Access

```bash
# Connect to your server
ssh root@your-server-ip

# Update system
apt-get update
apt-get upgrade -y
```

### Step 2: Run Installation Script

```bash
# Download the installation script
wget https://raw.githubusercontent.com/your-repo/tictactoe/main/backend/deployment/install-production.sh

# Make it executable
chmod +x install-production.sh

# Run the installation
sudo ./install-production.sh
```

The script will prompt for:
- **Domain name**: Your production domain (e.g., `tictactoe.example.com`)
- **Email**: For SSL certificate notifications

### What the Installation Script Does

1. ✅ Installs Node.js 20.x
2. ✅ Installs PM2 process manager
3. ✅ Installs and configures Nginx
4. ✅ Installs Certbot for SSL certificates
5. ✅ Creates application user (`tictactoe`)
6. ✅ Sets up directory structure
7. ✅ Configures firewall (UFW)
8. ✅ Obtains SSL certificate from Let's Encrypt
9. ✅ Configures PM2 startup script
10. ✅ Sets up log rotation

### Step 3: Verify Installation

```bash
# Check Node.js
node --version  # Should show v20.x.x

# Check PM2
pm2 --version

# Check Nginx
nginx -v

# Check SSL certificate
certbot certificates
```

## Application Deployment

### Backend Deployment

#### 1. Prepare Backend Code

On your local machine:

```bash
cd backend

# Ensure all dependencies are listed
npm install

# Run tests
npm test

# Create deployment package
tar -czf backend-deploy.tar.gz \
  src/ \
  package.json \
  package-lock.json \
  tsconfig.json \
  deployment/
```

#### 2. Upload to Server

```bash
# Upload backend code
scp backend-deploy.tar.gz tictactoe@your-server.com:~/deployments/

# Upload deployment scripts
scp deployment/*.sh tictactoe@your-server.com:~/deployments/
```

#### 3. Deploy Backend

```bash
# SSH to server as tictactoe user
ssh tictactoe@your-server.com

# Extract backend code
cd ~/deployments
tar -xzf backend-deploy.tar.gz -C /var/www/tictactoe/backend/

# Install dependencies
cd /var/www/tictactoe/backend
npm ci --production

# Build TypeScript
npm run build

# Configure environment
cp .env.example .env
nano .env  # Edit with your production values
```

#### 4. Configure Environment Variables

Edit `/var/www/tictactoe/backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

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
```

#### 5. Start Backend with PM2

```bash
cd /var/www/tictactoe/backend

# Copy PM2 ecosystem config
cp deployment/ecosystem.config.js .

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Verify it's running
pm2 list
pm2 logs tictactoe-api
```

### Frontend Deployment

#### 1. Build and Deploy Frontend

On your local machine:

```bash
cd unicorn-tictactoe

# Make build script executable
chmod +x build-and-deploy.sh

# Run build and deploy
./build-and-deploy.sh
```

The script will prompt for:
- **Production URL**: Your domain with protocol (e.g., `https://tictactoe.example.com`)
- **Server host**: SSH connection string (e.g., `tictactoe@your-server.com`)

The script will:
1. Update production environment configuration
2. Run tests
3. Build optimized production bundle
4. Create deployment package
5. Upload to server
6. Deploy and set permissions
7. Create backup of previous version

#### 2. Verify Frontend Deployment

```bash
# SSH to server
ssh tictactoe@your-server.com

# Check frontend files
ls -la /var/www/tictactoe/frontend/

# Should see: index.html, *.js, *.css, assets/
```

### Nginx Configuration

#### 1. Update Nginx Configuration

```bash
# SSH to server as root or with sudo
ssh root@your-server.com

# Copy the production nginx config
sudo cp /var/www/tictactoe/backend/deployment/nginx.conf /etc/nginx/sites-available/tictactoe

# Update domain name in config
sudo nano /etc/nginx/sites-available/tictactoe
# Replace 'your-domain.com' with your actual domain

# Enable the site
sudo ln -sf /etc/nginx/sites-available/tictactoe /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 2. Verify Nginx Configuration

```bash
# Check Nginx status
sudo systemctl status nginx

# Test endpoints
curl http://localhost:3000/health  # Backend health check
curl https://your-domain.com/health  # Through Nginx
```

## SSL Configuration

### Automatic Renewal

Certbot automatically sets up renewal. Verify it:

```bash
# Test renewal process
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### Manual Renewal

If needed:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

## Monitoring and Maintenance

### PM2 Monitoring

```bash
# View all processes
pm2 list

# View logs
pm2 logs tictactoe-api

# View specific log
pm2 logs tictactoe-api --lines 100

# Monitor resources
pm2 monit

# View process details
pm2 show tictactoe-api
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/tictactoe-access.log

# Error logs
sudo tail -f /var/log/nginx/tictactoe-error.log

# Search for errors
sudo grep "error" /var/log/nginx/tictactoe-error.log
```

### Application Logs

```bash
# PM2 logs location
ls ~/.pm2/logs/

# View application logs
tail -f ~/.pm2/logs/tictactoe-api-out.log
tail -f ~/.pm2/logs/tictactoe-api-error.log
```

### Health Checks

```bash
# Backend health
curl https://your-domain.com/health

# Check WebSocket
# Use browser console:
# const socket = io('https://your-domain.com');
# socket.on('connect', () => console.log('Connected'));
```

### Automated Deployment Script

Use the provided deployment script for updates:

```bash
# On server as tictactoe user
cd /var/www/tictactoe/backend
./deployment/deploy.sh
```

This script:
- Creates backup
- Pulls latest code
- Installs dependencies
- Runs tests
- Builds application
- Performs zero-downtime reload

### Backup Strategy

```bash
# Manual backup
cd /var/www/tictactoe/backend
./deployment/backup.sh

# Backups are stored in ~/backups/
ls -lh ~/backups/

# Restore from backup
./deployment/rollback.sh
```

### Update Process

1. **Test locally first**
2. **Create backup** (automatic with deploy.sh)
3. **Deploy new version**
4. **Monitor logs** for errors
5. **Test functionality**
6. **Rollback if needed**

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs tictactoe-api --err

# Check if port is in use
sudo netstat -tlnp | grep 3000

# Restart application
pm2 restart tictactoe-api

# Check environment variables
pm2 env 0
```

### Frontend Not Loading

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/tictactoe-error.log

# Verify files exist
ls -la /var/www/tictactoe/frontend/

# Check permissions
sudo chown -R tictactoe:tictactoe /var/www/tictactoe/frontend
sudo chmod -R 755 /var/www/tictactoe/frontend

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### WebSocket Connection Issues

```bash
# Check if backend is running
pm2 list

# Check Nginx WebSocket configuration
sudo nginx -T | grep -A 10 "location /socket.io"

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: your-domain.com" \
  -H "Origin: https://your-domain.com" \
  https://your-domain.com/socket.io/

# Check firewall
sudo ufw status
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Check certificate expiry
echo | openssl s_client -servername your-domain.com \
  -connect your-domain.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### High Memory Usage

```bash
# Check PM2 memory usage
pm2 list

# Restart application
pm2 restart tictactoe-api

# Check system memory
free -h

# Check for memory leaks in logs
pm2 logs tictactoe-api | grep -i "memory"
```

### Performance Issues

```bash
# Enable PM2 monitoring
pm2 install pm2-server-monit

# Check Nginx access logs for slow requests
sudo tail -f /var/log/nginx/tictactoe-access.log

# Monitor system resources
htop

# Check disk space
df -h
```

### Rollback Procedure

```bash
# List available backups
ls -lh ~/backups/

# Rollback to previous version
cd /var/www/tictactoe/backend
./deployment/rollback.sh

# Or manually:
# 1. Stop application
pm2 stop tictactoe-api

# 2. Restore backup
cp -r ~/backups/backend_backup_TIMESTAMP/* /var/www/tictactoe/backend/

# 3. Restart application
pm2 restart tictactoe-api
```

## Security Best Practices

### 1. Keep System Updated

```bash
# Regular updates
sudo apt-get update
sudo apt-get upgrade -y

# Security updates
sudo unattended-upgrades
```

### 2. Configure Firewall

```bash
# Check firewall status
sudo ufw status

# Only allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

### 3. Secure SSH

Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

### 4. Monitor Logs

```bash
# Check for suspicious activity
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/nginx/tictactoe-access.log
```

### 5. Rate Limiting

Already configured in Nginx:
- API: 10 requests/second
- WebSocket: 5 requests/second
- Static files: 50 requests/second

### 6. Regular Backups

```bash
# Setup automated backups with cron
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/tictactoe/backend/deployment/backup.sh
```

## Performance Optimization

### 1. PM2 Cluster Mode

Already configured in `ecosystem.config.js`:
- Runs 2 instances (or max CPUs)
- Load balancing across instances
- Zero-downtime reloads

### 2. Nginx Caching

Already configured:
- Static assets cached for 1 year
- Gzip compression enabled
- HTTP/2 enabled

### 3. Database Optimization

Currently using in-memory storage. For production with persistence:
- Consider Redis for session storage
- Implement database connection pooling
- Add caching layer

## Maintenance Schedule

### Daily
- ✅ Check PM2 process status
- ✅ Review error logs
- ✅ Monitor disk space

### Weekly
- ✅ Review access logs for anomalies
- ✅ Check SSL certificate expiry
- ✅ Verify backups are working

### Monthly
- ✅ Update system packages
- ✅ Update Node.js dependencies
- ✅ Review and rotate logs
- ✅ Performance analysis

## Support and Resources

### Useful Commands Reference

```bash
# PM2
pm2 list                    # List all processes
pm2 logs                    # View logs
pm2 restart all             # Restart all processes
pm2 stop all                # Stop all processes
pm2 delete all              # Delete all processes
pm2 save                    # Save process list
pm2 resurrect               # Restore saved processes

# Nginx
sudo nginx -t               # Test configuration
sudo systemctl reload nginx # Reload configuration
sudo systemctl restart nginx # Restart Nginx
sudo systemctl status nginx # Check status

# Certbot
sudo certbot renew          # Renew certificates
sudo certbot certificates   # List certificates
sudo certbot delete         # Delete certificate

# System
sudo systemctl status       # Check all services
df -h                       # Disk usage
free -h                     # Memory usage
htop                        # Process monitor
```

### Log Locations

- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Access**: `/var/log/nginx/tictactoe-access.log`
- **Nginx Error**: `/var/log/nginx/tictactoe-error.log`
- **System**: `/var/log/syslog`
- **Auth**: `/var/log/auth.log`

### Configuration Files

- **Nginx**: `/etc/nginx/sites-available/tictactoe`
- **PM2**: `/var/www/tictactoe/backend/ecosystem.config.js`
- **Environment**: `/var/www/tictactoe/backend/.env`
- **SSL**: `/etc/letsencrypt/live/your-domain.com/`

## Conclusion

This guide covers the complete production deployment process. For additional help:

1. Check the troubleshooting section
2. Review application logs
3. Consult the API documentation (REST_API.md, WEBSOCKET_API.md)
4. Check PM2 documentation: https://pm2.keymetrics.io/
5. Check Nginx documentation: https://nginx.org/en/docs/

Remember to always test changes in a staging environment before deploying to production!

# Deployment Guide

This guide covers deploying the Tic-Tac-Toe API to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
  - [Traditional Server Deployment](#traditional-server-deployment)
  - [Docker Deployment](#docker-deployment)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04 LTS or later (recommended)
- **Node.js**: v18.x or later
- **Memory**: Minimum 1GB RAM (2GB+ recommended)
- **Disk**: Minimum 10GB free space
- **Network**: Open ports 80 (HTTP) and 443 (HTTPS)

### Required Software

- Git
- Node.js and npm
- PM2 (for process management)
- Nginx (for reverse proxy)
- Certbot (for SSL certificates)

## Deployment Methods

### Traditional Server Deployment

#### 1. Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/tictactoe-backend
sudo chown $USER:$USER /opt/tictactoe-backend

# Clone repository
git clone https://github.com/yourusername/tictactoe.git /opt/tictactoe-backend
cd /opt/tictactoe-backend/backend
```

#### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:
```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com
```

#### 4. Install Dependencies and Build

```bash
# Install dependencies
npm ci --production=false

# Run tests
npm test

# Build application
npm run build

# Install production dependencies only
npm ci --production
```

#### 5. Setup PM2

```bash
# Start application with PM2
pm2 start deployment/ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

#### 6. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp deployment/nginx.conf /etc/nginx/sites-available/tictactoe

# Update domain name in configuration
sudo nano /etc/nginx/sites-available/tictactoe

# Enable site
sudo ln -s /etc/nginx/sites-available/tictactoe /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 7. Setup SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 8. Setup Systemd Service

```bash
# Copy service file
sudo cp deployment/tictactoe-api.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable tictactoe-api

# Start service
sudo systemctl start tictactoe-api

# Check status
sudo systemctl status tictactoe-api
```

### Docker Deployment

#### 1. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 2. Build and Run

```bash
# Clone repository
git clone https://github.com/yourusername/tictactoe.git
cd tictactoe/backend

# Copy environment file
cp .env.example .env
nano .env

# Build and start containers
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

#### 3. Docker Commands

```bash
# Stop containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f api

# Execute commands in container
docker-compose exec api sh
```

## Configuration

### PM2 Ecosystem Configuration

The `deployment/ecosystem.config.js` file configures PM2:

```javascript
module.exports = {
  apps: [{
    name: 'tictactoe-api',
    script: './dist/server.js',
    instances: 'max',        // Use all CPU cores
    exec_mode: 'cluster',    // Cluster mode for load balancing
    max_memory_restart: '500M',
    autorestart: true,
    max_restarts: 10,
  }]
};
```

### Nginx Configuration

Key features in `deployment/nginx.conf`:

- **SSL/TLS**: HTTPS with modern cipher suites
- **WebSocket Support**: Proper headers for Socket.IO
- **Rate Limiting**: Protection against abuse
- **Gzip Compression**: Reduced bandwidth usage
- **Security Headers**: HSTS, X-Frame-Options, etc.

## Monitoring

### PM2 Monitoring

```bash
# View application status
pm2 list

# Monitor in real-time
pm2 monit

# View logs
pm2 logs tictactoe-api

# View specific log lines
pm2 logs tictactoe-api --lines 100

# Clear logs
pm2 flush
```

### Health Checks

```bash
# Run health check script
cd /opt/tictactoe-backend/backend
sudo bash deployment/health-check.sh

# Manual health check
curl http://localhost:3000/health
```

### System Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check Nginx logs
sudo tail -f /var/log/nginx/tictactoe-access.log
sudo tail -f /var/log/nginx/tictactoe-error.log
```

## Maintenance

### Automated Deployment Script

Use the deployment script for updates:

```bash
cd /opt/tictactoe-backend/backend
sudo bash deployment/deploy.sh
```

The script will:
1. Pull latest code
2. Install dependencies
3. Run tests
4. Build application
5. Restart PM2
6. Verify deployment

### Manual Updates

```bash
# Navigate to application directory
cd /opt/tictactoe-backend/backend

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --production=false

# Run tests
npm test

# Build
npm run build

# Install production dependencies
npm ci --production

# Restart application
pm2 restart tictactoe-api
```

### Backups

#### Create Backup

```bash
cd /opt/tictactoe-backend/backend
sudo bash deployment/backup.sh
```

Backups are stored in `/opt/tictactoe-backend/backups/`

#### Restore from Backup

```bash
cd /opt/tictactoe-backend/backend
sudo bash deployment/rollback.sh
```

### Log Rotation

PM2 handles log rotation automatically. Configure in `ecosystem.config.js`:

```javascript
{
  error_file: './logs/pm2-error.log',
  out_file: './logs/pm2-out.log',
  merge_logs: true,
}
```

For Nginx logs, configure logrotate:

```bash
sudo nano /etc/logrotate.d/nginx
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 status
pm2 list

# View error logs
pm2 logs tictactoe-api --err

# Check if port is in use
sudo lsof -i :3000

# Restart application
pm2 restart tictactoe-api
```

### High Memory Usage

```bash
# Check memory usage
pm2 list

# Restart application to free memory
pm2 restart tictactoe-api

# Adjust max_memory_restart in ecosystem.config.js
```

### WebSocket Connection Issues

```bash
# Check Nginx configuration
sudo nginx -t

# Verify WebSocket headers in Nginx config
grep -A 5 "location /socket.io/" /etc/nginx/sites-available/tictactoe

# Check firewall
sudo ufw status

# Test WebSocket connection
wscat -c ws://localhost:3000/socket.io/
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Database Connection Issues

```bash
# Check environment variables
pm2 env tictactoe-api

# Verify .env file
cat .env

# Test database connection
# (Add your database connection test command)
```

### Performance Issues

```bash
# Check system resources
htop
free -h
df -h

# Check PM2 metrics
pm2 monit

# Analyze logs for errors
pm2 logs tictactoe-api | grep -i error

# Check Nginx access logs for slow requests
sudo tail -f /var/log/nginx/tictactoe-access.log
```

### Emergency Rollback

If deployment fails:

```bash
# Stop current version
pm2 stop tictactoe-api

# Rollback to previous version
cd /opt/tictactoe-backend/backend
sudo bash deployment/rollback.sh

# Verify rollback
bash deployment/health-check.sh
```

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Secure Environment Variables**
   - Never commit `.env` to version control
   - Use strong, unique values for secrets
   - Rotate credentials regularly

4. **Monitor Logs**
   - Regularly review application and system logs
   - Set up log aggregation (e.g., ELK stack)
   - Configure alerts for errors

5. **Regular Backups**
   - Automate daily backups
   - Test restore procedures
   - Store backups off-site

6. **SSL/TLS**
   - Use strong cipher suites
   - Enable HSTS
   - Renew certificates before expiration

## Performance Optimization

1. **PM2 Cluster Mode**
   - Utilizes all CPU cores
   - Automatic load balancing
   - Zero-downtime reloads

2. **Nginx Caching**
   - Enable proxy caching for static responses
   - Configure cache headers

3. **Gzip Compression**
   - Already enabled in Nginx config
   - Reduces bandwidth usage

4. **Connection Pooling**
   - Configure keep-alive connections
   - Optimize database connection pools

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/tictactoe/issues
- Documentation: See README.md and API documentation

## License

[Your License Here]

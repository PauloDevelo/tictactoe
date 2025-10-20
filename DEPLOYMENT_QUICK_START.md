# Production Deployment Quick Start

Fast-track guide to deploy the Tic-Tac-Toe application to production.

## Prerequisites Checklist

- [ ] Ubuntu 20.04+ server with root access
- [ ] Domain name with DNS configured (A record pointing to server)
- [ ] Ports 80 and 443 accessible
- [ ] SSH key configured for server access

## 5-Step Deployment

### Step 1: Server Setup (10 minutes)

```bash
# SSH to server
ssh root@your-server-ip

# Download and run installation script
wget https://raw.githubusercontent.com/your-repo/tictactoe/main/backend/deployment/install-production.sh
chmod +x install-production.sh
sudo ./install-production.sh

# Enter when prompted:
# - Domain: your-domain.com
# - Email: your-email@example.com
```

**What this does**: Installs Node.js, PM2, Nginx, SSL certificate, creates users and directories.

### Step 2: Deploy Backend (5 minutes)

```bash
# On your local machine
cd backend
npm install
npm test
npm run build

# Create deployment package
tar -czf backend-deploy.tar.gz src/ dist/ package*.json tsconfig.json deployment/

# Upload to server
scp backend-deploy.tar.gz tictactoe@your-server.com:~/deployments/

# SSH to server and deploy
ssh tictactoe@your-server.com
cd ~/deployments
tar -xzf backend-deploy.tar.gz -C /var/www/tictactoe/backend/
cd /var/www/tictactoe/backend
npm ci --production

# Configure environment
cp .env.example .env
nano .env  # Update CORS_ORIGIN with your domain

# Start with PM2
cp deployment/ecosystem.config.js .
pm2 start ecosystem.config.js
pm2 save
```

### Step 3: Deploy Frontend (5 minutes)

```bash
# On your local machine
cd unicorn-tictactoe
chmod +x build-and-deploy.sh
./build-and-deploy.sh

# Enter when prompted:
# - Production URL: https://your-domain.com
# - Server: tictactoe@your-server.com
```

**What this does**: Builds Angular app, uploads to server, deploys to `/var/www/tictactoe/frontend/`.

### Step 4: Configure Nginx (3 minutes)

```bash
# SSH to server as root
ssh root@your-server.com

# Update Nginx config with your domain
sudo nano /var/www/tictactoe/backend/deployment/nginx.conf
# Replace 'your-domain.com' with your actual domain

# Copy to Nginx sites
sudo cp /var/www/tictactoe/backend/deployment/nginx.conf /etc/nginx/sites-available/tictactoe
sudo ln -sf /etc/nginx/sites-available/tictactoe /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Verify Deployment (2 minutes)

```bash
# Check backend
curl https://your-domain.com/health
# Should return: {"status":"ok","timestamp":"..."}

# Check PM2
ssh tictactoe@your-server.com
pm2 list
pm2 logs tictactoe-api --lines 20

# Check frontend
# Visit https://your-domain.com in browser
# Open browser console, should see no errors
# Test creating a room and playing
```

## Environment Configuration

Edit `/var/www/tictactoe/backend/.env`:

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000
MAX_ROOMS=1000
ROOM_CLEANUP_INTERVAL=300000
INACTIVE_ROOM_TIMEOUT=1800000
```

## Common Commands

### Backend Management

```bash
# View processes
pm2 list

# View logs
pm2 logs tictactoe-api

# Restart
pm2 restart tictactoe-api

# Stop
pm2 stop tictactoe-api
```

### Nginx Management

```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/tictactoe-access.log
sudo tail -f /var/log/nginx/tictactoe-error.log
```

### Deployment Updates

```bash
# Backend update
ssh tictactoe@your-server.com
cd /var/www/tictactoe/backend
./deployment/deploy.sh

# Frontend update
cd unicorn-tictactoe
./build-and-deploy.sh
```

## Troubleshooting

### Backend not responding

```bash
pm2 logs tictactoe-api --err
pm2 restart tictactoe-api
```

### Frontend not loading

```bash
sudo tail -f /var/log/nginx/tictactoe-error.log
sudo nginx -t
sudo systemctl reload nginx
```

### WebSocket not connecting

```bash
# Check backend is running
pm2 list

# Check Nginx WebSocket config
sudo nginx -T | grep -A 5 "socket.io"

# Check browser console for errors
```

### SSL certificate issues

```bash
sudo certbot certificates
sudo certbot renew
sudo systemctl reload nginx
```

## Directory Structure

```
/var/www/tictactoe/
├── frontend/           # Angular build files
│   ├── index.html
│   ├── *.js
│   └── assets/
├── backend/            # Node.js application
│   ├── src/
│   ├── dist/
│   ├── node_modules/
│   ├── .env
│   └── ecosystem.config.js
└── deployment-info.txt

/home/tictactoe/
├── deployments/        # Deployment packages
└── backups/           # Application backups
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Rate limiting configured in Nginx
- [ ] CORS properly configured
- [ ] Environment variables secured

## Monitoring Checklist

- [ ] PM2 processes running
- [ ] Nginx serving requests
- [ ] SSL certificate valid
- [ ] Logs rotating properly
- [ ] Backups configured
- [ ] Health endpoint responding

## Next Steps

1. **Setup monitoring**: Consider adding PM2 Plus or other monitoring
2. **Configure backups**: Setup automated daily backups
3. **Add analytics**: Track usage and errors
4. **Performance testing**: Load test your deployment
5. **Documentation**: Document any custom configurations

## Support

For detailed information, see:
- **Full Guide**: PRODUCTION_DEPLOYMENT_GUIDE.md
- **API Docs**: backend/REST_API.md, backend/WEBSOCKET_API.md
- **Deployment Scripts**: backend/deployment/

## Maintenance

### Daily
```bash
pm2 list  # Check processes
```

### Weekly
```bash
sudo certbot certificates  # Check SSL
ls -lh ~/backups/         # Verify backups
```

### Monthly
```bash
sudo apt-get update && sudo apt-get upgrade -y  # Update system
cd /var/www/tictactoe/backend && npm outdated  # Check dependencies
```

---

**Deployment Time**: ~25 minutes total

**Need help?** Check PRODUCTION_DEPLOYMENT_GUIDE.md for detailed troubleshooting.

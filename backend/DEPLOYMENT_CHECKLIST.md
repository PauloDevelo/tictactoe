# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] Code reviewed and approved
- [ ] All dependencies up to date

### Configuration
- [ ] `.env` file configured with production values
- [ ] `CORS_ORIGIN` set to production domain
- [ ] `NODE_ENV` set to `production`
- [ ] SSL certificates obtained (if using HTTPS)
- [ ] Domain DNS configured correctly

### Infrastructure
- [ ] Server meets minimum requirements (1GB RAM, 10GB disk)
- [ ] Node.js 18.x installed
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Backup strategy in place

## Deployment Steps

### Initial Deployment

- [ ] Clone repository to `/opt/tictactoe-backend`
- [ ] Install dependencies (`npm ci`)
- [ ] Run tests (`npm test`)
- [ ] Build application (`npm run build`)
- [ ] Configure environment variables
- [ ] Start with PM2 (`pm2 start deployment/ecosystem.config.js`)
- [ ] Configure Nginx reverse proxy
- [ ] Setup SSL certificate with Certbot
- [ ] Enable systemd service
- [ ] Verify health check endpoint
- [ ] Test WebSocket connections
- [ ] Monitor logs for errors

### Update Deployment

- [ ] Create backup (`npm run backup`)
- [ ] Pull latest code (`git pull`)
- [ ] Install dependencies (`npm ci`)
- [ ] Run tests (`npm test`)
- [ ] Build application (`npm run build`)
- [ ] Restart PM2 (`pm2 restart tictactoe-api`)
- [ ] Verify health check
- [ ] Monitor for errors
- [ ] Test critical functionality

### Automated Deployment

- [ ] Run deployment script (`sudo bash deployment/deploy.sh`)
- [ ] Monitor deployment output
- [ ] Verify health check
- [ ] Test application functionality

## Post-Deployment

### Verification
- [ ] Health endpoint responding (`/health`)
- [ ] API endpoints working correctly
- [ ] WebSocket connections established
- [ ] No errors in PM2 logs
- [ ] No errors in Nginx logs
- [ ] SSL certificate valid
- [ ] CORS headers correct

### Monitoring
- [ ] PM2 monitoring active (`pm2 monit`)
- [ ] Application metrics normal
- [ ] Memory usage acceptable
- [ ] CPU usage normal
- [ ] Disk space sufficient

### Testing
- [ ] Create a room via API
- [ ] Join room via WebSocket
- [ ] Make moves in game
- [ ] Test game completion
- [ ] Test error scenarios
- [ ] Load testing (if applicable)

## Rollback Plan

If deployment fails:

- [ ] Stop current version (`pm2 stop tictactoe-api`)
- [ ] Run rollback script (`sudo bash deployment/rollback.sh`)
- [ ] Select backup to restore
- [ ] Verify rollback successful
- [ ] Document issues encountered
- [ ] Plan fixes for next deployment

## Security Checklist

- [ ] `.env` file not in version control
- [ ] Strong secrets and passwords used
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured in Nginx
- [ ] Rate limiting enabled
- [ ] Firewall rules configured
- [ ] System packages updated
- [ ] Application dependencies updated
- [ ] No sensitive data in logs

## Performance Checklist

- [ ] PM2 cluster mode enabled
- [ ] Gzip compression enabled
- [ ] Connection keep-alive configured
- [ ] Appropriate resource limits set
- [ ] Log rotation configured
- [ ] Monitoring and alerting setup

## Documentation

- [ ] Deployment documented
- [ ] Configuration changes noted
- [ ] Known issues documented
- [ ] Rollback procedure tested
- [ ] Team notified of deployment

## Emergency Contacts

- **DevOps Lead**: [Name/Contact]
- **Backend Lead**: [Name/Contact]
- **On-Call Engineer**: [Name/Contact]

## Useful Commands

```bash
# Check application status
pm2 list
pm2 logs tictactoe-api

# Check system resources
htop
free -h
df -h

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/tictactoe-access.log
pm2 logs tictactoe-api --lines 100

# Restart services
pm2 restart tictactoe-api
sudo systemctl restart nginx

# Health check
curl http://localhost:3021/health
bash deployment/health-check.sh
```

## Notes

- Always create a backup before deployment
- Test rollback procedure in staging first
- Monitor application for at least 30 minutes post-deployment
- Document any issues or deviations from standard process
- Update this checklist based on lessons learned

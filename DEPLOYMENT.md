# Deployment Guide

Complete guide for deploying Water Tank Cleaning API to production.

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] Environment variables configured for production
- [ ] Database backups configured
- [ ] SSL/TLS certificates ready
- [ ] Monitoring and alerting setup
- [ ] Disaster recovery plan documented
- [ ] Team trained on runbooks

## Deployment Options

### 1. Traditional Server (PM2)

#### Requirements
- Ubuntu 20.04+ server
- Node.js 18+
- MongoDB 6.0+
- Redis 7+
- Nginx for reverse proxy

#### Setup Steps

```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone <repo-url>
cd water-tank-api

# Install dependencies
npm install

# Setup environment
cp .env.production .env
# Edit .env with production values
nano .env

# Start with PM2
npm install -g pm2
npm run start:prod

# Setup PM2 startup on reboot
pm2 startup
pm2 save

# Nginx reverse proxy configuration
sudo nano /etc/nginx/sites-available/water-tank-api
```

**Nginx Config Example:**
```nginx
upstream water-tank-api {
    server localhost:4000;
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    location / {
        proxy_pass http://water-tank-api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Containerized Deployment (Docker + Compose)

#### Build & Push

```bash
# Build image
docker build -t your-registry/water-tank-api:v1.0.0 .

# Log in to registry
docker login your-registry

# Push image
docker push your-registry/water-tank-api:v1.0.0

# On production server
docker pull your-registry/water-tank-api:v1.0.0
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured
- Container registry access

#### Steps

```bash
# Create namespace
kubectl create namespace water-tank

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=mongodb-uri="<your-mongo-uri>" \
  --from-literal=jwt-secret="<your-jwt-secret>" \
  --from-literal=redis-password="<your-redis-password>" \
  -n water-tank

# Deploy using kubectl
kubectl apply -f k8s/deployment.yaml -n water-tank
kubectl apply -f k8s/service.yaml -n water-tank
kubectl apply -f k8s/ingress.yaml -n water-tank

# Check deployment
kubectl get pods -n water-tank
kubectl logs -n water-tank deployment/water-tank-api
```

## Database Migration

```bash
# Backup production database
mongodump --uri "mongodb+srv://<user>:<pass>@cluster.mongodb.net/water-tank" \
  --archive=water-tank-backup.archive

# Run migrations/seeding if needed
npm run db:seed

# Verify data integrity
mongo <connection-string> --eval "db.users.countDocuments()"
```

## Monitoring & Logging

### Application Logs
```bash
# PM2 logs
pm2 logs water-tank-api

# Docker logs
docker logs water-tank-api

# Kubernetes logs
kubectl logs -n water-tank -f deployment/water-tank-api
```

### Metrics
- Sentry for error tracking
- Datadog or New Relic for APM
- Prometheus + Grafana for metrics

### Health Checks
```bash
curl https://api.example.com/health

# Should return:
{
    "status": "ok",
    "database": {"status": "connected"},
    "timestamp": "2026-04-02T10:00:00Z"
}
```

## Rollback Procedure

### PM2 Rollback
```bash
# List available versions
pm2 list

# Revert to previous version
git checkout <commit-hash>
npm install
pm2 restart water-tank-api
```

### Docker Rollback
```bash
# Use previous image tag
docker-compose -f docker-compose.prod.yml down
docker pull your-registry/water-tank-api:v0.9.9
docker-compose -f docker-compose.prod.yml up -d
```

## Performance Optimization

### Database
- Enable indexes on frequently queried fields
- Use connection pooling (already configured)
- Implement read replicas for read-heavy operations
- Archive old records periodically

### Caching
- Set appropriate TTL for Redis keys
- Cache frequently accessed endpoints
- Implement cache invalidation strategy

### Load Balancing
- Use multiple PM2 instances (cluster mode enabled)
- Deploy behind load balancer (Nginx, HAProxy)
- Implement sticky sessions if needed

## Security Measures

- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up DDoS protection (Cloudflare, AWS Shield)
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Monitor for suspicious activity
- [ ] Implement WAF rules
- [ ] Enable database encryption at rest

## Disaster Recovery

### Automated Backups
```bash
# Setup cron job for daily backups
0 2 * * * /usr/local/bin/backup-mongodb.sh
0 3 * * * /usr/local/bin/backup-redis.sh
```

### Backup Verification
```bash
# Test restore monthly
mongorestore --archive=water-tank-backup.archive \
  --nsInclude "water-tank-test.*"
```

## Scaling

### Horizontal Scaling
```bash
# With PM2 cluster
pm2 start ecosystem.config.js -i max

# With Kubernetes
kubectl scale deployment water-tank-api --replicas=5 -n water-tank
```

### Database Scaling
- MongoDB sharding for large datasets
- Redis cluster for distributed caching
- Consider read replicas for reporting

## Troubleshooting

### High Memory Usage
```bash
# Check Node process
ps aux | grep node

# Investigate heap dump
node --inspect server.js

# Access inspector at chrome://inspect
```

### Connection Timeouts
```bash
# Check database connectivity
mongosh <connection-string>

# Check Redis connectivity
redis-cli -h <host> -p <port> ping

# Review logs for connection errors
pm2 logs water-tank-api
```

---

**Last Updated**: April 2026

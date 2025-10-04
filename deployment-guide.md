# 🚀 The Digital Trading Platform - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- A domain name (e.g., yourdomain.com)
- A VPS or cloud server (minimum 2GB RAM, 2 CPU cores)
- SSH access to your server
- Docker and Docker Compose installed on the server

## 🌐 Deployment Options

### Option 1: VPS Deployment (Recommended)

#### **1.1 Choose a VPS Provider**
- **DigitalOcean**: $6/month for 1GB RAM, 1 vCPU
- **Linode**: $5/month for 1GB RAM, 1 vCPU  
- **Vultr**: $6/month for 1GB RAM, 1 vCPU
- **AWS EC2**: t3.micro (free tier eligible)

#### **1.2 Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

## 🔧 Configuration Steps

### **Step 1: Environment Configuration**

1. **Copy the production environment file**:
   ```bash
   cp server/.env.production server/.env
   ```

2. **Update the environment variables**:
   - Replace `yourdomain.com` with your actual domain
   - Set secure passwords for MongoDB and Redis
   - Configure email settings
   - Add API keys for crypto services

### **Step 2: Domain Configuration**

#### **2.1 DNS Settings**
Point your domain to your server IP:
```
Type: A Record
Name: @
Value: YOUR_SERVER_IP
TTL: 300

Type: A Record  
Name: api
Value: YOUR_SERVER_IP
TTL: 300

Type: CNAME
Name: www
Value: yourdomain.com
TTL: 300
```

#### **2.2 Nginx Configuration**
```nginx
# /etc/nginx/sites-available/thedigitaltrading
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend (React App)
    location / {
        root /var/www/thedigitaltrading/client/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Subdomain
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Step 3: SSL Certificate Setup**

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Step 4: Deploy with Docker**

1. **Upload your project to the server**:
   ```bash
   # On your local machine
   rsync -avz --exclude node_modules --exclude .git . user@your-server-ip:/var/www/thedigitaltrading/
   ```

2. **Build and start the application**:
   ```bash
   # On the server
   cd /var/www/thedigitaltrading
   
   # Build the application
   docker-compose -f docker-compose.prod.yml build
   
   # Start services
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🔒 Security Configuration

### **Firewall Setup**
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### **MongoDB Security**
```bash
# Create admin user
docker exec -it luxhedge_mongo_1 mongo admin
db.createUser({
  user: "admin",
  pwd: "your_secure_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})
```

## 📊 Monitoring Setup

### **System Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Setup log rotation
sudo nano /etc/logrotate.d/thedigitaltrading
```

### **Application Monitoring**
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Monitor system resources
docker stats
```

## 🔄 Backup Strategy

### **Automated Backups**
```bash
# Create backup script
sudo nano /usr/local/bin/backup-thedigitaltrading.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/thedigitaltrading"
mkdir -p $BACKUP_DIR

# Database backup
docker exec luxhedge_mongo_1 mongodump --authenticationDatabase admin -u admin -p your_password --out /tmp/backup
docker cp luxhedge_mongo_1:/tmp/backup $BACKUP_DIR/db_$DATE

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/thedigitaltrading/server/uploads

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete

# Make executable
sudo chmod +x /usr/local/bin/backup-thedigitaltrading.sh

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-thedigitaltrading.sh
```

## 🚀 Deployment Commands

### **Quick Deployment Script**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying The Digital Trading Platform..."

# Pull latest changes
git pull origin main

# Build and restart containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
sleep 30

# Check health
curl -f http://localhost:5001/api/health || exit 1

echo "✅ Deployment completed successfully!"
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Port 3001 already in use**:
   ```bash
   sudo lsof -i :3001
   sudo kill -9 PID
   ```

2. **MongoDB connection issues**:
   ```bash
   docker logs luxhedge_mongo_1
   ```

3. **SSL certificate issues**:
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

4. **Check application logs**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs app
   ```

## 📱 Post-Deployment Checklist

- [ ] Domain resolves to your server
- [ ] SSL certificate is valid
- [ ] Frontend loads correctly
- [ ] API endpoints respond
- [ ] Database connections work
- [ ] File uploads function
- [ ] Email notifications work
- [ ] Socket.IO connections work
- [ ] Admin panel accessible
- [ ] Backup system running
- [ ] Monitoring configured

## 🌟 Performance Optimization

### **Frontend Optimization**
- Enable Gzip compression
- Set up CDN (Cloudflare)
- Optimize images
- Enable browser caching

### **Backend Optimization**
- Database indexing
- Redis caching
- API rate limiting
- Connection pooling

## 📞 Support

If you encounter issues during deployment:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Test database connectivity
4. Check firewall settings
5. Validate SSL certificates

---

**🎉 Congratulations!** Your Digital Trading Platform should now be live at `https://yourdomain.com`
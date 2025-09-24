# 🌐 Platform-Specific Deployment Instructions

## 🚀 Quick Deployment Options

### **Option 1: DigitalOcean Droplet (Recommended)**

#### **1.1 Create Droplet**
```bash
# Minimum specs: 2GB RAM, 1 vCPU, 50GB SSD
# OS: Ubuntu 22.04 LTS
# Price: ~$12/month
```

#### **1.2 Initial Setup**
```bash
# Connect via SSH
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx and Certbot
apt install nginx certbot python3-certbot-nginx -y

# Create project directory
mkdir -p /var/www/thedigitaltrading
cd /var/www/thedigitaltrading
```

#### **1.3 Deploy Application**
```bash
# Upload your project files
# Option 1: Git clone
git clone https://github.com/vicrey1/thedigitaltrading.git .

# Option 2: SCP upload
# scp -r . root@your-droplet-ip:/var/www/thedigitaltrading/

# Set up environment
cp server/.env.production server/.env
# Edit server/.env with your actual values

# Deploy
chmod +x deploy.sh
./deploy.sh
```

---

### **Option 2: AWS EC2**

#### **2.1 Launch EC2 Instance**
```bash
# Instance type: t3.small (2 vCPU, 2GB RAM)
# AMI: Ubuntu Server 22.04 LTS
# Storage: 20GB gp3
# Security Group: Allow ports 22, 80, 443
```

#### **2.2 Setup Commands**
```bash
# Connect
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose nginx certbot python3-certbot-nginx -y
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

# Deploy application
sudo mkdir -p /var/www/thedigitaltrading
sudo chown ubuntu:ubuntu /var/www/thedigitaltrading
cd /var/www/thedigitaltrading

# Upload and deploy your code
git clone https://github.com/vicrey1/thedigitaltrading.git .
cp server/.env.production server/.env
# Edit environment variables
chmod +x deploy.sh
./deploy.sh
```

---

### **Option 3: Linode**

#### **3.1 Create Linode**
```bash
# Plan: Nanode 1GB ($5/month) or Linode 2GB ($12/month)
# Image: Ubuntu 22.04 LTS
# Region: Choose closest to your users
```

#### **3.2 Setup Process**
```bash
# SSH connection
ssh root@your-linode-ip

# System setup
apt update && apt upgrade -y
apt install docker.io docker-compose nginx certbot python3-certbot-nginx git -y
systemctl enable docker
systemctl start docker

# Application deployment
mkdir -p /var/www/thedigitaltrading
cd /var/www/thedigitaltrading
git clone https://github.com/vicrey1/thedigitaltrading.git .
cp server/.env.production server/.env
# Configure environment variables
chmod +x deploy.sh
./deploy.sh
```

---

### **Option 4: Vultr**

#### **4.1 Deploy Server**
```bash
# Plan: Regular Performance 2GB ($12/month)
# OS: Ubuntu 22.04 x64
# Features: Enable IPv6, Auto Backups
```

#### **4.2 Configuration**
```bash
# Connect
ssh root@your-vultr-ip

# Install stack
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install docker-compose nginx certbot python3-certbot-nginx -y

# Deploy
mkdir -p /var/www/thedigitaltrading
cd /var/www/thedigitaltrading
git clone https://github.com/vicrey1/thedigitaltrading.git .
cp server/.env.production server/.env
# Update environment variables
./deploy.sh
```

---

### **Option 5: Heroku (Alternative)**

#### **5.1 Heroku Setup**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Add MongoDB Atlas addon
heroku addons:create mongolab:sandbox

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev
```

#### **5.2 Deploy to Heroku**
```bash
# Create Procfile
echo "web: cd server && npm start" > Procfile

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

---

### **Option 6: Railway**

#### **6.1 Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### **6.2 Configure Services**
```yaml
# railway.json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "healthcheckPath": "/api/health"
  }
}
```

---

## 🔧 Domain Configuration

### **DNS Settings (For all platforms)**

#### **A Records**
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 300

Type: A
Name: api
Value: YOUR_SERVER_IP
TTL: 300
```

#### **CNAME Records**
```
Type: CNAME
Name: www
Value: yourdomain.com
TTL: 300
```

### **SSL Certificate Setup**
```bash
# For all VPS options
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

---

## 📊 Cost Comparison

| Platform | Monthly Cost | Setup Difficulty | Scalability |
|----------|-------------|------------------|-------------|
| DigitalOcean | $12-24 | Easy | High |
| AWS EC2 | $15-30 | Medium | Very High |
| Linode | $12-24 | Easy | High |
| Vultr | $12-24 | Easy | High |
| Heroku | $25-50 | Very Easy | Medium |
| Railway | $20-40 | Very Easy | Medium |

---

## 🎯 Recommended Setup

**For beginners**: DigitalOcean or Linode
**For scalability**: AWS EC2
**For simplicity**: Heroku or Railway
**For cost-effectiveness**: Vultr or Linode

---

## 🔍 Post-Deployment Checklist

- [ ] Server is accessible via SSH
- [ ] Docker containers are running
- [ ] Domain points to server IP
- [ ] SSL certificate is installed
- [ ] Application loads at https://yourdomain.com
- [ ] API responds at https://api.yourdomain.com
- [ ] Database connections work
- [ ] File uploads function
- [ ] Email notifications work

---

## 🆘 Troubleshooting

### **Common Issues**

1. **Port 80/443 blocked**: Check firewall settings
2. **SSL certificate fails**: Verify DNS propagation
3. **Database connection error**: Check MongoDB credentials
4. **Application won't start**: Check Docker logs
5. **Domain not resolving**: Wait for DNS propagation (up to 48 hours)

### **Useful Commands**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check SSL certificate
openssl s_client -connect yourdomain.com:443

# Test DNS resolution
nslookup yourdomain.com
```
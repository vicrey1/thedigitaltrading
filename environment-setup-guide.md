# Environment Setup Guide - Vercel Full-Stack Deployment

This guide covers setting up environment variables for deploying both frontend (React) and backend (Node.js) on Vercel as a unified full-stack application.

## 🚀 Deployment Architecture

```
Vercel Full-Stack Application:
├── Frontend (React) → Static Build
├── Backend (Node.js) → Serverless API Functions
└── Database → MongoDB Atlas (External)
```

## 📋 Required Environment Variables for Vercel

### Core Application Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `JWT_SECRET` | `[32+ character string]` | JWT token encryption key |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiration time |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |

### Frontend Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel app URL |
| `BACKEND_URL` | `https://your-app.vercel.app` | Same as frontend (unified) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | CORS allowed origin |

### Email Configuration (Gmail SMTP)

| Variable | Value | Description |
|----------|-------|-------------|
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | `your-email@gmail.com` | Gmail address |
| `EMAIL_PASS` | `[app-password]` | Gmail app password |
| `FROM_EMAIL` | `noreply@yourdomain.com` | From email address |

### Security & Performance

| Variable | Value | Description |
|----------|-------|-------------|
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `MAX_FILE_SIZE` | `10485760` | Max upload size (10MB) |

### Optional API Keys

| Variable | Description |
|----------|-------------|
| `COINMARKETCAP_API_KEY` | CoinMarketCap API access |
| `BINANCE_API_KEY` | Binance API access |
| `BINANCE_SECRET_KEY` | Binance API secret |
| `HUGGINGFACE_API_KEY` | Hugging Face AI API |

### Monitoring

| Variable | Value | Description |
|----------|-------|-------------|
| `ENABLE_MONITORING` | `true` | Enable monitoring |
| `LOG_LEVEL` | `info` | Logging level |

## 🔧 Vercel Setup Instructions

### 1. Deploy to Vercel

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Or deploy via GitHub integration
   # Go to vercel.com → Import Project → Connect GitHub
   ```

2. **Project Configuration**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (project root)
   - **Build Command**: `cd client && npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install`

### 2. Set Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

**Production Environment Variables:**
```bash
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thedigitaltrading?retryWrites=true&w=majority
FRONTEND_URL=https://your-app-name.vercel.app
BACKEND_URL=https://your-app-name.vercel.app
CORS_ORIGIN=https://your-app-name.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
FROM_EMAIL=noreply@thedigitaltrading.com
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
ENABLE_MONITORING=true
LOG_LEVEL=info
```

### 3. Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**: https://cloud.mongodb.com
2. **Create Cluster**: Choose free tier (M0)
3. **Create Database User**: 
   - Username: `your-username`
   - Password: `secure-password`
4. **Whitelist IP**: Add `0.0.0.0/0` (allow all IPs for Vercel)
5. **Get Connection String**: 
   ```
   mongodb+srv://username:password@cluster.mongodb.net/thedigitaltrading?retryWrites=true&w=majority
   ```

### 4. Email Setup (Gmail)

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
3. **Use App Password** in `EMAIL_PASS` environment variable

## 🔐 Security Best Practices

### JWT Secret Generation
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variable Security
- ✅ Use Vercel's encrypted environment variables
- ✅ Never commit `.env` files to git
- ✅ Use different secrets for development/production
- ✅ Rotate secrets regularly

## 🌐 Domain Configuration

### Custom Domain (Optional)
1. **Add Domain** in Vercel Dashboard
2. **Update Environment Variables**:
   ```bash
   FRONTEND_URL=https://yourdomain.com
   BACKEND_URL=https://yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   ```

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### 2. API Test
```bash
curl https://your-app.vercel.app/api
```

### 3. Frontend Test
Visit: `https://your-app.vercel.app`

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Verify `CORS_ORIGIN` matches your domain
   - Check frontend `REACT_APP_API_BASE_URL=/api`

2. **Database Connection**:
   - Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
   - Check connection string format
   - Ensure database user has proper permissions

3. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in `package.json`
   - Ensure environment variables are set

4. **API Routes Not Working**:
   - Verify `api/index.js` exists
   - Check `vercel.json` routing configuration
   - Review function logs in Vercel dashboard

### Debug Commands
```bash
# Check environment variables
vercel env ls

# View function logs
vercel logs

# Local development
vercel dev
```

## 📊 Performance Optimization

### Vercel Advantages
- ✅ **Global CDN**: Automatic edge caching
- ✅ **Serverless Functions**: Auto-scaling backend
- ✅ **Zero Configuration**: Automatic builds
- ✅ **Preview Deployments**: Branch previews
- ✅ **Analytics**: Built-in performance monitoring

### Best Practices
- Use connection pooling for MongoDB
- Implement proper caching headers
- Optimize bundle size
- Use Vercel Analytics for monitoring

## 💰 Cost Considerations

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ 100 serverless function executions/day
- ✅ Unlimited static deployments
- ✅ Custom domains

### Upgrade Triggers
- High traffic (>100GB/month)
- Many API calls (>100/day)
- Need for team collaboration
- Advanced analytics requirements

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your connected Git repository:

1. **Main Branch** → Production deployment
2. **Other Branches** → Preview deployments
3. **Pull Requests** → Automatic preview URLs

## 📞 Support

- **Vercel Documentation**: https://vercel.com/docs
- **MongoDB Atlas Support**: https://docs.atlas.mongodb.com
- **Project Issues**: Check GitHub repository issues

---

**Next Steps**: After deployment, update your frontend environment variables with the actual Vercel URL and test all functionality.
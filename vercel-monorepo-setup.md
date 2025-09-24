# Vercel Monorepo Configuration Guide

Complete guide for configuring Vercel project settings for the LUXHEDGE monorepo structure.

## 📁 Monorepo Structure Overview

```
LUXHEDGE/
├── client/                 # React Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.production
├── server/                 # Original Node.js Backend
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
├── api/                    # Vercel Serverless Functions
│   └── index.js           # Main API entry point
├── vercel.json            # Root Vercel configuration
├── package.json           # Root package.json
└── README.md
```

## 🔧 Vercel Project Configuration

### 1. Framework Detection

Vercel will automatically detect this as a monorepo. Configure the following settings:

**Framework Preset**: `Other` (since we have a custom monorepo structure)

### 2. Build Settings

#### Root Directory
```
Root Directory: ./
```
*Leave this as the project root to access both client and api directories*

#### Build Command
```bash
cd client && npm ci && npm run build
```
*This builds the React frontend from the client directory*

#### Output Directory
```
client/build
```
*Points to the React build output*

#### Install Command
```bash
npm ci
```
*Installs dependencies from root package.json*

### 3. Advanced Build Settings

#### Node.js Version
```
Node.js Version: 18.x
```
*Recommended for optimal performance*

#### Environment Variables
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

**Production Environment:**
```bash
NODE_ENV=production
JWT_SECRET=your_32_character_secret_key_here
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thedigitaltrading
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
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

**Preview Environment:**
```bash
NODE_ENV=development
JWT_SECRET=preview_secret_key_for_testing_only
JWT_EXPIRES_IN=1d
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thedigitaltrading-preview
FRONTEND_URL=https://preview-branch.vercel.app
BACKEND_URL=https://preview-branch.vercel.app
CORS_ORIGIN=https://preview-branch.vercel.app
# ... other variables with preview values
```

### 4. Function Configuration

#### Serverless Function Settings
```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```
*Configured in vercel.json for API timeout settings*

#### Memory Allocation
- **Free Tier**: 1024 MB (default)
- **Pro Tier**: Up to 3008 MB available

### 5. Domain Configuration

#### Custom Domain Setup
1. **Add Domain**: Go to Vercel Dashboard → Project → Settings → Domains
2. **Configure DNS**: Point your domain to Vercel
3. **SSL Certificate**: Automatically provisioned
4. **Update Environment Variables**: Replace vercel.app URLs with custom domain

#### Domain Examples
```bash
# Production
FRONTEND_URL=https://thedigitaltrading.com
BACKEND_URL=https://thedigitaltrading.com
CORS_ORIGIN=https://thedigitaltrading.com

# Staging
FRONTEND_URL=https://staging.thedigitaltrading.com
BACKEND_URL=https://staging.thedigitaltrading.com
CORS_ORIGIN=https://staging.thedigitaltrading.com
```

## 🚀 Deployment Configuration

### 1. Git Integration

#### Branch Configuration
```
Production Branch: main
Preview Branches: All branches
```

#### Ignored Build Step
```bash
# Add to package.json if you want to skip builds for certain changes
"vercel-build": "echo 'Skipping build' && exit 0"
```

### 2. Build Optimization

#### Caching Strategy
```json
{
  "github": {
    "silent": true
  },
  "buildCommand": "cd client && npm ci --prefer-offline && npm run build"
}
```

#### Build Performance
- **Dependency Caching**: Automatic
- **Build Cache**: Enabled by default
- **Incremental Builds**: Supported

### 3. Preview Deployments

#### Automatic Previews
- Every push to non-production branches creates a preview
- Pull requests get unique preview URLs
- Comments automatically added to PRs

#### Preview URL Format
```
https://luxhedge-git-feature-branch-username.vercel.app
```

## 🔍 Monitoring & Analytics

### 1. Vercel Analytics

#### Enable Analytics
```json
{
  "analytics": {
    "id": "your-analytics-id"
  }
}
```

#### Core Web Vitals
- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift

### 2. Function Logs

#### Log Access
```bash
# View logs via CLI
vercel logs

# View logs in dashboard
Vercel Dashboard → Project → Functions → View Logs
```

#### Custom Logging
```javascript
// In api/index.js
console.log('API Request:', {
  method: req.method,
  path: req.path,
  timestamp: new Date().toISOString(),
  userAgent: req.get('User-Agent')
});
```

### 3. Error Tracking

#### Built-in Error Tracking
- Automatic error capture
- Stack trace preservation
- Performance impact monitoring

#### Custom Error Handling
```javascript
// In api/index.js
app.use((error, req, res, next) => {
  console.error('API Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});
```

## 🔐 Security Configuration

### 1. Environment Variable Security

#### Variable Encryption
- All environment variables encrypted at rest
- Separate encryption per environment
- Audit logging for variable access

#### Access Control
```bash
# Team member access levels
Owner: Full access to all variables
Member: Read access to non-sensitive variables
Viewer: No access to environment variables
```

### 2. Function Security

#### Security Headers
```javascript
// In api/index.js
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

#### Rate Limiting
```javascript
// Already implemented in api/index.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});

app.use('/api/', limiter);
```

### 3. CORS Configuration

#### Production CORS
```javascript
// In api/index.js
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'https://thedigitaltrading.com',
    'https://www.thedigitaltrading.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## 📊 Performance Optimization

### 1. Build Performance

#### Dependency Optimization
```json
{
  "scripts": {
    "build": "npm ci --production=false && npm run build:client",
    "build:client": "cd client && npm run build"
  }
}
```

#### Bundle Analysis
```bash
# Add to client package.json
"analyze": "npm run build && npx bundle-analyzer build/static/js/*.js"
```

### 2. Runtime Performance

#### Function Cold Starts
- Keep functions warm with periodic health checks
- Minimize dependency imports
- Use connection pooling for databases

#### Caching Strategy
```javascript
// In api/index.js
app.use('/api/static', express.static('public', {
  maxAge: '1y',
  etag: false
}));
```

### 3. Database Optimization

#### Connection Pooling
```javascript
// Already implemented in api/index.js
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  cachedDb = client.db();
  return cachedDb;
}
```

## 🧪 Testing Configuration

### 1. Preview Testing

#### Automated Testing
```yaml
# .github/workflows/preview-test.yml
name: Preview Testing
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Test Preview Deployment
        run: |
          # Wait for Vercel deployment
          # Run integration tests against preview URL
```

### 2. Production Testing

#### Health Checks
```javascript
// In api/index.js
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await connectToDatabase();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

#### Load Testing
```bash
# Use tools like Artillery or k6
artillery quick --count 10 --num 100 https://your-app.vercel.app/api/health
```

## 🔄 Continuous Integration

### 1. GitHub Actions Integration

#### Deployment Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 2. Quality Gates

#### Pre-deployment Checks
```json
{
  "scripts": {
    "pre-deploy": "npm run lint && npm run test && npm run build",
    "lint": "cd client && npm run lint",
    "test": "cd client && npm run test -- --coverage --watchAll=false"
  }
}
```

## 📋 Deployment Checklist

### Initial Setup
- [ ] Repository connected to Vercel
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] Team access configured

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables updated
- [ ] Database connections tested
- [ ] CORS settings verified
- [ ] Security headers configured

### Post-deployment
- [ ] Health check endpoint responding
- [ ] Frontend loading correctly
- [ ] API endpoints functional
- [ ] Authentication flow working
- [ ] Real-time features operational
- [ ] Monitoring enabled
- [ ] Error tracking configured

### Production Readiness
- [ ] Custom domain SSL verified
- [ ] Performance metrics baseline established
- [ ] Backup and recovery procedures documented
- [ ] Team training completed
- [ ] Support procedures established

## 🆘 Troubleshooting

### Common Configuration Issues

#### Build Failures
```bash
# Check build logs
vercel logs --follow

# Test build locally
vercel dev
```

#### Environment Variable Issues
```bash
# List all environment variables
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME
```

#### Function Timeout Issues
```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

### Performance Issues

#### Cold Start Optimization
```javascript
// Minimize imports in api/index.js
const express = require('express');
// Only import what you need
```

#### Memory Usage
```bash
# Monitor function memory usage
vercel logs --follow | grep "Memory Usage"
```

## 📞 Support Resources

### Documentation
- **Vercel Docs**: https://vercel.com/docs
- **Monorepo Guide**: https://vercel.com/docs/concepts/git/monorepos
- **Serverless Functions**: https://vercel.com/docs/concepts/functions/serverless-functions

### Community
- **Vercel Discord**: https://vercel.com/discord
- **GitHub Discussions**: Repository discussions
- **Stack Overflow**: Tag with `vercel`

---

**🎉 Your Vercel monorepo is now properly configured for full-stack deployment!**
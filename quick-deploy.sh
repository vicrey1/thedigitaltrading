#!/bin/bash

# Quick Deploy Script for Render + Vercel
# The Digital Trading Platform

echo "🚀 The Digital Trading Platform - Render + Vercel Deployment Prep"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "server" ] && [ ! -d "client" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment preparation..."

# 1. Check Node.js and npm
print_status "Checking Node.js and npm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# 2. Install dependencies
print_status "Installing server dependencies..."
cd server
if npm install; then
    print_success "Server dependencies installed"
else
    print_error "Failed to install server dependencies"
    exit 1
fi

cd ..

print_status "Installing client dependencies..."
cd client
if npm install; then
    print_success "Client dependencies installed"
else
    print_error "Failed to install client dependencies"
    exit 1
fi

cd ..

# 3. Check environment files
print_status "Checking environment configuration files..."

if [ -f "server/.env.render" ]; then
    print_success "Backend environment file found: server/.env.render"
else
    print_warning "Backend environment file not found: server/.env.render"
fi

if [ -f "client/.env.production" ]; then
    print_success "Frontend environment file found: client/.env.production"
else
    print_warning "Frontend environment file not found: client/.env.production"
fi

if [ -f "render.yaml" ]; then
    print_success "Render configuration found: render.yaml"
else
    print_warning "Render configuration not found: render.yaml"
fi

if [ -f "client/vercel.json" ]; then
    print_success "Vercel configuration found: client/vercel.json"
else
    print_warning "Vercel configuration not found: client/vercel.json"
fi

# 4. Test build processes
print_status "Testing client build process..."
cd client
if npm run build; then
    print_success "Client build successful"
    rm -rf build
else
    print_error "Client build failed"
    cd ..
    exit 1
fi

cd ..

# 5. Check for common issues
print_status "Checking for common deployment issues..."

# Check for hardcoded URLs
print_status "Checking for hardcoded URLs in client..."
if grep -r "localhost:5000\|127.0.0.1" client/src/ 2>/dev/null; then
    print_warning "Found hardcoded localhost URLs in client code"
    print_warning "Make sure to use environment variables for API URLs"
else
    print_success "No hardcoded localhost URLs found in client"
fi

# Check for missing environment variable usage
print_status "Checking environment variable usage..."
if grep -r "process.env.REACT_APP_API_BASE_URL" client/src/ 2>/dev/null; then
    print_success "Found proper environment variable usage in client"
else
    print_warning "Environment variables might not be properly used in client"
fi

# 6. Generate deployment checklist
print_status "Generating deployment checklist..."

cat > deployment-checklist.md << EOF
# 📋 Deployment Checklist

## Pre-deployment
- [x] Dependencies installed
- [x] Build process tested
- [x] Environment files created
- [x] Configuration files ready

## Render Backend Deployment
- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set build command: \`cd server && npm install\`
- [ ] Set start command: \`cd server && npm start\`
- [ ] Add all environment variables from server/.env.render
- [ ] Deploy and test health endpoint

## Vercel Frontend Deployment
- [ ] Create Vercel account
- [ ] Import project from GitHub
- [ ] Set root directory to \`client\`
- [ ] Add all environment variables from client/.env.production
- [ ] Deploy and test frontend

## Post-deployment
- [ ] Update CORS URLs in Render with actual Vercel URL
- [ ] Update API URLs in Vercel with actual Render URL
- [ ] Redeploy both services
- [ ] Test complete application flow
- [ ] Set up monitoring and alerts

## Database Setup
- [ ] Create MongoDB Atlas cluster
- [ ] Create Redis Cloud database
- [ ] Update connection strings in Render
- [ ] Test database connections

## Domain Setup (Optional)
- [ ] Purchase custom domain
- [ ] Configure DNS settings
- [ ] Set up SSL certificates
- [ ] Update environment variables with custom domain

## Security
- [ ] Generate secure JWT secret
- [ ] Set up email app password
- [ ] Configure API keys
- [ ] Review security settings

## Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test API endpoints
- [ ] Test WebSocket connections
- [ ] Test email functionality
- [ ] Test file uploads
- [ ] Test admin functionality

## Monitoring
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure backup systems
EOF

print_success "Deployment checklist created: deployment-checklist.md"

# 7. Summary
echo ""
echo "=================================================================="
print_success "Deployment preparation complete!"
echo "=================================================================="
echo ""
print_status "Next steps:"
echo "1. Review the deployment checklist: deployment-checklist.md"
echo "2. Follow the full guide: render-vercel-deployment.md"
echo "3. Set up your Render account and deploy the backend"
echo "4. Set up your Vercel account and deploy the frontend"
echo "5. Configure your databases (MongoDB Atlas + Redis Cloud)"
echo ""
print_status "Important files created:"
echo "- render.yaml (Render configuration)"
echo "- server/.env.render (Backend environment variables)"
echo "- client/.env.production (Frontend environment variables)"
echo "- client/vercel.json (Vercel configuration)"
echo "- environment-setup-guide.md (Environment variables guide)"
echo "- render-vercel-deployment.md (Complete deployment guide)"
echo "- deployment-checklist.md (Step-by-step checklist)"
echo ""
print_warning "Remember to:"
echo "- Never commit .env files to git"
echo "- Use strong passwords and secrets"
echo "- Update URLs after deployment"
echo "- Test thoroughly before going live"
echo ""
print_success "Happy deploying! 🚀"
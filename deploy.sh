#!/bin/bash

# The Digital Trading Platform - Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="thedigitaltrading"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Deploying The Digital Trading Platform - Environment: $ENVIRONMENT"

# Color codes for output
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if environment file exists
if [ ! -f "server/.env" ]; then
    print_warning "Environment file not found. Copying from .env.production..."
    if [ -f "server/.env.production" ]; then
        cp server/.env.production server/.env
        print_success "Environment file created from .env.production"
    else
        print_error "No environment file found. Please create server/.env"
        exit 1
    fi
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if ports are available
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Port 5001 is in use. Stopping existing containers..."
    docker-compose -f $COMPOSE_FILE down
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p server/uploads/{cars,kyc,support,announcements}
mkdir -p logs
mkdir -p backups

# Pull latest changes (if in git repository)
if [ -d ".git" ]; then
    print_status "Pulling latest changes from repository..."
    git pull origin main || print_warning "Failed to pull latest changes"
fi

# Build the application
print_status "Building Docker images..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Start the services
print_status "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Health check
print_status "Performing health checks..."

# Check if MongoDB is running
if docker-compose -f $COMPOSE_FILE ps mongo | grep -q "Up"; then
    print_success "MongoDB is running"
else
    print_error "MongoDB failed to start"
    docker-compose -f $COMPOSE_FILE logs mongo
    exit 1
fi

# Check if Redis is running
if docker-compose -f $COMPOSE_FILE ps redis | grep -q "Up"; then
    print_success "Redis is running"
else
    print_error "Redis failed to start"
    docker-compose -f $COMPOSE_FILE logs redis
    exit 1
fi

# Check if application is running
if docker-compose -f $COMPOSE_FILE ps app | grep -q "Up"; then
    print_success "Application is running"
else
    print_error "Application failed to start"
    docker-compose -f $COMPOSE_FILE logs app
    exit 1
fi

# Test API endpoint
print_status "Testing API endpoint..."
sleep 10
if curl -f http://localhost:5001/api/health >/dev/null 2>&1; then
    print_success "API health check passed"
else
    print_warning "API health check failed - checking logs..."
    docker-compose -f $COMPOSE_FILE logs app | tail -20
fi

# Display running services
print_status "Current running services:"
docker-compose -f $COMPOSE_FILE ps

# Display useful information
echo ""
print_success "🎉 Deployment completed!"
echo ""
echo "📊 Service Information:"
echo "  • Application: http://localhost:5001"
echo "  • MongoDB: localhost:27017"
echo "  • Redis: localhost:6379"
echo ""
echo "📝 Useful Commands:"
echo "  • View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  • Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  • Restart services: docker-compose -f $COMPOSE_FILE restart"
echo "  • View status: docker-compose -f $COMPOSE_FILE ps"
echo ""
echo "🔧 Next Steps:"
echo "  1. Configure your domain DNS to point to this server"
echo "  2. Set up SSL certificate with Let's Encrypt"
echo "  3. Configure Nginx reverse proxy"
echo "  4. Set up monitoring and backups"
echo ""

# Optional: Create admin user
read -p "Would you like to create an admin user? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating admin user..."
    docker-compose -f $COMPOSE_FILE exec app node scripts/create_admin.js
fi

# Optional: Run database migrations/setup
read -p "Would you like to run database setup scripts? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running database setup..."
    docker-compose -f $COMPOSE_FILE exec app node scripts/seed_plans.js
fi

print_success "Deployment script completed successfully! 🚀"
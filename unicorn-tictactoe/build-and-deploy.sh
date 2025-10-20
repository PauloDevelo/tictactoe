#!/bin/bash

# Frontend Build and Deploy Script for Tic-Tac-Toe Application
# This script builds the Angular frontend and deploys it to the production server

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

echo "========================================="
echo "Frontend Build and Deploy"
echo "========================================="

# Check if we're in the frontend directory
if [ ! -f "angular.json" ]; then
    print_error "This script must be run from the unicorn-tictactoe directory"
    exit 1
fi

# Get deployment parameters
read -p "Enter production domain (e.g., https://example.com): " PROD_URL

if [ -z "$PROD_URL" ];then
    print_error "Production URL is required"
    exit 1
fi

# Update production environment file
print_status "Updating production environment configuration..."
cat > src/environments/environment.prod.ts << EOF
export const environment = {
  production: true,
  wsUrl: '$PROD_URL'
};
EOF

print_status "Production environment updated with URL: $PROD_URL"

# Install dependencies
print_info "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm ci
else
    print_status "Dependencies already installed"
fi

# Run tests
print_info "Running tests..."
if npm test -- --watch=false --browsers=ChromeHeadless; then
    print_status "All tests passed"
else
    print_error "Tests failed"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

# Build for production
print_status "Building for production..."
npm run build -- --configuration=production

if [ ! -d "dist/unicorn-tictactoe/browser" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Build completed successfully"

# Copy build 
print_status "Copy to /var/www/tictactoe/frontend folder..."
sudo rm -rf /var/www/tictactoe/frontend/*
sudo cp -r dist/unicorn-tictactoe/browser/* /var/www/tictactoe/frontend 

# Set permissions
sudo chown -R tictactoe:tictactoe /var/www/tictactoe/frontend
sudo chmod -R 755 /var/www/tictactoe/frontend

echo ""
echo "========================================="
print_status "Frontend deployment completed!"
echo "========================================="
echo ""
print_info "Deployment details:"
echo "  - Timestamp: $TIMESTAMP"
echo "  - Production URL: $PROD_URL"
echo "  - Server: $SERVER_HOST"
echo ""
print_info "Verify deployment:"
echo "  - Visit: $PROD_URL"
echo "  - Check browser console for errors"
echo "  - Test WebSocket connection"
echo ""
print_warning "If you updated the Nginx configuration, reload it with:"
echo "  ssh $SERVER_HOST 'sudo systemctl reload nginx'"
echo ""

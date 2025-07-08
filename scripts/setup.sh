#!/bin/bash

# HTTSafety Pricing Dashboard - Setup Script
# This script automates the initial setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_header "HTTSafety Pricing Dashboard Setup"

# Step 1: Check Node.js version
print_info "Checking Node.js version..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        print_success "Node.js $NODE_VERSION is compatible"
    else
        print_error "Node.js $REQUIRED_VERSION or higher is required. Found: $NODE_VERSION"
        print_info "Please update Node.js: https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    print_info "Please install Node.js: https://nodejs.org/"
    exit 1
fi

# Step 2: Check npm
print_info "Checking npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION is available"
else
    print_error "npm is not available"
    exit 1
fi

# Step 3: Install dependencies
print_info "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 4: Setup environment file
print_info "Setting up environment configuration..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        print_success "Environment file created from template"
        print_warning "Please edit .env.local with your configuration"
    else
        print_error ".env.local.example not found"
        exit 1
    fi
else
    print_warning ".env.local already exists, skipping..."
fi

# Step 5: Check MySQL (optional)
print_info "Checking MySQL availability..."
if command -v mysql >/dev/null 2>&1; then
    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | cut -d',' -f1)
    print_success "MySQL $MYSQL_VERSION is available"
    
    # Ask if user wants to setup database
    echo ""
    read -p "Do you want to set up the MySQL database now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setting up database..."
        
        read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
        echo ""
        
        # Create database and user
        mysql -u root -p$MYSQL_ROOT_PASSWORD << EOF
CREATE DATABASE IF NOT EXISTS pricing_dashboard;
CREATE USER IF NOT EXISTS 'pricing_user'@'localhost' IDENTIFIED BY 'pricing_password';
GRANT ALL PRIVILEGES ON pricing_dashboard.* TO 'pricing_user'@'localhost';
FLUSH PRIVILEGES;
EOF
        
        if [ $? -eq 0 ]; then
            print_success "Database created successfully"
            
            # Import schema
            if [ -f "src/lib/database/schema.sql" ]; then
                mysql -u pricing_user -ppricing_password pricing_dashboard < src/lib/database/schema.sql
                if [ $? -eq 0 ]; then
                    print_success "Database schema imported successfully"
                else
                    print_error "Failed to import database schema"
                fi
            else
                print_warning "Database schema file not found"
            fi
        else
            print_error "Failed to create database"
        fi
    else
        print_info "Skipping database setup"
    fi
else
    print_warning "MySQL not found. Database features will be disabled."
    print_info "Install MySQL: https://dev.mysql.com/downloads/"
fi

# Step 6: Run tests
print_info "Running tests..."
if npm test -- --watchAll=false --passWithNoTests; then
    print_success "Tests passed"
else
    print_warning "Some tests failed, but setup can continue"
fi

# Step 7: Build the application
print_info "Building application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 8: Final checks
print_info "Running final health checks..."

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3000 is already in use"
    print_info "You may need to stop other services or use a different port"
else
    print_success "Port 3000 is available"
fi

# Success message
print_header "Setup Complete!"

echo ""
print_success "HTTSafety Pricing Dashboard is ready!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Edit .env.local with your configuration"
echo "   2. Start development server: npm run dev"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation:"
echo "   • User Guide: docs/USER_GUIDE.md"
echo "   • API Docs: docs/API.md"
echo "   • Installation: docs/INSTALLATION.md"
echo ""
echo "🛠️ Available Commands:"
echo "   • npm run dev          - Start development server"
echo "   • npm run build        - Build for production"
echo "   • npm run start        - Start production server"
echo "   • npm test             - Run tests"
echo "   • npm run test:coverage - Run tests with coverage"
echo ""
echo "🐳 Docker Alternative:"
echo "   • cd deployment/docker && docker-compose up -d"
echo ""

if [ -f ".env.local" ]; then
    print_warning "Remember to configure .env.local before starting the application"
fi

print_success "Happy price comparing! 💰"

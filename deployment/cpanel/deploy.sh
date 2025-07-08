#!/bin/bash

# HTTSafety Pricing Dashboard - cPanel Deployment Script
# This script helps deploy the application to a cPanel hosting environment

echo "🚀 HTTSafety Pricing Dashboard - cPanel Deployment"
echo "=================================================="

# Configuration
APP_NAME="pricing-dashboard"
BUILD_DIR="build"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Run tests
print_status "Running tests..."
npm test -- --watchAll=false
if [ $? -ne 0 ]; then
    print_warning "Tests failed, but continuing with deployment..."
fi

# Step 3: Build the application
print_status "Building application for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

# Step 4: Create deployment package
print_status "Creating deployment package..."
mkdir -p $BUILD_DIR

# Copy necessary files
cp -r .next $BUILD_DIR/
cp -r public $BUILD_DIR/
cp package.json $BUILD_DIR/
cp package-lock.json $BUILD_DIR/
cp next.config.js $BUILD_DIR/
cp -r src $BUILD_DIR/

# Create production environment file
cat > $BUILD_DIR/.env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=pricing_dashboard
RATE_LIMIT_REQUESTS_PER_MINUTE=10
SCRAPING_DELAY_MIN=1000
SCRAPING_DELAY_MAX=3000
SCRAPING_TIMEOUT=30000
EOF

# Create .htaccess for cPanel
cat > $BUILD_DIR/.htaccess << EOF
# HTTSafety Pricing Dashboard - cPanel Configuration

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Redirect all requests to index.html for SPA
RewriteEngine On
RewriteBase /

# Handle Angular and Vue.js routes
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF

# Create deployment instructions
cat > $BUILD_DIR/DEPLOYMENT_INSTRUCTIONS.md << EOF
# cPanel Deployment Instructions

## Prerequisites
1. Node.js support enabled in cPanel
2. MySQL database created
3. Database user with full privileges

## Deployment Steps

### 1. Upload Files
- Upload all files from this build directory to your cPanel public_html folder
- Ensure .htaccess file is uploaded

### 2. Database Setup
- Import the database schema: \`src/lib/database/schema.sql\`
- Update database credentials in .env.production

### 3. Install Dependencies
Run in cPanel Terminal or SSH:
\`\`\`bash
cd public_html
npm install --production
\`\`\`

### 4. Start Application
\`\`\`bash
npm start
\`\`\`

### 5. Configure Domain
- Point your domain to the public_html directory
- Update NEXT_PUBLIC_APP_URL in .env.production

## Troubleshooting

### Common Issues
1. **Node.js not available**: Contact hosting provider to enable Node.js
2. **Database connection failed**: Check credentials and database permissions
3. **Build errors**: Ensure all dependencies are installed

### Log Files
- Check cPanel Error Logs for detailed error information
- Application logs are in the console output

### Support
- Check README.md for detailed documentation
- Review API endpoints at /api/health for system status
EOF

# Step 5: Create archive
print_status "Creating deployment archive..."
tar -czf "${APP_NAME}-deployment-$(date +%Y%m%d-%H%M%S).tar.gz" -C $BUILD_DIR .

print_status "Deployment package created successfully!"
print_status "Archive: ${APP_NAME}-deployment-$(date +%Y%m%d-%H%M%S).tar.gz"
print_status "Build directory: $BUILD_DIR"

echo ""
echo "📋 Next Steps:"
echo "1. Upload the archive to your cPanel File Manager"
echo "2. Extract the archive in your public_html directory"
echo "3. Follow the instructions in DEPLOYMENT_INSTRUCTIONS.md"
echo "4. Set up your MySQL database using the schema.sql file"
echo "5. Update the .env.production file with your actual credentials"
echo ""
print_status "Deployment preparation complete!"

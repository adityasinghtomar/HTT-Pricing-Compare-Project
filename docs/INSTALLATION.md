# Installation Guide

This guide will help you set up the HTTSafety Pricing Dashboard on your local machine or server.

## Prerequisites

### Required Software
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **MySQL** 8.0 or higher (optional, for price caching)
- **Git** (for cloning the repository)

### System Requirements
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: 1GB free space
- **Network**: Internet connection for web scraping

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pricing-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database Configuration (Optional)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=pricing_dashboard

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Database Setup (Optional)

The application works without a database, but setting up MySQL enables:
- Price history tracking
- Performance analytics
- Caching for faster responses

### 1. Create Database
```sql
CREATE DATABASE pricing_dashboard;
CREATE USER 'pricing_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON pricing_dashboard.* TO 'pricing_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Import Schema
```bash
mysql -u pricing_user -p pricing_dashboard < src/lib/database/schema.sql
```

### 3. Test Connection
```bash
npm run db:test
```

## Production Deployment

### Option 1: Docker Deployment
```bash
cd deployment/docker
docker-compose up -d
```

### Option 2: cPanel Deployment
```bash
chmod +x deployment/cpanel/deploy.sh
./deployment/cpanel/deploy.sh
```

### Option 3: Manual Deployment
```bash
npm run build
npm start
```

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `` |
| `DB_NAME` | Database name | `pricing_dashboard` |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | API rate limit | `10` |
| `SCRAPING_DELAY_MIN` | Min delay between requests (ms) | `1000` |
| `SCRAPING_DELAY_MAX` | Max delay between requests (ms) | `3000` |
| `SCRAPING_TIMEOUT` | Request timeout (ms) | `30000` |

### Scraper Configuration

Each supplier scraper can be configured individually. See `src/lib/scrapers/` for implementation details.

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

#### 2. Database Connection Failed
- Verify MySQL is running
- Check credentials in `.env.local`
- Ensure database exists
- Test with: `npm run db:test`

#### 3. Scraping Errors
- Check internet connection
- Verify target websites are accessible
- Review rate limiting settings
- Check browser/Puppeteer dependencies

#### 4. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

#### 5. Permission Errors (Linux/Mac)
```bash
# Fix file permissions
chmod +x scripts/*.sh
chmod +x deployment/cpanel/deploy.sh
```

### Performance Optimization

#### 1. Enable Database Caching
Set up MySQL to cache frequently requested prices.

#### 2. Adjust Scraping Delays
Increase delays if getting blocked by websites:
```env
SCRAPING_DELAY_MIN=2000
SCRAPING_DELAY_MAX=5000
```

#### 3. Use Production Build
Always use production build for better performance:
```bash
npm run build
npm start
```

### Monitoring

#### Health Check
```bash
curl http://localhost:3000/api/health
```

#### View Logs
```bash
# Development
npm run dev

# Production (PM2 recommended)
pm2 start npm --name "pricing-dashboard" -- start
pm2 logs pricing-dashboard
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use strong database passwords
- Rotate API keys regularly

### 2. Rate Limiting
- Configure appropriate rate limits
- Monitor for abuse
- Use IP whitelisting if needed

### 3. HTTPS
- Always use HTTPS in production
- Configure SSL certificates
- Update `NEXT_PUBLIC_APP_URL` accordingly

### 4. Database Security
- Use dedicated database user
- Limit database privileges
- Enable MySQL security features
- Regular backups

## Support

### Getting Help
1. Check this documentation
2. Review the [API Documentation](./API.md)
3. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
4. Submit an issue on GitHub

### Useful Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm test             # Run tests
npm run test:coverage # Run tests with coverage

# Database
npm run db:setup     # Set up database
npm run db:test      # Test database connection

# Deployment
npm run build        # Build for production
```

# HTTSafety Pricing Dashboard

> **Professional price comparison tool for safety equipment across 8 major suppliers**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/adityasinghtomar/HTT-Pricing-Compare-Project)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/adityasinghtomar/HTT-Pricing-Compare-Project)
[![License](https://img.shields.io/badge/license-ISC-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

A comprehensive web application that automates price comparison for safety equipment across multiple suppliers, helping businesses make informed purchasing decisions.

## 🚀 Features

### Core Functionality
- **🔍 Multi-Supplier Price Comparison**: Real-time price fetching from 8 major suppliers
- **📊 Visual Price Analytics**: Interactive charts and comparison tables
- **⚡ Batch Processing**: Fetch prices for multiple products simultaneously
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **🔄 Real-time Updates**: Live price fetching with progress indicators

### Supported Suppliers
- **Amazon.ca** - Canada's largest online marketplace
- **ULINE** - Industrial and shipping supplies
- **Brogan Safety** - Safety equipment specialist
- **SB Simpson** - Safety and industrial products
- **SPI Health & Safety** - Health and safety equipment
- **Hazmasters** - Hazmat and safety solutions
- **Acklands Grainger** - Industrial supplies and equipment
- **Vallen** - Safety and industrial products

### Advanced Features
- **📈 Price History Tracking** (with database)
- **🛡️ Rate Limiting & Security**
- **🔧 RESTful API**
- **📋 Export Capabilities**
- **🎯 Smart Product Matching**
- **⚠️ Error Handling & Retry Logic**

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - Modern state management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - JavaScript runtime
- **MySQL** - Relational database (optional)
- **Puppeteer** - Web scraping engine

### DevOps & Testing
- **Jest** - Testing framework
- **Docker** - Containerization
- **ESLint** - Code linting
- **GitHub Actions** - CI/CD (ready)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **MySQL** 8.0+ (optional, for advanced features)

### One-Command Setup
```bash
# Clone and setup everything
git clone <repository-url> && cd pricing-dashboard && npm install && cp .env.local.example .env.local && npm run dev
```

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pricing-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your settings
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### 🐳 Docker Quick Start
```bash
cd deployment/docker
docker-compose up -d
```

### ☁️ One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adityasinghtomar/HTT-Pricing-Compare-Project)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/adityasinghtomar/HTT-Pricing-Compare-Project)

## Usage

### Adding Products

1. Use the "Add Product" form to input:
   - Brand (e.g., 3M, Honeywell)
   - Part Number (e.g., 2091, LL-1)
   - Size (optional, e.g., Small, Medium, Large)

2. Click "Add Product" to add it to your list

### Fetching Prices

- **Single Product**: Click "Fetch Prices" next to any product
- **All Products**: Click "Fetch All Prices" to process all products

### Viewing Results

The price comparison table shows:
- Product details (brand, part number, size)
- Prices from each supplier
- Availability status
- Links to product pages (when available)

## Sample Products

The application comes pre-loaded with sample products:

| Brand | Part Number | Size |
|-------|-------------|------|
| 3M | 2091 | |
| 3M | 2097 | |
| 3M | 6100 | Small |
| 3M | 6200 | Medium |
| 3M | 6300 | Large |
| 3M | 6700 | Small |
| 3M | 8511 | |
| Honeywell | LL-1 | |
| Honeywell | LL-30 | |
| Honeywell | LT-30 | |
| Honeywell | 7580P100 | |
| Honeywell | 7581P100 | |

## Development

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── fetch-prices/  # Price fetching endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ProductForm.tsx    # Product input form
│   ├── ProductList.tsx    # Product list table
│   └── PriceComparisonTable.tsx # Price comparison display
└── lib/
    └── scrapers/          # Web scraping modules
        ├── base.ts        # Base scraper class
        ├── amazon.ts      # Amazon.ca scraper
        ├── uline.ts       # ULINE scraper
        └── ...            # Other supplier scrapers
```

### Adding New Scrapers

1. Create a new scraper file in `src/lib/scrapers/`
2. Extend the `BaseScraper` class
3. Implement the `scrape()` method
4. Export the scraper function
5. Add it to the scrapers array in `src/app/api/fetch-prices/route.ts`

### Customization

- **Styling**: Modify Tailwind classes in components
- **Suppliers**: Add/remove scrapers as needed
- **Database**: Implement MySQL integration for price caching
- **Rate Limiting**: Adjust delays in scraper configurations

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Set the following in production:
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=your-domain.com`
- Database credentials (if using MySQL)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please contact the development team.

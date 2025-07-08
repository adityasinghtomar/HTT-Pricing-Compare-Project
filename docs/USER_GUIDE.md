# User Guide

Welcome to the HTTSafety Pricing Dashboard! This guide will help you get the most out of the application.

## Overview

The HTTSafety Pricing Dashboard is a web application that helps you compare prices for safety equipment across multiple suppliers. It automatically fetches current prices from 8 major suppliers and presents them in an easy-to-compare format.

## Getting Started

### Accessing the Dashboard
1. Open your web browser
2. Navigate to the application URL (e.g., `http://localhost:3000`)
3. You'll see the main dashboard with three sections:
   - Statistics overview
   - Product management
   - Price comparison

### Dashboard Overview

#### Statistics Panel
The top of the dashboard shows:
- **Total Products**: Number of products in your list
- **With Prices**: Number of products that have price data
- **Last Updated**: When prices were last fetched

## Managing Products

### Adding Products

1. **Locate the "Add Product" section**
2. **Fill in the required fields:**
   - **Brand**: Product manufacturer (e.g., "3M", "Honeywell")
   - **Part Number**: Manufacturer's part number (e.g., "2091", "LL-1")
   - **Size**: Optional size specification (e.g., "Small", "Medium", "Large")

3. **Click "Add Product"**

**Example:**
- Brand: `3M`
- Part Number: `6200`
- Size: `Medium`

### Pre-loaded Products

The application comes with sample products for testing:

| Brand | Part Number | Size | Description |
|-------|-------------|------|-------------|
| 3M | 2091 | - | P100 Particulate Filter |
| 3M | 2097 | - | P100 Filter with Organic Vapor Relief |
| 3M | 6100 | Small | Half Facepiece Respirator |
| 3M | 6200 | Medium | Half Facepiece Respirator |
| 3M | 6300 | Large | Half Facepiece Respirator |
| 3M | 6700 | Small | Full Facepiece Respirator |
| 3M | 8511 | - | N95 Respirator with Valve |
| Honeywell | LL-1 | - | Laser Light |
| Honeywell | LL-30 | - | Laser Light |
| Honeywell | LT-30 | - | Laser Target |
| Honeywell | 7580P100 | - | P100 Filter |
| Honeywell | 7581P100 | - | P100 Filter with Organic Vapor |

### Managing Your Product List

#### Removing Products
- Click the **"Remove"** button next to any product in the list
- The product will be immediately removed from your list

#### Clearing All Products
- Click the **"Clear All"** button to remove all products at once
- This action cannot be undone

## Fetching Prices

### Single Product Price Fetch
1. **Find the product** in your product list
2. **Click "Fetch Prices"** next to the product
3. **Wait for completion** (typically 30-60 seconds)
4. **View results** in the Price Comparison section

### Bulk Price Fetch
1. **Click "Fetch All Prices"** button
2. **Wait for completion** (this may take several minutes)
3. **Monitor progress** via the loading indicator
4. **View results** for all products

### Understanding the Fetching Process

The application searches each supplier's website for your product:

1. **Amazon.ca**: Searches product catalog
2. **ULINE**: Searches industrial supplies
3. **Brogan Safety**: Searches safety equipment
4. **SB Simpson**: Searches safety products
5. **SPI Health & Safety**: Searches health and safety items
6. **Hazmasters**: Searches hazmat equipment
7. **Acklands Grainger**: Searches industrial supplies
8. **Vallen**: Searches safety and industrial products

## Understanding Price Results

### Price Status Types

| Status | Meaning |
|--------|---------|
| **$XX.XX** | Valid price found |
| **Not Found** | Product not available on this supplier |
| **Error** | Technical error during search |
| **Timeout** | Search took too long and was cancelled |
| **Not Implemented** | Supplier scraper not yet available |

### Price Comparison Table

The price comparison table shows:
- **Product**: Brand, part number, and size
- **Supplier columns**: Price from each supplier
- **Links**: Click "View Product" to go to supplier's page
- **Availability**: Stock status when available

### Price Chart (Visual Comparison)

1. **Select a product** from the dropdown above the price table
2. **View the price chart** showing:
   - Bar chart comparing all prices
   - Lowest price highlighted in green
   - Highest price highlighted in red
   - Average price calculation
   - Price difference and percentage

## Tips for Best Results

### Product Information
- **Use exact part numbers** when possible
- **Include size specifications** for better matching
- **Check manufacturer websites** for correct part numbers

### Search Optimization
- **Be patient**: Each search takes 30-60 seconds per supplier
- **Avoid rapid requests**: Rate limiting prevents server overload
- **Check results carefully**: Verify prices on supplier websites

### Troubleshooting Common Issues

#### "Not Found" Results
- **Verify part number**: Check manufacturer specifications
- **Try variations**: Some suppliers use different formats
- **Check availability**: Product may be discontinued

#### "Error" Results
- **Try again later**: Temporary website issues
- **Check internet connection**: Ensure stable connectivity
- **Contact support**: If errors persist

#### Slow Performance
- **Fetch one product at a time**: For faster individual results
- **Use during off-peak hours**: Better website response times
- **Clear browser cache**: If interface seems slow

## Advanced Features

### Price History (Database Required)
When database is configured:
- **Historical tracking**: Prices are saved over time
- **Trend analysis**: See price changes
- **Performance metrics**: Track scraping success rates

### Export Options (Future Feature)
- **CSV export**: Download price comparisons
- **PDF reports**: Generate formatted reports
- **API access**: Integrate with other systems

## Best Practices

### Regular Price Updates
- **Weekly updates**: For active purchasing decisions
- **Monthly reviews**: For budget planning
- **Before major purchases**: For current pricing

### Data Management
- **Keep lists organized**: Remove outdated products
- **Verify critical prices**: Double-check important purchases
- **Save important data**: Export or screenshot key comparisons

### Supplier Relationships
- **Contact suppliers directly**: For volume pricing
- **Verify availability**: Before placing orders
- **Check shipping costs**: Not included in displayed prices

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between form fields |
| `Enter` | Submit product form |
| `Escape` | Close alerts/modals |

## Mobile Usage

The dashboard is responsive and works on mobile devices:
- **Touch-friendly**: Large buttons and touch targets
- **Scrollable tables**: Swipe to see all suppliers
- **Optimized layout**: Stacked on smaller screens

## Getting Help

### In-App Help
- **Hover tooltips**: Additional information on hover
- **Status messages**: Success and error notifications
- **Loading indicators**: Progress feedback

### Support Resources
- **User Guide**: This document
- **API Documentation**: For developers
- **Installation Guide**: For setup help
- **GitHub Issues**: For bug reports

### Common Questions

**Q: Why do some suppliers show "Not Implemented"?**
A: These scrapers are still in development. They will be added in future updates.

**Q: How often should I update prices?**
A: Depends on your needs. Weekly for active purchasing, monthly for planning.

**Q: Can I save my product lists?**
A: Currently, lists are saved in your browser. Database integration provides permanent storage.

**Q: Are the prices guaranteed accurate?**
A: Prices are fetched in real-time but should be verified on supplier websites before purchasing.

**Q: Can I add my own suppliers?**
A: Currently, suppliers are pre-configured. Custom supplier support may be added in future versions.

## Feedback and Suggestions

We welcome your feedback to improve the application:
- **Feature requests**: What would make this more useful?
- **Bug reports**: What isn't working as expected?
- **Usability feedback**: How can we make it easier to use?

Contact the development team through the appropriate channels for your organization.

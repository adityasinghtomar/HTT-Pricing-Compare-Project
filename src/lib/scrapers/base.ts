import puppeteer, { Browser, Page } from 'puppeteer'

export interface ScrapedData {
  price: string
  link?: string
  availability?: string
}

export interface Product {
  brand: string
  partNumber: string
  size?: string
}

export class BaseScraper {
  private browser: Browser | null = null

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })
    }
    return this.browser
  }

  async createPage(): Promise<Page> {
    const browser = await this.initBrowser()
    const page = await browser.newPage()

    // Set user agent to avoid detection - rotate between different agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ]
    const randomAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
    await page.setUserAgent(randomAgent)

    // Set viewport with slight randomization
    const width = 1366 + Math.floor(Math.random() * 100)
    const height = 768 + Math.floor(Math.random() * 100)
    await page.setViewport({ width, height })

    // Set additional headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    })

    // Set default timeout
    page.setDefaultTimeout(90000) // 90 seconds
    page.setDefaultNavigationTimeout(90000) // 90 seconds

    // Add random delay to avoid detection
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)) // 1-3 seconds

    return page
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  // Utility method to wait for random time to avoid detection
  async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  // Utility method to extract price from text
  extractPrice(text: string): string {
    if (!text) {
      console.log('extractPrice: No text provided')
      return 'Not Found'
    }

    console.log('extractPrice: Raw text:', JSON.stringify(text.substring(0, 100)))

    // Remove extra whitespace and normalize
    text = text.trim().replace(/\s+/g, ' ')

    // Look for price patterns - more flexible patterns
    const pricePatterns = [
      /\$[\d,]+\.?\d*/g,                    // $19.99, $19, $1,234.56
      /[\d,]+\.?\d*\s*\$/g,                 // 19.99$, 19$
      /CAD\s*\$?[\d,]+\.?\d*/g,             // CAD $19.99, CAD19.99
      /[\d,]+\.?\d*\s*CAD/g,                // 19.99 CAD, 19CAD
      /Price:\s*\$?[\d,]+\.?\d*/g,          // Price: $19.99, Price: 19.99
      /[\d,]+\.?\d*/g,                      // Just numbers: 19.99, 19., 1234
    ]

    for (const pattern of pricePatterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        let price = matches[0]
        console.log('extractPrice: Found price match:', price)

        // Clean up the price
        price = price.replace(/CAD|Price:/gi, '').trim()

        // Remove trailing $ if it exists (for patterns like "19.99$")
        if (price.endsWith('$')) {
          price = price.slice(0, -1).trim()
        }

        // Ensure we have a valid number
        const numericValue = parseFloat(price.replace(/[$,]/g, ''))
        if (!isNaN(numericValue) && numericValue > 0) {
          // Format as currency
          const finalPrice = price.startsWith('$') ? price : `$${price}`
          console.log('extractPrice: Final price:', finalPrice)
          return finalPrice
        }
      }
    }

    console.log('extractPrice: No price pattern found in text')
    return 'Not Found'
  }

  // Utility method to build search query
  buildSearchQuery(product: Product): string {
    let query = `${product.brand} ${product.partNumber}`
    if (product.size) {
      query += ` ${product.size}`
    }
    return query.trim()
  }

  // Utility method to check if product matches
  isProductMatch(productText: string, product: Product): boolean {
    const text = productText.toLowerCase()
    const brand = product.brand.toLowerCase()
    const partNumber = product.partNumber.toLowerCase()
    
    return text.includes(brand) && text.includes(partNumber)
  }
}

// Singleton instance
export const baseScraper = new BaseScraper()

// Cleanup on process exit
process.on('exit', () => {
  baseScraper.closeBrowser()
})

process.on('SIGINT', () => {
  baseScraper.closeBrowser()
  process.exit()
})

process.on('SIGTERM', () => {
  baseScraper.closeBrowser()
  process.exit()
})

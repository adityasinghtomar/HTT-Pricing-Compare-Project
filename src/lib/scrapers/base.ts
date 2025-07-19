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
  private static browser: Browser | null = null
  private static browserStartTime: number = 0
  private static readonly BROWSER_RESTART_INTERVAL = 5 * 60 * 1000 // 5 minutes

  async initBrowser(): Promise<Browser> {
    const now = Date.now()

    // Restart browser every 5 minutes to prevent memory leaks
    if (BaseScraper.browser && (now - BaseScraper.browserStartTime) > BaseScraper.BROWSER_RESTART_INTERVAL) {
      console.log('Restarting browser to prevent memory leaks...')
      try {
        await BaseScraper.browser.close()
      } catch (error) {
        console.warn('Error closing browser:', error)
      }
      BaseScraper.browser = null
    }

    if (!BaseScraper.browser) {
      BaseScraper.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          // Additional stealth mode arguments
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--no-default-browser-check',
          '--no-first-run',
          '--disable-default-apps'
        ]
      })
      BaseScraper.browserStartTime = now
      console.log('Browser launched successfully')
    }
    return BaseScraper.browser
  }

  async createPage(): Promise<Page> {
    const browser = await this.initBrowser()
    const page = await browser.newPage()

    // Enhanced stealth mode setup
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      })

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      })

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      })

      // Override the `chrome` property to make it seem more like a regular Chrome browser
      Object.defineProperty(window, 'chrome', {
        get: () => ({
          runtime: {},
        }),
      })

      // Override the `permissions` property
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters)
    })

    // Set user agent to avoid detection - rotate between different agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
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
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    })

    // Increased timeouts for better success rate
    page.setDefaultTimeout(90000) // 90 seconds (increased from 60)
    page.setDefaultNavigationTimeout(90000) // 90 seconds

    // Add random delay to avoid detection
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)) // 1-3 seconds

    return page
  }

  // Cleanup method to ensure pages are properly closed
  async closePage(page: Page): Promise<void> {
    try {
      if (page && !page.isClosed()) {
        await page.close()
      }
    } catch (error) {
      console.warn('Error closing page:', error)
    }
  }

  async closeBrowser(): Promise<void> {
    if (BaseScraper.browser) {
        await BaseScraper.browser.close();
        BaseScraper.browser = null;
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

  // Enhanced utility method to check if product matches
  isProductMatch(productText: string, product: Product): boolean {
    const text = productText.toLowerCase()
    const brand = product.brand.toLowerCase()
    const partNumber = product.partNumber.toLowerCase()

    // More flexible matching logic
    const hasExactPartNumber = text.includes(partNumber)
    const hasBrand = text.includes(brand)
    const hasPartNumberWithoutSpaces = text.includes(partNumber.replace(/\s+/g, ''))
    const hasPartNumberWithDashes = text.includes(partNumber.replace(/\s+/g, '-'))
    const hasPartNumberWithUnderscores = text.includes(partNumber.replace(/\s+/g, '_'))

    // Check for partial matches (useful for products like "3M 2091" vs "2091")
    const partNumberWords = partNumber.split(/\s+/)
    const hasAllPartNumberWords = partNumberWords.every(word => text.includes(word))

    // Return true if we have brand + part number, or just a strong part number match
    return (hasBrand && hasExactPartNumber) ||
           (hasBrand && hasPartNumberWithoutSpaces) ||
           (hasBrand && hasPartNumberWithDashes) ||
           (hasBrand && hasPartNumberWithUnderscores) ||
           (hasBrand && hasAllPartNumberWords) ||
           hasExactPartNumber ||
           hasPartNumberWithoutSpaces
  }

  // Retry mechanism for failed scraping attempts
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    delayMs: number = 2000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`Retry attempt ${attempt - 1}/${maxRetries}`)
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
        }
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.log(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error')

        if (attempt === maxRetries + 1) {
          throw lastError
        }
      }
    }

    throw lastError || new Error('Operation failed after retries')
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

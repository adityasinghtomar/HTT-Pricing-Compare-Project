import { BaseScraper, ScrapedData, Product } from './base'

class HazmastersScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    return this.retryOperation(async () => {
      const page = await this.createPage()

      try {
        const searchQuery = this.buildSearchQuery(product)
        const searchUrl = `https://www.hazmasters.com/products?q=${encodeURIComponent(searchQuery)}`

        console.log(`Hazmasters: Searching for "${searchQuery}"`)

        // Increased timeout and better wait strategy
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 120000 })

        // Additional wait for slow loading
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Wait for search results
        try {
          await page.waitForSelector('.product-item, .search-results, .product-grid, .no-results', { timeout: 10000 })
        } catch {
          // Continue if selectors not found
        }

        // Check if there are no results
        const noResults = await page.$('.no-results, .no-search-results')
        if (noResults) {
          return {
            price: 'Not Found',
            availability: 'Product not found'
          }
        }

      // Extract product information
      const results = await page.evaluate((product: any) => {
        const items = document.querySelectorAll('.product-item, .product-card, .grid-item, .search-result, [class*="product"]')
        const results: Array<{title: string, price: string, link: string}> = []

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const titleElement = item.querySelector('.product-title, .item-title, h3, h4, .product-name') ||
                              item.querySelector('a[href*="/product/"]') ||
                              item.querySelector('[class*="title"]')
          const priceElement = item.querySelector('.price, .product-price, .item-price, [class*="price"]') ||
                              item.querySelector('.money, .cost')
          const linkElement = item.querySelector('a[href*="/product/"]') ||
                             item.querySelector('a[href*="/products/"]') ||
                             item.querySelector('a')

          if (titleElement) {
            const title = titleElement.textContent?.trim() || ''
            const price = priceElement?.textContent?.trim() || ''
            const link = linkElement?.getAttribute('href') || ''

            // Check if this product matches our search
            const titleLower = title.toLowerCase()
            const brandLower = product.brand.toLowerCase()
            const partNumberLower = product.partNumber.toLowerCase()

            if (titleLower.includes(brandLower) && titleLower.includes(partNumberLower)) {
              results.push({
                title,
                price,
                link: link.startsWith('/') ? `https://www.hazmasters.com${link}` : link
              })
            }
          }
        }

        return results
      }, product)

      if (results.length > 0) {
        const bestMatch = results[0]
        const cleanPrice = this.extractPrice(bestMatch.price)

        return {
          price: cleanPrice,
          link: bestMatch.link,
          availability: 'Available'
        }
      }

        return {
          price: 'Not Found',
          availability: 'Product not found'
        }

      } catch (error) {
        console.error('Hazmasters scraping error:', error)
        throw error // Re-throw to trigger retry
      } finally {
        await this.closePage(page)
      }
    }, 2, 5000) // Retry up to 2 times with 5 second delays
  }
}

const hazmastersScraper = new HazmastersScraper()

export async function scrapeHazmasters(product: Product): Promise<ScrapedData> {
  return hazmastersScraper.scrape(product)
}

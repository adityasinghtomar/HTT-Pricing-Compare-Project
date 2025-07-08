import { BaseScraper, ScrapedData, Product } from './base'

class VallenScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    const page = await this.createPage()

    try {
      const searchQuery = this.buildSearchQuery(product)
      const searchUrl = `https://www.vallen.ca/search/${encodeURIComponent(searchQuery)}`

      console.log(`Vallen: Searching for "${searchQuery}"`)
      console.log(`Vallen: Search URL: ${searchUrl}`)

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      // Log page info
      const pageTitle = await page.title()
      console.log(`Vallen: Page loaded - Title: "${pageTitle}"`)

      // Wait for search results
      try {
        await page.waitForSelector('.product-item, .search-results, .product-grid', { timeout: 10000 })
      } catch {
        // Continue if selectors not found
      }

      // Extract product information
      const results = await page.evaluate((product: any) => {
        const items = document.querySelectorAll('.search-result, .product-item, .product-card, .search-item, [class*="result"]')
        const results: Array<{title: string, price: string, link: string}> = []

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const titleElement = item.querySelector('.product-title, .item-title, h3, h4, .product-name') ||
                              item.querySelector('a[href*="/products/"]') ||
                              item.querySelector('[class*="title"]')
          const priceElement = item.querySelector('.price, .product-price, .item-price, [class*="price"]') ||
                              item.querySelector('.money, .cost')
          const linkElement = item.querySelector('a[href*="/products/"]') ||
                             item.querySelector('a[href*="/product/"]') ||
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
                link: link.startsWith('/') ? `https://www.vallen.ca${link}` : link
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
      console.error('Vallen scraping error:', error)
      return {
        price: 'Error',
        availability: 'Scraping failed'
      }
    } finally {
      await page.close()
    }
  }
}

const vallenScraper = new VallenScraper()

export async function scrapeVallen(product: Product): Promise<ScrapedData> {
  return vallenScraper.scrape(product)
}

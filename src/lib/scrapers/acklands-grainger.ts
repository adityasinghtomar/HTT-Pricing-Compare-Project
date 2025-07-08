import { BaseScraper, ScrapedData, Product } from './base'

class AcklandsGraingerScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    const page = await this.createPage()

    try {
      const searchQuery = this.buildSearchQuery(product)
      const searchUrl = `https://www.grainger.ca/en/search/?searchBar=true&nls=NLSAA_NA-1&text=${encodeURIComponent(searchQuery)}`

      console.log(`Acklands Grainger: Searching for "${searchQuery}"`)
      console.log(`Acklands Grainger: Search URL: ${searchUrl}`)

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      // Log page info
      const pageTitle = await page.title()
      console.log(`Acklands Grainger: Page loaded - Title: "${pageTitle}"`)

      // Wait for search results
      try {
        await page.waitForSelector('.search-results-container, .product-item, .search-result', { timeout: 10000 })
      } catch {
        // Continue if selectors not found
      }

      // Check how many search result items we found
      const itemCount = await page.evaluate(() => {
        const items1 = document.querySelectorAll('.search-result')
        const items2 = document.querySelectorAll('.product-item')
        const items3 = document.querySelectorAll('[data-testid="search-result"]')
        return {
          searchResult: items1.length,
          productItem: items2.length,
          dataTestId: items3.length,
          total: document.querySelectorAll('.search-result, .product-item, [data-testid="search-result"]').length
        }
      })
      console.log(`Acklands Grainger: Found search result items:`, itemCount)

      // Extract product information
      const results = await page.evaluate((product: any) => {
        const items = document.querySelectorAll('.search-result, .product-item, [data-testid="search-result"]')
        const results: Array<{title: string, price: string, link: string}> = []

        console.log(`Acklands Grainger evaluate: Processing ${items.length} items`)

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const titleElement = item.querySelector('.search-result-title, .product-title, h3, h4, a[href*="/product/"]') ||
                              item.querySelector('[data-testid="product-title"]')
          const priceElement = item.querySelector('.price, .product-price, [data-testid="price"]') ||
                              item.querySelector('[class*="price"]')
          const linkElement = item.querySelector('a[href*="/product/"]') ||
                             item.querySelector('a[href*="/p/"]') ||
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
                link: link.startsWith('/') ? `https://www.grainger.ca${link}` : link
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
      console.error('Acklands Grainger scraping error:', error)
      return {
        price: 'Error',
        availability: 'Scraping failed'
      }
    } finally {
      await page.close()
    }
  }
}

const acklandsGraingerScraper = new AcklandsGraingerScraper()

export async function scrapeAcklandsGrainger(product: Product): Promise<ScrapedData> {
  return acklandsGraingerScraper.scrape(product)
}

import { BaseScraper, ScrapedData, Product } from './base'

class BroganSafetyScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    const page = await this.createPage()

    try {
      const searchQuery = this.buildSearchQuery(product)
      const searchUrl = `https://www.brogansafety.com/search?criteria=${encodeURIComponent(searchQuery)}`

      console.log(`Brogan Safety: Searching for "${searchQuery}"`)
      console.log(`Brogan Safety: Search URL: ${searchUrl}`)

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      // Log page info
      const pageTitle = await page.title()
      console.log(`Brogan Safety: Page loaded - Title: "${pageTitle}"`)

      // Wait for search results or no results message
      try {
        await page.waitForSelector('.product-item, .search-results, .no-results', { timeout: 10000 })
      } catch {
        // Continue if selectors not found
      }

      // Check how many search result items we found
      const itemCount = await page.evaluate(() => {
        const items1 = document.querySelectorAll('.product-item')
        const items2 = document.querySelectorAll('.grid-product')
        const items3 = document.querySelectorAll('[data-product-id]')
        return {
          productItem: items1.length,
          gridProduct: items2.length,
          dataProductId: items3.length,
          total: document.querySelectorAll('.product-item, .product-card, .search-result-item, .grid-product, [data-product-id]').length
        }
      })
      console.log(`Brogan Safety: Found search result items:`, itemCount)

      // Extract product information
      const results = await page.evaluate((product: any) => {
        const items = document.querySelectorAll('.product-item, .product-card, .search-result-item, .grid-product, [data-product-id]')
        const results: Array<{title: string, price: string, link: string}> = []

        console.log(`Brogan Safety evaluate: Processing ${items.length} items`)

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

            console.log(`Brogan Safety evaluate: Item ${i} - Title: "${title.substring(0, 50)}", Price: "${price}", PriceElement: ${priceElement?.className || 'none'}`)

            // Check if this product matches our search
            const titleLower = title.toLowerCase()
            const brandLower = product.brand.toLowerCase()
            const partNumberLower = product.partNumber.toLowerCase()

            if (titleLower.includes(brandLower) && titleLower.includes(partNumberLower)) {
              console.log(`Brogan Safety evaluate: MATCH FOUND - Title: "${title}", Price: "${price}"`)
              results.push({
                title,
                price,
                link: link.startsWith('/') ? `https://www.brogansafety.com${link}` : link
              })
            }
          } else {
            console.log(`Brogan Safety evaluate: Item ${i} - No title element found`)
            // Log the HTML structure for debugging
            console.log(`Brogan Safety evaluate: Item ${i} HTML:`, item.outerHTML.substring(0, 200))
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
      console.error('Brogan Safety scraping error:', error)
      return {
        price: 'Error',
        availability: 'Scraping failed'
      }
    } finally {
      await page.close()
    }
  }
}

const broganSafetyScraper = new BroganSafetyScraper()

export async function scrapeBroganSafety(product: Product): Promise<ScrapedData> {
  return broganSafetyScraper.scrape(product)
}

import { BaseScraper, ScrapedData, Product } from './base'

class SBSimpsonScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    const page = await this.createPage()

    try {
      const searchQuery = this.buildSearchQuery(product)
      const searchUrl = `https://sbsimpson.com/expertrec-search/?q=${encodeURIComponent(searchQuery)}`

      console.log(`SB Simpson: Searching for "${searchQuery}"`)
      console.log(`SB Simpson: Search URL: ${searchUrl}`)

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      // Log page info
      const pageTitle = await page.title()
      console.log(`SB Simpson: Page loaded - Title: "${pageTitle}"`)

      // Wait for search results
      try {
        await page.waitForSelector('.product-item, .search-results, .product-grid', { timeout: 10000 })
      } catch {
        // Continue if selectors not found
      }

      // Check how many search result items we found
      const itemCount = await page.evaluate(() => {
        const items1 = document.querySelectorAll('.search-result')
        const items2 = document.querySelectorAll('.product-item')
        const items3 = document.querySelectorAll('[class*="result"]')
        return {
          searchResult: items1.length,
          productItem: items2.length,
          resultClass: items3.length,
          total: document.querySelectorAll('.search-result, .product-item, .product-card, .grid-item, [class*="result"]').length
        }
      })
      console.log(`SB Simpson: Found search result items:`, itemCount)

      // Extract product information
      const results = await page.evaluate((product: any) => {
        const items = document.querySelectorAll('.search-result, .product-item, .product-card, .grid-item, [class*="result"]')
        const results: Array<{title: string, price: string, link: string}> = []

        console.log(`SB Simpson evaluate: Processing ${items.length} items`)

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

            console.log(`SB Simpson evaluate: Item ${i} - Title: "${title.substring(0, 50)}", Price: "${price}", PriceElement: ${priceElement?.className || 'none'}`)

            // Check if this product matches our search
            const titleLower = title.toLowerCase()
            const brandLower = product.brand.toLowerCase()
            const partNumberLower = product.partNumber.toLowerCase()

            if (titleLower.includes(brandLower) && titleLower.includes(partNumberLower)) {
              console.log(`SB Simpson evaluate: MATCH FOUND - Title: "${title}", Price: "${price}"`)
              results.push({
                title,
                price,
                link: link.startsWith('/') ? `https://sbsimpson.com${link}` : link
              })
            }
          } else {
            console.log(`SB Simpson evaluate: Item ${i} - No title element found`)
            // Log the HTML structure for debugging
            console.log(`SB Simpson evaluate: Item ${i} HTML:`, item.outerHTML.substring(0, 200))
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
      console.error('SB Simpson scraping error:', error)
      return {
        price: 'Error',
        availability: 'Scraping failed'
      }
    } finally {
      await page.close()
    }
  }
}

const sbSimpsonScraper = new SBSimpsonScraper()

export async function scrapeSBSimpson(product: Product): Promise<ScrapedData> {
  return sbSimpsonScraper.scrape(product)
}

import { BaseScraper, ScrapedData, Product } from './base'

class UlineScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    const page = await this.createPage()
    
    try {
      const searchQuery = this.buildSearchQuery(product)
      const searchUrl = `https://www.uline.ca/Product/AdvSearchResult?keywords=${encodeURIComponent(searchQuery)}`

      console.log(`ULINE: Searching for "${searchQuery}"`)
      console.log(`ULINE: Search URL: ${searchUrl}`)

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

      // Add delay to let page settle
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log page info with error handling
      let pageTitle = ''
      try {
        pageTitle = await page.title()
        console.log(`ULINE: Page loaded - Title: "${pageTitle}"`)

        // Check for CAPTCHA/challenge page
        if (pageTitle.includes('Challenge') || pageTitle.includes('Validation')) {
          console.log(`ULINE: CAPTCHA/Challenge page detected, skipping...`)
          return {
            price: 'Not Available',
            availability: 'CAPTCHA protection detected'
          }
        }
      } catch (titleError) {
        console.log(`ULINE: Error getting page title:`, titleError instanceof Error ? titleError.message : 'Unknown error')
        return {
          price: 'Not Available',
          availability: 'Page navigation error'
        }
      }

      // Wait for search results or no results message
      try {
        await page.waitForSelector('.search-results, .product-item, .no-results, .search-result', { timeout: 10000 })
        console.log(`ULINE: Search results loaded successfully`)
      } catch (waitError) {
        console.log(`ULINE: Timeout waiting for search results:`, waitError instanceof Error ? waitError.message : 'Unknown error')
      }

      // Check if there are no results
      const noResults = await page.$('.no-results, .no-search-results')
      if (noResults) {
        return {
          price: 'Not Found',
          availability: 'Product not found'
        }
      }

      // Check how many search result items we found
      const itemCount = await page.evaluate(() => {
        const items1 = document.querySelectorAll('.search-result')
        const items2 = document.querySelectorAll('.product-item')
        const items3 = document.querySelectorAll('[class*="search-result"]')
        return {
          searchResult: items1.length,
          productItem: items2.length,
          searchResultClass: items3.length,
          total: document.querySelectorAll('.search-result, .product-item, .search-result-item, [class*="search-result"]').length
        }
      })
      console.log(`ULINE: Found search result items:`, itemCount)

      // Extract product information
      const results = await page.evaluate((product: any) => {
        const items = document.querySelectorAll('.search-result, .product-item, .search-result-item, [class*="search-result"]')
        const results: Array<{title: string, price: string, link: string, partNumber: string}> = []

        console.log(`ULINE evaluate: Processing ${items.length} items`)

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          // Try different selectors for title
          const titleElement = item.querySelector('.product-title, .item-title, h3, h4, .title') ||
                              item.querySelector('a[href*="/Product/Detail"]') ||
                              item.querySelector('[class*="title"]')

          // Try different selectors for price
          const priceElement = item.querySelector('.price, .product-price, .item-price') ||
                              item.querySelector('[class*="price"]') ||
                              item.querySelector('.cost')

          // Try different selectors for part number
          const partElement = item.querySelector('.model, .part-number, .item-number') ||
                             item.querySelector('[class*="model"], [class*="part"]') ||
                             item.querySelector('.sku')

          // Try different selectors for link
          const linkElement = item.querySelector('a[href*="/Product/Detail"]') ||
                             item.querySelector('a[href*="/Product/"]') ||
                             item.querySelector('a')

          if (titleElement) {
            const title = titleElement.textContent?.trim() || ''
            const price = priceElement?.textContent?.trim() || ''
            const partNumber = partElement?.textContent?.trim() || ''
            const link = linkElement?.getAttribute('href') || ''

            // Check if this product matches our search
            const titleLower = title.toLowerCase()
            const partLower = partNumber.toLowerCase()
            const brandLower = product.brand.toLowerCase()
            const partNumberLower = product.partNumber.toLowerCase()

            if ((titleLower.includes(brandLower) && titleLower.includes(partNumberLower)) ||
                (partLower.includes(partNumberLower)) ||
                (titleLower.includes(partNumberLower))) {
              results.push({
                title,
                price,
                partNumber,
                link: link.startsWith('/') ? `https://www.uline.ca${link}` : link
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
      console.error('ULINE scraping error:', error)
      return {
        price: 'Error',
        availability: 'Scraping failed'
      }
    } finally {
      await page.close()
    }
  }
}

const ulineScraper = new UlineScraper()

export async function scrapeUline(product: Product): Promise<ScrapedData> {
  return ulineScraper.scrape(product)
}

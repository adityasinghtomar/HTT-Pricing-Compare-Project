import { BaseScraper, ScrapedData, Product } from './base'

class BroganSafetyScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    const page = await this.createPage()

    try {
      const searchQuery = this.buildSearchQuery(product)
      const searchUrl = `https://www.brogansafety.com/search?type=product&q=${encodeURIComponent(searchQuery)}`

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
      console.log(`Brogan Safety: About to extract product information...`)
      const results = await page.evaluate((product: any) => {
        // Try different selectors for Brogan Safety
        const items = document.querySelectorAll('[data-product-id], .product, .item, div[class*="product"], div[class*="item"], [class*="grid"]')
        const results: Array<{title: string, price: string, link: string}> = []

        console.log(`Brogan Safety evaluate: Processing ${items.length} items`)

        // Log first few items for debugging
        for (let i = 0; i < Math.min(items.length, 3); i++) {
          const item = items[i]
          console.log(`Brogan Safety evaluate: Item ${i} HTML:`, item.outerHTML.substring(0, 300))
          console.log(`Brogan Safety evaluate: Item ${i} Classes:`, item.className)
          console.log(`Brogan Safety evaluate: Item ${i} Text:`, item.textContent?.substring(0, 100))
        }

        for (let i = 0; i < Math.min(items.length, 5); i++) { // Limit for debugging
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

            // Check if this product matches our search (more flexible matching)
            const titleLower = title.toLowerCase()
            const brandLower = product.brand.toLowerCase()
            const partNumberLower = product.partNumber.toLowerCase()

            console.log(`Brogan Safety evaluate: Checking match - Title: "${titleLower}", Brand: "${brandLower}", Part: "${partNumberLower}"`)

            // More flexible matching - check for brand OR part number
            const brandMatch = titleLower.includes(brandLower) || titleLower.includes(brandLower.replace(/\s+/g, ''))
            const partMatch = titleLower.includes(partNumberLower) || titleLower.includes(partNumberLower.replace(/\s+/g, ''))

            if (brandMatch || partMatch) {
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
            console.log(`Brogan Safety evaluate: Item ${i} HTML:`, item.outerHTML.substring(0, 300))
            console.log(`Brogan Safety evaluate: Item ${i} Classes:`, item.className)
            console.log(`Brogan Safety evaluate: Item ${i} Text:`, item.textContent?.substring(0, 100))
          }
        }

        return results
      }, product)

      console.log(`Brogan Safety: page.evaluate completed, found ${results.length} matching products`)
      console.log(`Brogan Safety: Results:`, results)

      if (results.length > 0) {
        // Find the best match with a valid link
        const bestMatch = results.find(result => result.link && result.link.trim() !== '') || results[0]
        let cleanPrice = this.extractPrice(bestMatch.price)

        console.log(`Brogan Safety: Best match selected - Title: "${bestMatch.title.substring(0, 50)}", Link: "${bestMatch.link}", Price: "${bestMatch.price}"`)

        // If no price found on search page, try to get it from product page
        if ((!cleanPrice || cleanPrice === 'Not Found') && bestMatch.link && bestMatch.link.trim() !== '') {
          console.log(`Brogan Safety: No price on search page, trying product page: ${bestMatch.link}`)
          try {
            await page.goto(bestMatch.link, { waitUntil: 'domcontentloaded', timeout: 30000 })
            await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for page to load

            const productPagePrice = await page.evaluate(() => {
              // Try multiple price selectors
              const selectors = [
                '.price',
                '.product-price',
                '.regular-price',
                '.sale-price',
                '[class*="price"]',
                '.money',
                '.amount'
              ]

              for (const selector of selectors) {
                const element = document.querySelector(selector)
                if (element && element.textContent && element.textContent.includes('$')) {
                  return element.textContent.trim()
                }
              }

              return ''
            })

            console.log(`Brogan Safety: Product page price: "${productPagePrice}"`)
            if (productPagePrice) {
              cleanPrice = this.extractPrice(productPagePrice)
              console.log(`Brogan Safety: Extracted price: "${cleanPrice}"`)
            }
          } catch (error) {
            console.log(`Brogan Safety: Error loading product page:`, error instanceof Error ? error.message : 'Unknown error')
          }
        }

        const finalPrice = cleanPrice && cleanPrice !== 'Not Found' ? cleanPrice : 'Not Found'
        console.log(`Brogan Safety: Final result - Price: "${finalPrice}", Link: "${bestMatch.link}"`)

        return {
          price: finalPrice,
          link: bestMatch.link,
          availability: finalPrice !== 'Not Found' ? 'Available' : 'Product not found'
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

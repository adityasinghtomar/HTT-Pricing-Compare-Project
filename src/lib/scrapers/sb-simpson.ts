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
      console.log(`SB Simpson: About to extract product information...`)
      const results = await page.evaluate((product: any) => {
        // SB Simpson specific selectors (WordPress/WooCommerce)
        const items = document.querySelectorAll('.woocommerce-loop-product, .product, [class*="result"], .result, .item, div[class*="product"], div[class*="item"]')
        const results: Array<{title: string, price: string, link: string}> = []

        console.log(`SB Simpson evaluate: Processing ${items.length} items`)

        // Log first few items for debugging
        for (let i = 0; i < Math.min(items.length, 3); i++) {
          const item = items[i]
          console.log(`SB Simpson evaluate: Item ${i} HTML:`, item.outerHTML.substring(0, 300))
          console.log(`SB Simpson evaluate: Item ${i} Classes:`, item.className)
          console.log(`SB Simpson evaluate: Item ${i} Text:`, item.textContent?.substring(0, 100))
        }

        for (let i = 0; i < Math.min(items.length, 10); i++) { // Limit for debugging
          const item = items[i]
          // SB Simpson specific title selectors (WordPress/WooCommerce)
          const titleElement = item.querySelector('.woocommerce-loop-product__title, .product-title, .item-title, h3, h4, .product-name') ||
                              item.querySelector('a[href*="/product/"]') ||
                              item.querySelector('[class*="title"], a, span')
          // SB Simpson specific price selectors (WordPress/WooCommerce)
          const priceElement = item.querySelector('.er_item_price_container, .woocommerce-Price-amount.amount, .price, [class*="price"]') ||
                              item.querySelector('.er_item_price_container *, .woocommerce-Price-amount *, .money, .cost')
          const linkElement = item.querySelector('a[href*="/product/"]') ||
                             item.querySelector('a[href*="/products/"]') ||
                             item.querySelector('a')

          if (titleElement) {
            const title = titleElement.textContent?.trim() || ''
            const price = priceElement?.textContent?.trim() || ''
            const link = linkElement?.getAttribute('href') || ''

            console.log(`SB Simpson evaluate: Item ${i} - Title: "${title.substring(0, 50)}", Price: "${price}", PriceElement: ${priceElement?.className || 'none'}`)

            // Check if this product matches our search (more flexible matching)
            const titleLower = title.toLowerCase()
            const brandLower = product.brand.toLowerCase()
            const partNumberLower = product.partNumber.toLowerCase()

            console.log(`SB Simpson evaluate: Checking match - Title: "${titleLower}", Brand: "${brandLower}", Part: "${partNumberLower}"`)

            // More flexible matching - check for brand OR part number
            const brandMatch = titleLower.includes(brandLower) || titleLower.includes(brandLower.replace(/\s+/g, ''))
            const partMatch = titleLower.includes(partNumberLower) || titleLower.includes(partNumberLower.replace(/\s+/g, ''))

            if (brandMatch || partMatch) {
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
            console.log(`SB Simpson evaluate: Item ${i} HTML:`, item.outerHTML.substring(0, 300))
            console.log(`SB Simpson evaluate: Item ${i} Classes:`, item.className)
            console.log(`SB Simpson evaluate: Item ${i} Text:`, item.textContent?.substring(0, 100))
          }
        }

        return results
      }, product)

      console.log(`SB Simpson: page.evaluate completed, found ${results.length} matching products`)
      console.log(`SB Simpson: Results:`, results)

      if (results.length > 0) {
        // Find the best match with a valid link
        const bestMatch = results.find(result => result.link && result.link.trim() !== '') || results[0]
        let cleanPrice = this.extractPrice(bestMatch.price)

        console.log(`SB Simpson: Best match selected - Title: "${bestMatch.title.substring(0, 50)}", Link: "${bestMatch.link}", Price: "${bestMatch.price}"`)

        // If no price found on search page, try to get it from product page
        if ((!cleanPrice || cleanPrice === 'Not Found') && bestMatch.link && bestMatch.link.trim() !== '') {
          console.log(`SB Simpson: No price on search page, trying product page: ${bestMatch.link}`)
          try {
            await page.goto(bestMatch.link, { waitUntil: 'domcontentloaded', timeout: 30000 })
            await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for page to load

            const productPagePrice = await page.evaluate(() => {
              // Try multiple WooCommerce and general price selectors
              const selectors = [
                '.woocommerce-Price-amount.amount',
                '.woocommerce-Price-amount',
                '.price .amount',
                '.price',
                '[class*="price"]',
                '.product-price',
                '.regular-price',
                '.sale-price'
              ]

              for (const selector of selectors) {
                const element = document.querySelector(selector)
                if (element && element.textContent && element.textContent.includes('$')) {
                  return element.textContent.trim()
                }
              }

              // Fallback: look for any element containing a price pattern
              const allElements = document.querySelectorAll('*')
              for (let i = 0; i < allElements.length; i++) {
                const element = allElements[i]
                const text = element.textContent || ''
                if (text.match(/\$\d+\.?\d*/)) {
                  return text.trim()
                }
              }

              return ''
            })

            console.log(`SB Simpson: Product page price: "${productPagePrice}"`)
            if (productPagePrice) {
              cleanPrice = this.extractPrice(productPagePrice)
              console.log(`SB Simpson: Extracted price: "${cleanPrice}"`)
            }
          } catch (error) {
            console.log(`SB Simpson: Error loading product page:`, error instanceof Error ? error.message : 'Unknown error')
          }
        }

        const finalPrice = cleanPrice && cleanPrice !== 'Not Found' ? cleanPrice : 'Not Found'
        console.log(`SB Simpson: Final result - Price: "${finalPrice}", Link: "${bestMatch.link}"`)

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

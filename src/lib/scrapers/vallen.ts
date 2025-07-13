import { BaseScraper, ScrapedData, Product } from './base'

class VallenScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    return this.retryOperation(async () => {
      const page = await this.createPage()

      try {
        const searchQuery = this.buildSearchQuery(product)
        const searchUrl = `https://www.vallen.ca/search/${encodeURIComponent(searchQuery)}`

        console.log(`Vallen: Searching for "${searchQuery}"`)
        console.log(`Vallen: Search URL: ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 90000 })

        // Log page info
        const pageTitle = await page.title()
        console.log(`Vallen: Page loaded - Title: "${pageTitle}"`)

        // Wait for search results with multiple possible selectors
        try {
          await page.waitForSelector('.product-item, .search-results, .product-grid, .search-result, [class*="product"], [class*="result"]', { timeout: 15000 })
          console.log(`Vallen: Search results loaded`)
        } catch (waitError) {
          console.log(`Vallen: Timeout waiting for search results:`, waitError instanceof Error ? waitError.message : 'Unknown error')

          // Check page content for debugging
          const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'No body')
          console.log(`Vallen: Page content preview:`, bodyText.substring(0, 200))
        }

        // Check how many search result items we found
        const itemCount = await page.evaluate(() => {
          const items1 = document.querySelectorAll('.search-result')
          const items2 = document.querySelectorAll('.product-item')
          const items3 = document.querySelectorAll('.product-card')
          const items4 = document.querySelectorAll('[class*="product"]')
          const items5 = document.querySelectorAll('[class*="result"]')
          return {
            searchResult: items1.length,
            productItem: items2.length,
            productCard: items3.length,
            productClass: items4.length,
            resultClass: items5.length,
            total: document.querySelectorAll('.search-result, .product-item, .product-card, [class*="product"], [class*="result"]').length
          }
        })
        console.log(`Vallen: Found search result items:`, itemCount)

        // Extract product information from search results
        const results = await page.evaluate((product: any) => {
          const items = document.querySelectorAll('.search-result, .product-item, .product-card, [class*="product"], [class*="result"], .item, .card')
          const results: Array<{title: string, price: string, link: string}> = []

          console.log(`Vallen evaluate: Processing ${items.length} items`)

          for (let i = 0; i < items.length; i++) {
            const item = items[i]

            // Try multiple selectors for title
            const titleElement = item.querySelector('.product-title, .item-title, h3, h4, .product-name, .title') ||
                                item.querySelector('a[href*="/products/"]') ||
                                item.querySelector('[class*="title"]') ||
                                item.querySelector('a')

            // Try multiple selectors for price
            const priceElement = item.querySelector('.price, .product-price, .item-price, [class*="price"]') ||
                                item.querySelector('.money, .cost, .amount') ||
                                item.querySelector('[data-price]')

            // Try multiple selectors for link
            const linkElement = item.querySelector('a[href*="/products/"]') ||
                               item.querySelector('a[href*="/product/"]') ||
                               item.querySelector('a')

            if (titleElement) {
              const title = titleElement.textContent?.trim() || ''
              const price = priceElement?.textContent?.trim() || ''
              const link = linkElement?.getAttribute('href') || ''

              console.log(`Vallen evaluate: Item ${i} - Title: "${title.substring(0, 50)}", Price: "${price}", Link: "${link.substring(0, 50)}"`)

              // Enhanced product matching logic
              const titleLower = title.toLowerCase()
              const brandLower = product.brand.toLowerCase()
              const partNumberLower = product.partNumber.toLowerCase()

              // More flexible matching
              const hasExactPartNumber = titleLower.includes(partNumberLower)
              const hasBrand = titleLower.includes(brandLower)
              const hasPartNumberWithoutSpaces = titleLower.includes(partNumberLower.replace(/\s+/g, ''))
              const hasPartNumberWithDashes = titleLower.includes(partNumberLower.replace(/\s+/g, '-'))

              // Check for partial matches
              const partNumberWords = partNumberLower.split(/\s+/)
              const hasAllPartNumberWords = partNumberWords.every(word => titleLower.includes(word))

              if ((hasBrand && hasExactPartNumber) ||
                  (hasBrand && hasPartNumberWithoutSpaces) ||
                  (hasBrand && hasPartNumberWithDashes) ||
                  (hasBrand && hasAllPartNumberWords) ||
                  hasExactPartNumber ||
                  hasPartNumberWithoutSpaces) {
                console.log(`Vallen evaluate: MATCH FOUND - Title: "${title}", Price: "${price}"`)
                results.push({
                  title,
                  price,
                  link: link.startsWith('/') ? `https://www.vallen.ca${link}` : link
                })
              }
            } else {
              console.log(`Vallen evaluate: Item ${i} - No title element found`)
            }
          }

          console.log(`Vallen evaluate: Returning ${results.length} results`)
          return results
        }, product)

        console.log(`Vallen: Evaluation complete, found ${results.length} matching products`)

        if (results.length > 0) {
          const bestMatch = results[0]
          console.log(`Vallen: Best match found - Title: "${bestMatch.title}", Raw price: "${bestMatch.price}", Link: "${bestMatch.link}"`)

          // If no price found on search page, try to get it from product page
          if (!bestMatch.price || bestMatch.price.trim() === '') {
            console.log(`Vallen: No price on search page, navigating to product page: ${bestMatch.link}`)

            try {
              await page.goto(bestMatch.link, { waitUntil: 'domcontentloaded', timeout: 60000 })

              // Wait for product page to load
              await new Promise(resolve => setTimeout(resolve, 3000))

              // Extract price from product page
              const productPagePrice = await page.evaluate(() => {
                const priceSelectors = [
                  '.price',
                  '.product-price',
                  '.item-price',
                  '[class*="price"]',
                  '.money',
                  '.cost',
                  '.amount',
                  '[data-price]',
                  '.price-current',
                  '.current-price',
                  '.sale-price'
                ]

                for (const selector of priceSelectors) {
                  const element = document.querySelector(selector)
                  if (element && element.textContent?.trim()) {
                    console.log(`Vallen product page: Found price with selector "${selector}": "${element.textContent.trim()}"`)
                    return element.textContent.trim()
                  }
                }

                // Try to find any element containing dollar sign
                const allElements = document.querySelectorAll('*')
                for (const element of allElements) {
                  const text = element.textContent?.trim() || ''
                  if (text.includes('$') && text.length < 50 && /\$[\d,]+\.?\d*/.test(text)) {
                    console.log(`Vallen product page: Found price in element: "${text}"`)
                    return text
                  }
                }

                return ''
              })

              if (productPagePrice) {
                bestMatch.price = productPagePrice
                console.log(`Vallen: Found price on product page: "${productPagePrice}"`)
              }
            } catch (productPageError) {
              console.log(`Vallen: Error loading product page:`, productPageError instanceof Error ? productPageError.message : 'Unknown error')
            }
          }

          const cleanPrice = this.extractPrice(bestMatch.price)
          console.log(`Vallen: Extracted price: "${cleanPrice}"`)

          return {
            price: cleanPrice || 'Available',
            link: bestMatch.link,
            availability: 'Available'
          }
        }

        console.log(`Vallen: No matching products found`)
        return {
          price: 'Not Found',
          availability: 'Product not found'
        }

      } catch (error) {
        console.error('Vallen scraping error:', error)
        throw error // Re-throw to trigger retry
      } finally {
        await this.closePage(page)
      }
    }, 2, 3000) // Retry up to 2 times with 3 second delays
  }
}

const vallenScraper = new VallenScraper()

export async function scrapeVallen(product: Product): Promise<ScrapedData> {
  return vallenScraper.scrape(product)
}

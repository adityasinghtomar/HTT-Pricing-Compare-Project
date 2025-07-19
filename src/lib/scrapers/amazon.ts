import { BaseScraper, ScrapedData, Product } from './base'

class AmazonScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    return this.retryOperation(async () => {
      const page = await this.createPage()

      try {
        const searchQuery = this.buildSearchQuery(product)
        const searchUrl = `https://www.amazon.ca/s?k=${encodeURIComponent(searchQuery)}`

        console.log(`Amazon.ca: Searching for "${searchQuery}"`)
        console.log(`Amazon.ca: Search URL: ${searchUrl}`)

        // Increased timeout and better wait strategy
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

        // Additional wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000))

      // Log page info
      const pageTitle = await page.title()
      const currentUrl = page.url()
      console.log(`Amazon.ca: Page loaded - Title: "${pageTitle}"`)
      console.log(`Amazon.ca: Current URL: ${currentUrl}`)
      
        // Wait for search results with multiple selectors
        try {
          await page.waitForSelector('[data-component-type="s-search-result"], .s-result-item, [data-testid="result"], .s-card-container', { timeout: 15000 })
          console.log(`Amazon.ca: Search results loaded successfully`)
        } catch (waitError) {
          console.log(`Amazon.ca: Timeout waiting for search results:`, waitError instanceof Error ? waitError.message : 'Unknown error')

          // Check what's actually on the page
          const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'No body')
          console.log(`Amazon.ca: Page content preview:`, bodyText.substring(0, 200))

          // Check if we're blocked or redirected
          const currentUrl = page.url()
          if (currentUrl.includes('captcha') || currentUrl.includes('robot') || currentUrl.includes('blocked')) {
            throw new Error('Amazon CAPTCHA or bot detection triggered')
          }
        }
      
      // Check how many search result items we found
      const itemCount = await page.evaluate(() => {
        const items1 = document.querySelectorAll('[data-component-type="s-search-result"]')
        const items2 = document.querySelectorAll('.s-result-item')
        const items3 = document.querySelectorAll('[data-testid="result"]')
        const items4 = document.querySelectorAll('.s-card-container')
        return {
          dataComponent: items1.length,
          sResultItem: items2.length,
          testIdResult: items3.length,
          cardContainer: items4.length,
          total: document.querySelectorAll('[data-component-type="s-search-result"], .s-result-item, [data-testid="result"], .s-card-container').length
        }
      })
      console.log(`Amazon.ca: Found search result items:`, itemCount)

      // Extract product information
      const results = await page.evaluate((product: any) => {
        const items = document.querySelectorAll('[data-component-type="s-search-result"], .s-result-item, [data-testid="result"], .s-card-container')
        const results: Array<{title: string, price: string, link: string}> = []

        console.log(`Amazon.ca evaluate: Processing ${items.length} items`)

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const titleElement = item.querySelector('h2 a span') ||
                              item.querySelector('[data-cy="title-recipe-title"]') ||
                              item.querySelector('.s-title-instructions-style span') ||
                              item.querySelector('h3 a span') ||
                              item.querySelector('.s-size-mini .s-link-style a span')
          const priceElement = item.querySelector('.a-price .a-offscreen') ||
                              item.querySelector('.a-price-whole') ||
                              item.querySelector('.a-price-range') ||
                              item.querySelector('.a-price') ||
                              item.querySelector('[data-a-price]') ||
                              item.querySelector('.a-price-symbol') ||
                              item.querySelector('.a-price-fraction')
          const linkElement = item.querySelector('h2 a') ||
                             item.querySelector('[data-cy="title-recipe-title"]')?.closest('a') ||
                             item.querySelector('h3 a')

          if (titleElement) {
            const title = titleElement.textContent?.trim() || ''
            const price = priceElement?.textContent?.trim() || ''
            const link = linkElement?.getAttribute('href') || ''

            // Try to get price from multiple sources if first attempt fails
            let finalPrice = price
            if (!price || price === '') {
              const priceContainer = item.querySelector('.a-price')
              if (priceContainer) {
                finalPrice = priceContainer.textContent?.trim() || ''
              }
            }

            console.log(`Amazon.ca evaluate: Item ${i} - Title: "${title.substring(0, 50)}", Price: "${finalPrice}", PriceElement: ${priceElement?.className || 'none'}`)

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
            const hasAllPartNumberWords = partNumberWords.every((word: string) => titleLower.includes(word))

            if ((hasBrand && hasExactPartNumber) ||
                (hasBrand && hasPartNumberWithoutSpaces) ||
                (hasBrand && hasPartNumberWithDashes) ||
                (hasBrand && hasAllPartNumberWords) ||
                hasExactPartNumber ||
                hasPartNumberWithoutSpaces) {
              console.log(`Amazon.ca evaluate: MATCH FOUND - Title: "${title}", Price: "${finalPrice}"`)
              results.push({
                title,
                price: finalPrice,
                link: link.startsWith('/') ? `https://www.amazon.ca${link}` : link
              })
            }
          } else {
            console.log(`Amazon.ca evaluate: Item ${i} - No title element found`)
          }
        }

        console.log(`Amazon.ca evaluate: Returning ${results.length} results`)
        return results
      }, product)

      console.log(`Amazon.ca: Evaluation complete, found ${results.length} matching products`)

      if (results.length > 0) {
        const bestMatch = results[0]
        console.log(`Amazon.ca: Best match - Title: "${bestMatch.title}", Raw price: "${bestMatch.price}"`)
        const cleanPrice = this.extractPrice(bestMatch.price)
        console.log(`Amazon.ca: Extracted price: "${cleanPrice}"`)

        return {
          price: cleanPrice,
          link: bestMatch.link,
          availability: 'Available'
        }
      }

        console.log(`Amazon.ca: No matching products found`)
        return {
          price: 'Not Found',
          availability: 'Product not found'
        }

      } catch (error) {
        console.error('Amazon.ca scraping error:', error)
        throw error // Re-throw to trigger retry
      } finally {
        await this.closePage(page)
      }
    }, 2, 3000) // Retry up to 2 times with 3 second delays
  }
}

const amazonScraper = new AmazonScraper()

export async function scrapeAmazonCA(product: Product): Promise<ScrapedData> {
  return amazonScraper.scrape(product)
}

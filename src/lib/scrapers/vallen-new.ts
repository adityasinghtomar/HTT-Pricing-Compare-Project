import { BaseScraper } from './base'
import { Product, ScrapedData } from '../types'

class VallenNewScraper extends BaseScraper {
  async scrape(product: Product): Promise<ScrapedData> {
    return this.retryOperation(async () => {
      const page = await this.createPage()

      try {
        const searchQuery = this.buildSearchQuery(product)
        const searchUrl = `https://www.vallen.ca/search/${encodeURIComponent(searchQuery)}`

        console.log(`Vallen NEW: Searching for "${searchQuery}"`)
        console.log(`Vallen NEW: Search URL: ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 90000 })

        // Wait for Angular SPA to load completely
        console.log(`Vallen NEW: Waiting for Angular SPA to load...`)
        
        try {
          await page.waitForSelector('val-loading-spinner', { hidden: true, timeout: 30000 })
          console.log(`Vallen NEW: Loading spinner disappeared`)
        } catch (spinnerError) {
          console.log(`Vallen NEW: Loading spinner timeout`)
        }

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 8000))
        console.log(`Vallen NEW: Content wait completed`)

        // Try to wait for any price elements
        try {
          await page.waitForSelector('[data-testid*="price"], [data-testid*="product-item"]', { timeout: 10000 })
          console.log(`Vallen NEW: Price/product elements found`)
        } catch (priceWaitError) {
          console.log(`Vallen NEW: No price elements found within timeout`)
        }

        // Extract all possible price information
        const results = await page.evaluate((product: any) => {
          console.log(`Vallen NEW evaluate: Starting extraction for ${product.brand} ${product.partNumber}`)

          const results: Array<{title: string, price: string, link: string, status: string}> = []

          // Debug: Check what's actually on the page
          const allTestIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
            testId: el.getAttribute('data-testid'),
            text: el.textContent?.trim().substring(0, 50)
          }))
          console.log(`Vallen NEW evaluate: Found ${allTestIds.length} elements with data-testid`)
          console.log(`Vallen NEW evaluate: Sample testIds:`, allTestIds.slice(0, 10))

          // Method 1: Look for product-price-value elements (actual prices)
          const priceValueElements = document.querySelectorAll('[data-testid*="product-price-value"]')
          console.log(`Vallen NEW evaluate: Found ${priceValueElements.length} product-price-value elements`)

          for (let i = 0; i < priceValueElements.length; i++) {
            const priceElement = priceValueElements[i]
            const price = priceElement.textContent?.trim() || ''
            const testId = priceElement.getAttribute('data-testid') || ''

            // Find the product container
            const container = priceElement.closest('[data-testid*="product-item"]') || priceElement.closest('div')
            if (container) {
              const titleElement = container.querySelector('[data-testid*="product-title"], [data-testid*="product-name"]') ||
                                 container.querySelector('a[href*="/products/"]')
              const linkElement = container.querySelector('a[href*="/products/"]')

              const title = titleElement?.textContent?.trim() || ''
              const link = linkElement?.getAttribute('href') || ''

              console.log(`Vallen NEW evaluate: Price value element ${i} - Title: "${title}", Price: "${price}", TestId: "${testId}"`)

              if (title && price) {
                results.push({
                  title,
                  price,
                  link: link.startsWith('/') ? `https://www.vallen.ca${link}` : link,
                  status: 'available'
                })
              }
            }
          }

          // Method 2: Look for product-price-unavailable elements
          const unavailableElements = document.querySelectorAll('[data-testid*="product-price-unavailable"]')
          console.log(`Vallen NEW evaluate: Found ${unavailableElements.length} product-price-unavailable elements`)

          for (let i = 0; i < unavailableElements.length; i++) {
            const unavailableElement = unavailableElements[i]
            const status = unavailableElement.textContent?.trim() || ''
            const testId = unavailableElement.getAttribute('data-testid') || ''

            console.log(`Vallen NEW evaluate: Processing unavailable element ${i} - TestId: "${testId}", Status: "${status}"`)

            // Find the product container
            const container = unavailableElement.closest('[data-testid*="product-item"]') || unavailableElement.closest('div')
            if (container) {
              console.log(`Vallen NEW evaluate: Found container for unavailable element ${i}`)

              // Look for title using multiple selectors
              const titleElement = container.querySelector('[data-testid*="product-title"], [data-testid*="product-name"]') ||
                                 container.querySelector('[data-testid*="product-item-list-title"]') ||
                                 container.querySelector('[data-testid*="product-item-list-id"]') ||
                                 container.querySelector('a[href*="/products/"]')

              // Look for link using multiple selectors
              const linkElement = container.querySelector('a[href*="/products/"]') ||
                                 container.querySelector('[data-testid*="product-item-list-title-link"]') ||
                                 container.querySelector('[data-testid*="product-item-list-id-link"]')

              const title = titleElement?.textContent?.trim() || ''
              const link = linkElement?.getAttribute('href') || ''

              console.log(`Vallen NEW evaluate: Unavailable element ${i} - Title: "${title.substring(0, 50)}", Status: "${status}", TestId: "${testId}", Link: "${link.substring(0, 50)}"`)

              if (title) {
                results.push({
                  title,
                  price: 'Unavailable',
                  link: link.startsWith('/') ? `https://www.vallen.ca${link}` : link,
                  status: 'unavailable'
                })
              } else {
                console.log(`Vallen NEW evaluate: No title found for unavailable element ${i}`)
              }
            } else {
              console.log(`Vallen NEW evaluate: No container found for unavailable element ${i}`)
            }
          }

          // Method 3: Look for any elements containing dollar signs
          const allElements = document.querySelectorAll('*')
          const dollarElements = []
          for (let i = 0; i < allElements.length; i++) {
            const element = allElements[i]
            const text = element.textContent?.trim() || ''
            if (text.includes('$') && text.length < 50 && /\$[\d,]+\.?\d*/.test(text)) {
              dollarElements.push({
                text,
                testId: element.getAttribute('data-testid'),
                tagName: element.tagName
              })
            }
          }
          console.log(`Vallen NEW evaluate: Found ${dollarElements.length} elements with dollar signs`)

          // Filter results based on product matching
          const matchedResults = results.filter(result => {
            const titleLower = result.title.toLowerCase()
            const brandLower = product.brand.toLowerCase()
            const partNumberLower = product.partNumber.toLowerCase()

            const hasExactPartNumber = titleLower.includes(partNumberLower)
            const hasBrand = titleLower.includes(brandLower)
            const hasPartNumberWithoutSpaces = titleLower.includes(partNumberLower.replace(/\s+/g, ''))
            
            const partNumberWords = partNumberLower.split(/\s+/)
            const hasAllPartNumberWords = partNumberWords.every((word: string) => titleLower.includes(word))

            return (hasBrand && hasExactPartNumber) || 
                   (hasBrand && hasPartNumberWithoutSpaces) ||
                   (hasBrand && hasAllPartNumberWords) ||
                   hasExactPartNumber || 
                   hasPartNumberWithoutSpaces
          })

          console.log(`Vallen NEW evaluate: Found ${matchedResults.length} matching products`)
          return {
            matchedResults,
            allResults: results,
            dollarElements,
            totalPriceElements: priceValueElements.length,
            totalUnavailableElements: unavailableElements.length
          }
        }, product)

        console.log(`Vallen NEW: Extraction complete - ${results.matchedResults.length} matches found`)

        if (results.matchedResults.length > 0) {
          const bestMatch = results.matchedResults[0]
          console.log(`Vallen NEW: Best match - Title: "${bestMatch.title}", Price: "${bestMatch.price}", Status: "${bestMatch.status}"`)
          
          if (bestMatch.status === 'available' && bestMatch.price !== 'Unavailable') {
            const cleanPrice = this.extractPrice(bestMatch.price)
            return {
              price: cleanPrice || bestMatch.price,
              link: bestMatch.link,
              availability: 'Available'
            }
          } else {
            return {
              price: 'Unavailable',
              link: bestMatch.link,
              availability: 'Product found but unavailable'
            }
          }
        }

        console.log(`Vallen NEW: No matching products found`)
        return {
          price: 'Not Found',
          availability: 'Product not found'
        }

      } catch (error) {
        console.error('Vallen NEW scraping error:', error)
        throw error
      } finally {
        await this.closePage(page)
      }
    }, 2, 3000)
  }
}

export { VallenNewScraper }

// Function export for compatibility with existing API
export async function scrapeVallenNew(product: Product): Promise<ScrapedData> {
  const scraper = new VallenNewScraper()
  return await scraper.scrape(product)
}

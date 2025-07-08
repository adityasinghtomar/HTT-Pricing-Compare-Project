import { BaseScraper, ScrapedData, Product } from './base'

class DebugScraper extends BaseScraper {
  async scrape(product: Product, targetUrl: string, siteName: string): Promise<ScrapedData> {
    const page = await this.createPage()
    
    try {
      console.log(`${siteName}: Debug scraping "${targetUrl}"`)
      
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 })
      
      // Take a screenshot for debugging
      const timestamp = Date.now()
      const screenshotPath = `debug-${siteName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`
      
      try {
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: false,
          clip: { x: 0, y: 0, width: 1366, height: 768 }
        })
        console.log(`${siteName}: Screenshot saved as ${screenshotPath}`)
      } catch (screenshotError) {
        console.log(`${siteName}: Could not save screenshot:`, screenshotError.message)
      }
      
      // Get page title and URL for debugging
      const pageTitle = await page.title()
      const currentUrl = page.url()
      
      console.log(`${siteName}: Page title: "${pageTitle}"`)
      console.log(`${siteName}: Current URL: "${currentUrl}"`)
      
      // Check if page loaded successfully
      const bodyText = await page.evaluate(() => {
        return document.body ? document.body.innerText.substring(0, 500) : 'No body found'
      })
      
      console.log(`${siteName}: Page content preview:`, bodyText.substring(0, 200) + '...')
      
      // Look for common elements
      const elementCounts = await page.evaluate(() => {
        return {
          totalElements: document.querySelectorAll('*').length,
          divs: document.querySelectorAll('div').length,
          links: document.querySelectorAll('a').length,
          images: document.querySelectorAll('img').length,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input').length,
          buttons: document.querySelectorAll('button').length,
        }
      })
      
      console.log(`${siteName}: Element counts:`, elementCounts)
      
      // Look for potential product containers
      const productSelectors = [
        '.product', '.product-item', '.product-card', '.search-result', 
        '.item', '.result', '[data-product]', '[class*="product"]',
        '[class*="result"]', '[class*="item"]'
      ]
      
      for (const selector of productSelectors) {
        const count = await page.evaluate((sel) => {
          return document.querySelectorAll(sel).length
        }, selector)
        
        if (count > 0) {
          console.log(`${siteName}: Found ${count} elements with selector "${selector}"`)
          
          // Get sample content from first few elements
          const sampleContent = await page.evaluate((sel) => {
            const elements = document.querySelectorAll(sel)
            const samples = []
            for (let i = 0; i < Math.min(3, elements.length); i++) {
              samples.push({
                text: elements[i].textContent?.trim().substring(0, 100) || '',
                html: elements[i].outerHTML.substring(0, 200) || ''
              })
            }
            return samples
          }, selector)
          
          console.log(`${siteName}: Sample content for "${selector}":`, sampleContent)
        }
      }
      
      // Look for price-related elements
      const priceSelectors = [
        '.price', '.cost', '.money', '[class*="price"]', '[class*="cost"]',
        '[class*="money"]', '$', 'CAD', 'USD'
      ]
      
      for (const selector of priceSelectors) {
        const count = await page.evaluate((sel) => {
          if (sel.startsWith('$') || sel === 'CAD' || sel === 'USD') {
            // Search for text content
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              null,
              false
            )
            let count = 0
            let node
            while (node = walker.nextNode()) {
              if (node.textContent && node.textContent.includes(sel)) {
                count++
              }
            }
            return count
          } else {
            return document.querySelectorAll(sel).length
          }
        }, selector)
        
        if (count > 0) {
          console.log(`${siteName}: Found ${count} potential price elements with "${selector}"`)
        }
      }
      
      return {
        price: 'Debug Complete',
        availability: `Check console for ${siteName} debug info`,
        link: currentUrl
      }
      
    } catch (error) {
      console.error(`${siteName} debug error:`, error)
      return {
        price: 'Debug Error',
        availability: error.message
      }
    } finally {
      await page.close()
    }
  }
}

const debugScraper = new DebugScraper()

export async function debugScrapeWebsite(product: Product, url: string, siteName: string): Promise<ScrapedData> {
  return debugScraper.scrape(product, url, siteName)
}

export default DebugScraper

import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json()

    console.log(`Debug Vallen: Starting aggressive price hunt for "${searchTerm}"`)

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    const results: any[] = []

    // Test multiple search terms to find products with actual prices
    const searchTerms = [
      searchTerm,
      'safety glasses',
      'hard hat',
      'gloves',
      'respirator',
      '3M 6200',
      'honeywell'
    ]

    for (const term of searchTerms) {
      console.log(`Debug Vallen: Testing search term: "${term}"`)

      const page = await browser.newPage()

      try {
        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

        const searchUrl = `https://www.vallen.ca/search/${encodeURIComponent(term)}`
        console.log(`Debug Vallen: Navigating to ${searchUrl}`)

        await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 90000 })

        // Wait for Angular to load
        try {
          await page.waitForSelector('val-loading-spinner', { hidden: true, timeout: 30000 })
          console.log(`Debug Vallen: Loading spinner disappeared for "${term}"`)
        } catch (error) {
          console.log(`Debug Vallen: Spinner timeout for "${term}"`)
        }

        // Wait additional time
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Extract comprehensive page information
        const pageInfo = await page.evaluate(() => {
          // Get all elements with data-testid containing "price"
          const allPriceElements = Array.from(document.querySelectorAll('[data-testid*="price"]')).map(el => ({
            testId: el.getAttribute('data-testid'),
            tagName: el.tagName,
            text: el.textContent?.trim(),
            innerHTML: el.innerHTML.substring(0, 200),
            outerHTML: el.outerHTML.substring(0, 300)
          }))

          // Look for actual price values (containing $)
          const priceValueElements = Array.from(document.querySelectorAll('[data-testid*="product-price-value"]')).map(el => ({
            testId: el.getAttribute('data-testid'),
            text: el.textContent?.trim(),
            outerHTML: el.outerHTML.substring(0, 300)
          }))

          // Look for elements containing dollar signs
          const dollarElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent?.trim() || ''
            return text.includes('$') && text.length < 100 && /\$[\d,]+\.?\d*/.test(text)
          }).map(el => ({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            testId: el.getAttribute('data-testid'),
            text: el.textContent?.trim(),
            outerHTML: el.outerHTML.substring(0, 300)
          }))

          // Get product count
          const productElements = document.querySelectorAll('[data-testid*="product-item"]')

          return {
            url: window.location.href,
            title: document.title,
            productCount: productElements.length,
            allPriceElements,
            priceValueElements,
            dollarElements,
            bodyText: document.body.innerText.substring(0, 1000)
          }
        })

        results.push({
          searchTerm: term,
          pageInfo
        })

        await page.close()

        // If we found products with actual prices, break early
        if (pageInfo.priceValueElements.length > 0 || pageInfo.dollarElements.length > 0) {
          console.log(`Debug Vallen: Found products with prices for "${term}", stopping search`)
          break
        }

      } catch (error) {
        console.log(`Debug Vallen: Error with search term "${term}":`, error instanceof Error ? error.message : 'Unknown error')
        results.push({
          searchTerm: term,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        try {
          await page.close()
        } catch (closeError) {
          // Ignore close errors
        }
      }
    }

    await browser.close()

    return NextResponse.json({
      success: true,
      searchResults: results
    })

  } catch (error) {
    console.error('Debug Vallen error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

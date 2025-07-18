import { NextRequest, NextResponse } from 'next/server'
import { scrapeAmazonCA } from '@/lib/scrapers/amazon'
import { scrapeUline } from '@/lib/scrapers/uline'
import { scrapeBroganSafety } from '@/lib/scrapers/brogan-safety'
import { scrapeSBSimpson } from '@/lib/scrapers/sb-simpson'
import { scrapeSPIHealthSafety } from '@/lib/scrapers/spi-health-safety'
import { scrapeHazmasters } from '@/lib/scrapers/hazmasters'
import { scrapeAcklandsGrainger } from '@/lib/scrapers/acklands-grainger'
import { scrapeVallenNew } from '@/lib/scrapers/vallen-new'
import { ProductModel, SupplierModel, PriceDataModel, ScrapingLogModel } from '@/lib/database/models'
import { v4 as uuidv4 } from 'uuid'

export interface Product {
  brand: string
  partNumber: string
  size?: string
}

export interface PriceData {
  website: string
  price: string
  link?: string
  availability?: string
  lastUpdated?: string
}

const scrapers = [
  { name: 'Amazon.ca', scraper: scrapeAmazonCA },
  { name: 'ULINE', scraper: scrapeUline },
  { name: 'Brogan Safety', scraper: scrapeBroganSafety },
  { name: 'SB Simpson', scraper: scrapeSBSimpson },
  { name: 'SPI Health & Safety', scraper: scrapeSPIHealthSafety },
  { name: 'Hazmasters', scraper: scrapeHazmasters },
  { name: 'Acklands Grainger', scraper: scrapeAcklandsGrainger },
  { name: 'Vallen', scraper: scrapeVallenNew },
]

export async function POST(request: NextRequest) {
  const sessionId = uuidv4()
  const startTime = new Date()

  try {
    const product: Product = await request.json()

    if (!product.brand || !product.partNumber) {
      return NextResponse.json(
        { error: 'Brand and part number are required' },
        { status: 400 }
      )
    }

    console.log(`[${sessionId}] Fetching prices for: ${product.brand} ${product.partNumber} ${product.size || ''}`)

    // Try to find or create product in database (optional)
    let dbProduct = null
    let suppliers = []

    try {
      dbProduct = await ProductModel.findByBrandAndPart(product.brand, product.partNumber, product.size)
      if (!dbProduct) {
        const productId = await ProductModel.create({
          brand: product.brand,
          part_number: product.partNumber,
          size: product.size,
          category: 'Safety Equipment'
        })
        dbProduct = await ProductModel.findById(productId)
      }

      // Get active suppliers from database
      suppliers = await SupplierModel.findActive()

      // Log scraping session start
      await ScrapingLogModel.create({
        session_id: sessionId,
        product_id: dbProduct?.id,
        supplier_id: undefined,
        status: 'started',
        user_agent: request.headers.get('user-agent') || undefined,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      })
    } catch (dbError) {
      let errorMessage = 'An unknown database error occurred';
      if (dbError instanceof Error) {
          errorMessage = dbError.message;
      }
      // Use the new, safe variable here:
      console.warn(`Database not available, running without database features:`, errorMessage);
      
      // Continue without database - use hardcoded suppliers
      suppliers = [
        { id: 1, name: 'Amazon.ca' },
        { id: 2, name: 'ULINE' },
        { id: 3, name: 'Brogan Safety' },
        { id: 4, name: 'SB Simpson' },
        { id: 5, name: 'SPI Health & Safety' },
        { id: 6, name: 'Hazmasters' },
        { id: 7, name: 'Acklands Grainger' },
        { id: 8, name: 'Vallen' }
      ]
    }

    const prices: PriceData[] = []

    // Run scrapers with staggered delays to avoid overwhelming sites
    const scrapePromises = scrapers.map(async ({ name, scraper }, index) => {
      const supplier = suppliers.find(s => s.name === name)
      if (!supplier) {
        console.warn(`Supplier ${name} not found in database`)
        return {
          website: name,
          price: 'Error',
          availability: 'Supplier not configured',
          lastUpdated: new Date().toISOString(),
        }
      }

      // Add staggered delay (0, 3, 6, 9, 12, 15, 18, 21 seconds)
      const delay = index * 3000
      if (delay > 0) {
        console.log(`[${sessionId}] Waiting ${delay/1000}s before scraping ${name}...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const scrapeStart = Date.now()

      try {
        console.log(`[${sessionId}] Scraping ${name}...`)
        const result = await scraper(product)
        const scrapeDuration = Date.now() - scrapeStart

        // Save price data to database (if available)
        if (dbProduct?.id && supplier.id) {
          try {
            await PriceDataModel.savePriceData({
              product_id: dbProduct.id,
              supplier_id: supplier.id,
              price: result.price && result.price !== 'Not Found' && result.price !== 'Error'
                ? parseFloat(result.price.replace(/[$,]/g, '')) : undefined,
              currency: 'CAD',
              availability_status: result.price === 'Not Found' ? 'not_found'
                : result.price === 'Error' ? 'error'
                : result.availability?.toLowerCase().includes('out of stock') ? 'out_of_stock'
                : 'available',
              product_url: result.link,
              is_current: true,
              scraping_duration_ms: scrapeDuration,
              raw_data: result
            })
          } catch (dbError) {
            console.warn(`Failed to save price data to database:`, dbError.message)
          }
        }

        return {
          website: name,
          ...result,
          lastUpdated: new Date().toISOString(),
        }
      } catch (error) {
        const scrapeDuration = Date.now() - scrapeStart
        console.error(`[${sessionId}] Error scraping ${name}:`, error)

        // Save error to database (if available)
        if (dbProduct?.id && supplier.id) {
          try {
            await PriceDataModel.savePriceData({
              product_id: dbProduct.id,
              supplier_id: supplier.id,
              currency: 'CAD',
              availability_status: 'error',
              is_current: true,
              scraping_duration_ms: scrapeDuration,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
          } catch (dbError) {
            console.warn(`Failed to save error to database:`, dbError.message)
          }
        }

        return {
          website: name,
          price: 'Error',
          availability: 'Scraping failed',
          lastUpdated: new Date().toISOString(),
        }
      }
    })

    // Wait for all scrapers to complete (with longer timeout due to staggered delays)
    const results = await Promise.allSettled(
      scrapePromises.map(promise =>
        Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), 120000) // 2 minutes
          )
        ])
      )
    )

    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        prices.push(result.value as PriceData)
      } else {
        prices.push({
          website: scrapers[index].name,
          price: 'Timeout',
          availability: 'Request timed out',
          lastUpdated: new Date().toISOString(),
        })
      }
    })

    // Log successful completion (if database available)
    const endTime = new Date()
    try {
      await ScrapingLogModel.updateStatus(sessionId, 'completed', endTime)
    } catch (dbError) {
      console.warn(`Failed to log completion to database:`, dbError.message)
    }

    console.log(`[${sessionId}] Completed in ${endTime.getTime() - startTime.getTime()}ms`)

    return NextResponse.json({
      product: `${product.brand} ${product.partNumber} ${product.size || ''}`.trim(),
      prices,
      timestamp: new Date().toISOString(),
      sessionId,
      duration: endTime.getTime() - startTime.getTime()
    })

  } catch (error) {
    console.error(`[${sessionId}] Error in fetch-prices API:`, error)

    // Log failed completion (if database available)
    const endTime = new Date()
    try {
      await ScrapingLogModel.updateStatus(
        sessionId,
        'failed',
        endTime,
        error instanceof Error ? error.message : 'Unknown error'
      )
    } catch (dbError) {
      console.warn(`Failed to log error to database:`, dbError.message)
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        sessionId,
        duration: endTime.getTime() - startTime.getTime()
      },
      { status: 500 }
    )
  }
}

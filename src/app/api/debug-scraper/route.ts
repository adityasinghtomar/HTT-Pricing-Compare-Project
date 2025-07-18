import { NextRequest, NextResponse } from 'next/server'
import { debugScrapeWebsite } from '@/lib/scrapers/debug-scraper'

export async function POST(request: NextRequest) {
  try {
    const { url, siteName, product } = await request.json()
    
    if (!url || !siteName) {
      return NextResponse.json(
        { error: 'URL and siteName are required' },
        { status: 400 }
      )
    }

    const testProduct = product || { brand: '3M', partNumber: '2091', size: '' }
    
    console.log(`Debug scraping: ${siteName} at ${url}`)
    
    const result = await debugScrapeWebsite(testProduct, url, siteName)
    
    return NextResponse.json({
      siteName,
      url,
      product: testProduct,
      result,
      timestamp: new Date().toISOString()
    })

// Correct Code
    } catch (error) {
        console.error('Debug scraper error:', error);
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json(
            { error: 'Debug scraping failed', details: errorMessage },
            { status: 500 }
        );
    }
}

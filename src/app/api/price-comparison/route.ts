import { NextRequest, NextResponse } from 'next/server'
import { PriceDataModel } from '@/lib/database/models'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (productId) {
      // Get prices for specific product
      const prices = await PriceDataModel.findCurrentPrices(parseInt(productId))
      return NextResponse.json({ prices })
    } else {
      // Get price comparison for all products
      const comparison = await PriceDataModel.getPriceComparison()
      return NextResponse.json({ comparison })
    }
    
  } catch (error) {
    console.error('Error fetching price comparison:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price comparison' },
      { status: 500 }
    )
  }
}

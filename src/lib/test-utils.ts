import { Product } from '@/app/page'

export const testProducts: Product[] = [
  { brand: '3M', partNumber: '2091', size: '' },
  { brand: '3M', partNumber: '6200', size: 'Medium' },
  { brand: 'Honeywell', partNumber: 'LL-1', size: '' },
]

export const mockPriceData = {
  'Amazon.ca': { price: '$19.99', availability: 'Available', link: 'https://amazon.ca/test' },
  'ULINE': { price: '$22.50', availability: 'Available', link: 'https://uline.ca/test' },
  'Brogan Safety': { price: 'Not Found', availability: 'Product not found' },
  'SB Simpson': { price: '$18.75', availability: 'Available', link: 'https://sbsimpson.com/test' },
  'SPI Health & Safety': { price: 'Error', availability: 'Scraping failed' },
  'Hazmasters': { price: '$21.00', availability: 'Available', link: 'https://hazmasters.com/test' },
  'Acklands Grainger': { price: '$23.99', availability: 'Available', link: 'https://acklandsgrainger.com/test' },
  'Vallen': { price: 'Timeout', availability: 'Request timed out' },
}

export function createMockResponse(product: Product) {
  return {
    product: `${product.brand} ${product.partNumber} ${product.size || ''}`.trim(),
    prices: Object.entries(mockPriceData).map(([website, data]) => ({
      website,
      ...data,
      lastUpdated: new Date().toISOString(),
    })),
    timestamp: new Date().toISOString(),
    sessionId: 'test-session-' + Date.now(),
    duration: Math.floor(Math.random() * 5000) + 1000,
  }
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function validateProduct(product: Product): string[] {
  const errors: string[] = []
  
  if (!product.brand || product.brand.trim().length === 0) {
    errors.push('Brand is required')
  }
  
  if (!product.partNumber || product.partNumber.trim().length === 0) {
    errors.push('Part number is required')
  }
  
  if (product.brand && product.brand.length > 100) {
    errors.push('Brand must be less than 100 characters')
  }
  
  if (product.partNumber && product.partNumber.length > 100) {
    errors.push('Part number must be less than 100 characters')
  }
  
  if (product.size && product.size.length > 50) {
    errors.push('Size must be less than 50 characters')
  }
  
  return errors
}

export function validatePriceString(price: string): boolean {
  if (!price || price === 'Not Found' || price === 'Error' || price === 'Timeout') {
    return false
  }
  
  // Check if it's a valid price format
  const priceRegex = /^\$?[\d,]+\.?\d*$/
  return priceRegex.test(price.replace(/\s/g, ''))
}

export function extractNumericPrice(price: string): number | null {
  if (!validatePriceString(price)) {
    return null
  }
  
  const numericPrice = parseFloat(price.replace(/[$,]/g, ''))
  return isNaN(numericPrice) ? null : numericPrice
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(price)
}

export function calculatePriceStats(prices: number[]) {
  if (prices.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      range: 0,
      count: 0
    }
  }
  
  const sorted = [...prices].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  
  return {
    min,
    max,
    average,
    median,
    range: max - min,
    count: prices.length
  }
}

// Mock fetch for testing
export function createMockFetch(mockData: any) {
  return jest.fn().mockImplementation((url: string, options?: any) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
      headers: new Headers(),
    })
  })
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health')
    const data = await response.json()
    return data.status === 'healthy'
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

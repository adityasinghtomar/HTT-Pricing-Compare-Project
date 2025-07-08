/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/fetch-prices/route'

// Mock the database models
jest.mock('@/lib/database/models', () => ({
  ProductModel: {
    findByBrandAndPart: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
  SupplierModel: {
    findActive: jest.fn(),
  },
  PriceDataModel: {
    savePriceData: jest.fn(),
  },
  ScrapingLogModel: {
    create: jest.fn(),
    updateStatus: jest.fn(),
  },
}))

// Mock the scrapers
jest.mock('@/lib/scrapers/amazon', () => ({
  scrapeAmazonCA: jest.fn(),
}))

jest.mock('@/lib/scrapers/uline', () => ({
  scrapeUline: jest.fn(),
}))

// Mock other scrapers similarly...

describe('/api/fetch-prices', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for missing brand', async () => {
    const request = new NextRequest('http://localhost:3000/api/fetch-prices', {
      method: 'POST',
      body: JSON.stringify({ partNumber: '2091' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Brand and part number are required')
  })

  it('should return 400 for missing part number', async () => {
    const request = new NextRequest('http://localhost:3000/api/fetch-prices', {
      method: 'POST',
      body: JSON.stringify({ brand: '3M' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Brand and part number are required')
  })

  it('should process valid product request', async () => {
    // Mock database responses
    const { ProductModel, SupplierModel } = require('@/lib/database/models')
    
    ProductModel.findByBrandAndPart.mockResolvedValue({ id: 1, brand: '3M', part_number: '2091' })
    SupplierModel.findActive.mockResolvedValue([
      { id: 1, name: 'Amazon.ca' },
      { id: 2, name: 'ULINE' },
    ])

    // Mock scraper responses
    const { scrapeAmazonCA } = require('@/lib/scrapers/amazon')
    const { scrapeUline } = require('@/lib/scrapers/uline')
    
    scrapeAmazonCA.mockResolvedValue({
      price: '$19.99',
      link: 'https://amazon.ca/test',
      availability: 'Available'
    })
    
    scrapeUline.mockResolvedValue({
      price: '$22.50',
      link: 'https://uline.ca/test',
      availability: 'Available'
    })

    const request = new NextRequest('http://localhost:3000/api/fetch-prices', {
      method: 'POST',
      body: JSON.stringify({ brand: '3M', partNumber: '2091' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.product).toBe('3M 2091')
    expect(data.prices).toHaveLength(8) // All 8 suppliers
    expect(data.sessionId).toBeDefined()
    expect(data.timestamp).toBeDefined()
  })
})

describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    // This would require setting up the middleware test
    // For now, we'll test the rate limiter directly
    const { rateLimiter } = require('@/lib/rate-limiter')
    
    const identifier = 'test-ip'
    
    // Should allow first 10 requests
    for (let i = 0; i < 10; i++) {
      expect(rateLimiter.isAllowed(identifier)).toBe(true)
    }
    
    // 11th request should be blocked
    expect(rateLimiter.isAllowed(identifier)).toBe(false)
  })
})

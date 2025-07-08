import {
  validateProduct,
  validatePriceString,
  extractNumericPrice,
  formatPrice,
  calculatePriceStats,
  testProducts,
  mockPriceData
} from '@/lib/test-utils'

describe('Test Utils', () => {
  describe('validateProduct', () => {
    it('should return no errors for valid product', () => {
      const product = { brand: '3M', partNumber: '2091', size: 'Medium' }
      const errors = validateProduct(product)
      expect(errors).toHaveLength(0)
    })

    it('should return error for missing brand', () => {
      const product = { brand: '', partNumber: '2091', size: 'Medium' }
      const errors = validateProduct(product)
      expect(errors).toContain('Brand is required')
    })

    it('should return error for missing part number', () => {
      const product = { brand: '3M', partNumber: '', size: 'Medium' }
      const errors = validateProduct(product)
      expect(errors).toContain('Part number is required')
    })

    it('should return error for brand too long', () => {
      const product = { brand: 'A'.repeat(101), partNumber: '2091', size: 'Medium' }
      const errors = validateProduct(product)
      expect(errors).toContain('Brand must be less than 100 characters')
    })
  })

  describe('validatePriceString', () => {
    it('should validate correct price formats', () => {
      expect(validatePriceString('$19.99')).toBe(true)
      expect(validatePriceString('19.99')).toBe(true)
      expect(validatePriceString('$1,234.56')).toBe(true)
      expect(validatePriceString('1234')).toBe(true)
    })

    it('should reject invalid price formats', () => {
      expect(validatePriceString('Not Found')).toBe(false)
      expect(validatePriceString('Error')).toBe(false)
      expect(validatePriceString('Timeout')).toBe(false)
      expect(validatePriceString('')).toBe(false)
      expect(validatePriceString('abc')).toBe(false)
    })
  })

  describe('extractNumericPrice', () => {
    it('should extract numeric values from price strings', () => {
      expect(extractNumericPrice('$19.99')).toBe(19.99)
      expect(extractNumericPrice('$1,234.56')).toBe(1234.56)
      expect(extractNumericPrice('25')).toBe(25)
    })

    it('should return null for invalid prices', () => {
      expect(extractNumericPrice('Not Found')).toBe(null)
      expect(extractNumericPrice('Error')).toBe(null)
      expect(extractNumericPrice('abc')).toBe(null)
    })
  })

  describe('formatPrice', () => {
    it('should format prices in Canadian currency', () => {
      expect(formatPrice(19.99)).toBe('$19.99')
      expect(formatPrice(1234.56)).toBe('$1,234.56')
      expect(formatPrice(0)).toBe('$0.00')
    })
  })

  describe('calculatePriceStats', () => {
    it('should calculate correct statistics', () => {
      const prices = [10, 20, 30, 40, 50]
      const stats = calculatePriceStats(prices)
      
      expect(stats.min).toBe(10)
      expect(stats.max).toBe(50)
      expect(stats.average).toBe(30)
      expect(stats.median).toBe(30)
      expect(stats.range).toBe(40)
      expect(stats.count).toBe(5)
    })

    it('should handle empty array', () => {
      const stats = calculatePriceStats([])
      
      expect(stats.min).toBe(0)
      expect(stats.max).toBe(0)
      expect(stats.average).toBe(0)
      expect(stats.median).toBe(0)
      expect(stats.range).toBe(0)
      expect(stats.count).toBe(0)
    })

    it('should calculate median for even number of prices', () => {
      const prices = [10, 20, 30, 40]
      const stats = calculatePriceStats(prices)
      
      expect(stats.median).toBe(25) // (20 + 30) / 2
    })
  })

  describe('test data', () => {
    it('should provide valid test products', () => {
      expect(testProducts).toHaveLength(3)
      testProducts.forEach(product => {
        const errors = validateProduct(product)
        expect(errors).toHaveLength(0)
      })
    })

    it('should provide mock price data for all suppliers', () => {
      const expectedSuppliers = [
        'Amazon.ca',
        'ULINE',
        'Brogan Safety',
        'SB Simpson',
        'SPI Health & Safety',
        'Hazmasters',
        'Acklands Grainger',
        'Vallen'
      ]
      
      expectedSuppliers.forEach(supplier => {
        expect(mockPriceData).toHaveProperty(supplier)
      })
    })
  })
})

'use client'

import { useState, useEffect } from 'react'
import ProductForm from '@/components/ProductForm'
import PriceComparisonTable from '@/components/PriceComparisonTable'
import ProductList from '@/components/ProductList'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import SuccessAlert from '@/components/SuccessAlert'
import PriceChart from '@/components/PriceChart'

export interface Product {
  id?: number
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

export interface ProductWithPrices extends Product {
  prices: PriceData[]
  isLoading?: boolean
}

// Sample products from your requirements
const sampleProducts: Product[] = [
  { brand: '3M', partNumber: '2091', size: '' },
  { brand: '3M', partNumber: '2097', size: '' },
  { brand: '3M', partNumber: '6100', size: 'Small' },
  { brand: '3M', partNumber: '6200', size: 'Medium' },
  { brand: '3M', partNumber: '6300', size: 'Large' },
  { brand: '3M', partNumber: '6700', size: 'Small' },
  { brand: '3M', partNumber: '8511', size: '' },
  { brand: 'Honeywell', partNumber: 'LL-1', size: '' },
  { brand: 'Honeywell', partNumber: 'LL-30', size: '' },
  { brand: 'Honeywell', partNumber: 'LT-30', size: '' },
  { brand: 'Honeywell', partNumber: '7580P100', size: '' },
  { brand: 'Honeywell', partNumber: '7581P100', size: '' },
]

export default function Home() {
  const [products, setProducts] = useState<Product[]>(sampleProducts)
  const [productsWithPrices, setProductsWithPrices] = useState<ProductWithPrices[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithPrices | null>(null)
  const [stats, setStats] = useState({
    totalProducts: 0,
    productsWithPrices: 0,
    lastUpdated: null as Date | null
  })

  // Update stats when products change
  useEffect(() => {
    setStats({
      totalProducts: products.length,
      productsWithPrices: productsWithPrices.length,
      lastUpdated: productsWithPrices.length > 0 ? new Date() : null
    })
  }, [products, productsWithPrices])

  const addProduct = (product: Product) => {
    // Check for duplicates
    const exists = products.some(p =>
      p.brand === product.brand &&
      p.partNumber === product.partNumber &&
      p.size === product.size
    )

    if (exists) {
      setError('Product already exists in the list')
      return
    }

    setProducts(prev => [...prev, { ...product, id: Date.now() }])
    setSuccess('Product added successfully')
    setError(null)
  }

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index))
  }

  const fetchPrices = async (product: Product) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/fetch-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch prices')
      }

      const data = await response.json()

      const productWithPrices: ProductWithPrices = {
        ...product,
        prices: data.prices || [],
      }

      setProductsWithPrices(prev => {
        const existing = prev.findIndex(p =>
          p.brand === product.brand &&
          p.partNumber === product.partNumber &&
          p.size === product.size
        )

        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = productWithPrices
          return updated
        } else {
          return [...prev, productWithPrices]
        }
      })

      setSuccess(`Prices fetched successfully for ${product.brand} ${product.partNumber}`)

    } catch (error) {
      console.error('Error fetching prices:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch prices. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllPrices = async () => {
    setIsLoading(true)
    setError(null)

    let successCount = 0
    let errorCount = 0

    for (const product of products) {
      try {
        await fetchPrices(product)
        successCount++
      } catch (error) {
        errorCount++
        console.error(`Failed to fetch prices for ${product.brand} ${product.partNumber}:`, error)
      }
      // Add delay to avoid overwhelming the servers
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    setIsLoading(false)

    if (errorCount === 0) {
      setSuccess(`Successfully fetched prices for all ${successCount} products`)
    } else if (successCount > 0) {
      setSuccess(`Fetched prices for ${successCount} products. ${errorCount} failed.`)
    } else {
      setError(`Failed to fetch prices for all products`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
        />
      )}
      {success && (
        <SuccessAlert
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">With Prices</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.productsWithPrices}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Last Updated</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.lastUpdated ? stats.lastUpdated.toLocaleTimeString() : 'Never'}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Product Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add Product</h2>
        <ProductForm onSubmit={addProduct} />
      </div>

      {/* Product List Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Product List ({products.length})</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setProducts([])
                setProductsWithPrices([])
                setSuccess('All products cleared')
              }}
              disabled={isLoading || products.length === 0}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
            <button
              onClick={fetchAllPrices}
              disabled={isLoading || products.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              <span>{isLoading ? 'Fetching Prices...' : 'Fetch All Prices'}</span>
            </button>
          </div>
        </div>
        <ProductList
          products={products}
          onRemove={removeProduct}
          onFetchPrices={fetchPrices}
          isLoading={isLoading}
        />
      </div>

      {/* Price Comparison Section */}
      {productsWithPrices.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Price Comparison</h2>
            <div className="flex space-x-2">
              <select
                value={selectedProduct?.partNumber || ''}
                onChange={(e) => {
                  const product = productsWithPrices.find(p => p.partNumber === e.target.value)
                  setSelectedProduct(product || null)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select product for chart</option>
                {productsWithPrices.map((product, index) => (
                  <option key={index} value={product.partNumber}>
                    {product.brand} {product.partNumber} {product.size && `(${product.size})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <PriceComparisonTable products={productsWithPrices} />
        </div>
      )}

      {/* Price Chart Section */}
      {selectedProduct && (
        <div className="bg-white rounded-lg shadow p-6">
          <PriceChart product={selectedProduct} />
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <LoadingSpinner size="lg" text="Fetching prices from suppliers..." />
          </div>
        </div>
      )}
    </div>
  )
}

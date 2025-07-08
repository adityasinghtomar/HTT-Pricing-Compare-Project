'use client'

import { ProductWithPrices } from '@/app/page'

interface PriceChartProps {
  product: ProductWithPrices
}

export default function PriceChart({ product }: PriceChartProps) {
  const validPrices = product.prices
    .filter(p => p.price && p.price !== 'Not Found' && p.price !== 'Error' && p.price !== 'Timeout')
    .map(p => ({
      website: p.website,
      price: parseFloat(p.price.replace(/[$,]/g, '')) || 0
    }))
    .filter(p => p.price > 0)
    .sort((a, b) => a.price - b.price)

  if (validPrices.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No valid prices available for comparison
      </div>
    )
  }

  const minPrice = Math.min(...validPrices.map(p => p.price))
  const maxPrice = Math.max(...validPrices.map(p => p.price))
  const priceRange = maxPrice - minPrice

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">
        Price Comparison: {product.brand} {product.partNumber}
        {product.size && ` (${product.size})`}
      </h3>
      
      <div className="space-y-3">
        {validPrices.map((item, index) => {
          const isLowest = item.price === minPrice
          const isHighest = item.price === maxPrice
          const barWidth = priceRange > 0 ? ((item.price - minPrice) / priceRange) * 100 : 100
          
          return (
            <div key={item.website} className="flex items-center space-x-3">
              <div className="w-32 text-sm font-medium text-gray-700 truncate">
                {item.website}
              </div>
              <div className="flex-1 relative">
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isLowest ? 'bg-green-500' : isHighest ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(barWidth, 10)}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className={`text-xs font-semibold ${
                    isLowest ? 'text-green-700' : isHighest ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              </div>
              {isLowest && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Lowest
                </span>
              )}
              {isHighest && validPrices.length > 1 && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Highest
                </span>
              )}
            </div>
          )
        })}
      </div>
      
      {validPrices.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">${minPrice.toFixed(2)}</div>
              <div className="text-gray-500">Lowest Price</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                ${((validPrices.reduce((sum, p) => sum + p.price, 0) / validPrices.length)).toFixed(2)}
              </div>
              <div className="text-gray-500">Average Price</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">${maxPrice.toFixed(2)}</div>
              <div className="text-gray-500">Highest Price</div>
            </div>
          </div>
          {priceRange > 0 && (
            <div className="text-center mt-2">
              <div className="text-sm text-gray-600">
                Price difference: <span className="font-semibold">${priceRange.toFixed(2)}</span>
                {' '}({((priceRange / minPrice) * 100).toFixed(1)}%)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

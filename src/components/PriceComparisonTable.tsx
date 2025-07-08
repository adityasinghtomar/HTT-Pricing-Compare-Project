'use client'

import { ProductWithPrices } from '@/app/page'

interface PriceComparisonTableProps {
  products: ProductWithPrices[]
}

const websites = [
  'Amazon.ca',
  'ULINE',
  'Brogan Safety',
  'SB Simpson',
  'SPI Health & Safety',
  'Hazmasters',
  'Acklands Grainger',
  'Vallen'
]

export default function PriceComparisonTable({ products }: PriceComparisonTableProps) {
  const formatPrice = (price: string) => {
    if (!price || price === 'Not Found' || price === 'N/A') {
      return price
    }
    // Ensure price starts with $ if it's a valid price
    return price.startsWith('$') ? price : `$${price}`
  }

  const getPriceColor = (price: string) => {
    if (!price || price === 'Not Found' || price === 'N/A') {
      return 'text-gray-500'
    }
    return 'text-green-600 font-semibold'
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
              Product
            </th>
            {websites.map((website) => (
              <th
                key={website}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {website}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                <div>
                  <div className="font-semibold">{product.brand} {product.partNumber}</div>
                  {product.size && (
                    <div className="text-xs text-gray-500">{product.size}</div>
                  )}
                </div>
              </td>
              {websites.map((website) => {
                const priceData = product.prices?.find(p => p.website === website)
                const price = priceData?.price || 'Not Found'
                
                return (
                  <td key={website} className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className={getPriceColor(price)}>
                      {formatPrice(price)}
                    </div>
                    {priceData?.availability && (
                      <div className="text-xs text-gray-500">
                        {priceData.availability}
                      </div>
                    )}
                    {priceData?.link && price !== 'Not Found' && (
                      <a
                        href={priceData.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Product
                      </a>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No price data available. Fetch prices for products to see comparison.
        </div>
      )}
    </div>
  )
}

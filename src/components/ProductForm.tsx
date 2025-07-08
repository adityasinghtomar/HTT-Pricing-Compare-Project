'use client'

import { useState } from 'react'
import { Product } from '@/app/page'

interface ProductFormProps {
  onSubmit: (product: Product) => void
}

export default function ProductForm({ onSubmit }: ProductFormProps) {
  const [brand, setBrand] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [size, setSize] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!brand.trim() || !partNumber.trim()) {
      alert('Please fill in both Brand and Part Number')
      return
    }

    onSubmit({
      brand: brand.trim(),
      partNumber: partNumber.trim(),
      size: size.trim(),
    })

    // Reset form
    setBrand('')
    setPartNumber('')
    setSize('')
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
          Brand *
        </label>
        <input
          type="text"
          id="brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g., 3M, Honeywell"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Part Number *
        </label>
        <input
          type="text"
          id="partNumber"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
          placeholder="e.g., 2091, LL-1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
          Size (Optional)
        </label>
        <input
          type="text"
          id="size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="e.g., Small, Medium, Large"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add Product
        </button>
      </div>
    </form>
  )
}

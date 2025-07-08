import { NextRequest, NextResponse } from 'next/server'
import { ProductModel } from '@/lib/database/models'

export async function GET() {
  try {
    const products = await ProductModel.findAll()
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { brand, partNumber, size, description, category } = await request.json()
    
    if (!brand || !partNumber) {
      return NextResponse.json(
        { error: 'Brand and part number are required' },
        { status: 400 }
      )
    }

    // Check if product already exists
    const existingProduct = await ProductModel.findByBrandAndPart(brand, partNumber, size)
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product already exists' },
        { status: 409 }
      )
    }

    const productId = await ProductModel.create({
      brand,
      part_number: partNumber,
      size,
      description,
      category
    })

    const newProduct = await ProductModel.findById(productId)
    return NextResponse.json({ product: newProduct }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

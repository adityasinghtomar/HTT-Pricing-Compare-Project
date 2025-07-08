import { NextRequest, NextResponse } from 'next/server'
import { SupplierModel } from '@/lib/database/models'

export async function GET() {
  try {
    const suppliers = await SupplierModel.findAll()
    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, website_url, search_url_template, is_active, scraper_config } = await request.json()
    
    if (!name || !website_url) {
      return NextResponse.json(
        { error: 'Name and website URL are required' },
        { status: 400 }
      )
    }

    // Check if supplier already exists
    const existingSupplier = await SupplierModel.findByName(name)
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier already exists' },
        { status: 409 }
      )
    }

    const supplierId = await SupplierModel.create({
      name,
      website_url,
      search_url_template,
      is_active: is_active !== undefined ? is_active : true,
      scraper_config
    })

    return NextResponse.json({ 
      message: 'Supplier created successfully',
      supplierId 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

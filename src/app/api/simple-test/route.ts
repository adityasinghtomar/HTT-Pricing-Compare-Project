import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Simple test endpoint called')
    
    return NextResponse.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage()
    })

  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

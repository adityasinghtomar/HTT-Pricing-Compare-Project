import { NextResponse } from 'next/server'
import { db } from '@/lib/database/connection'

export async function GET() {
  try {
    const isHealthy = await db.healthCheck()
    
    if (isHealthy) {
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '1.0.0'
      })
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        version: '1.0.0'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      version: '1.0.0'
    }, { status: 503 })
  }
}

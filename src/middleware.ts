import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/rate-limiter'

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const identifier = `${ip}-${request.nextUrl.pathname}`
    
    if (!rateLimiter.isAllowed(identifier)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          resetTime: rateLimiter.getResetTime(identifier)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimiter.getRemainingRequests(identifier).toString(),
            'X-RateLimit-Reset': rateLimiter.getResetTime(identifier).toString(),
          }
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', '10')
    response.headers.set('X-RateLimit-Remaining', rateLimiter.getRemainingRequests(identifier).toString())
    response.headers.set('X-RateLimit-Reset', rateLimiter.getResetTime(identifier).toString())
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}

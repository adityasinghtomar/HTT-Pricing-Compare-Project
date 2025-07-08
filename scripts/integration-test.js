#!/usr/bin/env node

const { testProducts, createMockResponse, testDatabaseConnection } = require('../src/lib/test-utils')

async function runIntegrationTests() {
  console.log('🚀 Starting Integration Tests...\n')

  // Test 1: Database Connection
  console.log('1. Testing Database Connection...')
  try {
    const isHealthy = await testDatabaseConnection()
    if (isHealthy) {
      console.log('   ✅ Database connection successful')
    } else {
      console.log('   ⚠️  Database connection failed (this is expected if DB is not set up)')
    }
  } catch (error) {
    console.log('   ⚠️  Database test failed:', error.message)
  }

  // Test 2: API Health Check
  console.log('\n2. Testing API Health Check...')
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ API health check successful:', data.status)
    } else {
      console.log('   ❌ API health check failed:', response.status)
    }
  } catch (error) {
    console.log('   ⚠️  API not running (start with npm run dev)')
  }

  // Test 3: Price Fetching API
  console.log('\n3. Testing Price Fetching API...')
  try {
    const testProduct = testProducts[0]
    const response = await fetch('http://localhost:3000/api/fetch-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('   ✅ Price fetching successful')
      console.log(`   📊 Fetched prices for: ${data.product}`)
      console.log(`   🕒 Duration: ${data.duration}ms`)
      console.log(`   🆔 Session: ${data.sessionId}`)
      
      // Check price data
      const validPrices = data.prices.filter(p => 
        p.price && p.price !== 'Not Found' && p.price !== 'Error' && p.price !== 'Timeout'
      )
      console.log(`   💰 Valid prices found: ${validPrices.length}/${data.prices.length}`)
      
      if (validPrices.length > 0) {
        console.log('   📈 Sample prices:')
        validPrices.slice(0, 3).forEach(p => {
          console.log(`      ${p.website}: ${p.price}`)
        })
      }
    } else {
      const errorData = await response.json()
      console.log('   ❌ Price fetching failed:', errorData.error)
    }
  } catch (error) {
    console.log('   ⚠️  Price fetching test failed:', error.message)
  }

  // Test 4: Rate Limiting
  console.log('\n4. Testing Rate Limiting...')
  try {
    const requests = []
    for (let i = 0; i < 12; i++) {
      requests.push(
        fetch('http://localhost:3000/api/health').then(r => ({
          status: r.status,
          headers: Object.fromEntries(r.headers.entries())
        }))
      )
    }

    const responses = await Promise.all(requests)
    const rateLimited = responses.filter(r => r.status === 429)
    
    if (rateLimited.length > 0) {
      console.log('   ✅ Rate limiting is working')
      console.log(`   🚫 ${rateLimited.length} requests were rate limited`)
    } else {
      console.log('   ⚠️  Rate limiting may not be working (or limit is high)')
    }

    // Check rate limit headers
    const lastResponse = responses[responses.length - 1]
    if (lastResponse.headers['x-ratelimit-limit']) {
      console.log(`   📊 Rate limit: ${lastResponse.headers['x-ratelimit-limit']} requests/minute`)
      console.log(`   📊 Remaining: ${lastResponse.headers['x-ratelimit-remaining']}`)
    }
  } catch (error) {
    console.log('   ⚠️  Rate limiting test failed:', error.message)
  }

  // Test 5: Product Management API
  console.log('\n5. Testing Product Management API...')
  try {
    // Get products
    const getResponse = await fetch('http://localhost:3000/api/products')
    if (getResponse.ok) {
      const data = await getResponse.json()
      console.log('   ✅ Product listing successful')
      console.log(`   📦 Found ${data.products?.length || 0} products`)
    } else {
      console.log('   ❌ Product listing failed:', getResponse.status)
    }

    // Create product (this might fail if DB is not set up)
    const createResponse = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: 'Test Brand',
        partNumber: 'TEST-001',
        size: 'Test Size',
        description: 'Integration test product'
      })
    })

    if (createResponse.ok) {
      console.log('   ✅ Product creation successful')
    } else {
      const errorData = await createResponse.json()
      console.log('   ⚠️  Product creation failed:', errorData.error)
    }
  } catch (error) {
    console.log('   ⚠️  Product management test failed:', error.message)
  }

  console.log('\n🏁 Integration Tests Complete!')
  console.log('\nNext Steps:')
  console.log('- Set up MySQL database if not already done')
  console.log('- Run: npm run db:setup')
  console.log('- Start the development server: npm run dev')
  console.log('- Run tests: npm test')
  console.log('- Check coverage: npm run test:coverage')
}

// Run the tests
if (require.main === module) {
  runIntegrationTests().catch(console.error)
}

module.exports = { runIntegrationTests }

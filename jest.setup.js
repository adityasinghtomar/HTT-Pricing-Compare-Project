import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock window.alert
global.alert = jest.fn()

// Mock fetch
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks()
})

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '3306'
process.env.DB_USER = 'test'
process.env.DB_PASSWORD = 'test'
process.env.DB_NAME = 'test_pricing_dashboard'

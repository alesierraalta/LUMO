// Global setup for integration tests
module.exports = async () => {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'file:./test-integration.db'
  process.env.JWT_SECRET = 'test-secret-key-for-integration-tests'
  
  console.log('🚀 Setting up integration test environment...')
  console.log('Database URL:', process.env.DATABASE_URL)
  
  // Additional global setup can be added here
} 
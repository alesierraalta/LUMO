// Global teardown for integration tests
const { unlinkSync, existsSync } = require('fs')
const path = require('path')

module.exports = async () => {
  console.log('🧹 Cleaning up integration test environment...')
  
  // Clean up test database file
  const testDbPath = path.join(process.cwd(), 'test-integration.db')
  if (existsSync(testDbPath)) {
    try {
      unlinkSync(testDbPath)
      console.log('✅ Test database cleaned up')
    } catch (error) {
      console.warn('⚠️ Could not delete test database:', error.message)
    }
  }
  
  console.log('✅ Integration test cleanup completed')
} 
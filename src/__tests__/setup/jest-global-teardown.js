// Global teardown for integration tests
import { unlinkSync, existsSync } from 'fs'
import path from 'path'

export default async () => {
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
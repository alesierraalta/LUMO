import { FullConfig } from '@playwright/test'
import { cleanupTestDatabase, disconnectDatabase } from '../integration/test-setup'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E Test Global Teardown...')
  
  try {
    // Cleanup test database
    await cleanupTestDatabase()
    console.log('✅ Test database cleanup complete')
    
    // Disconnect database connections
    await disconnectDatabase()
    console.log('✅ Database connections closed')
    
    console.log('🎉 E2E Test Global Teardown Complete!')
    
  } catch (error) {
    console.error('❌ E2E Test Global Teardown Failed:', error)
    // Don't throw error here as it might mask test failures
  }
}

export default globalTeardown 
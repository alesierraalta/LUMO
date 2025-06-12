import { chromium, FullConfig } from '@playwright/test'
import { setupTestDatabase, testConfig } from '../integration/test-setup'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Global Setup...')
  
  // Environment detection
  console.log(`Environment: ${testConfig.isDevelopment ? 'Development' : 'Production'}`)
  console.log(`Database: ${testConfig.usingPrisma ? 'Prisma' : 'Supabase'}`)
  
  try {
    // Setup test database
    await setupTestDatabase()
    console.log('✅ Test database setup complete')
    
    // Verify application is running
    const browser = await chromium.launch()
    const page = await browser.newPage()
    
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000'
    console.log(`Testing connection to: ${baseURL}`)
    
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle' })
      console.log('✅ Application is accessible')
    } catch (error) {
      console.error('❌ Application is not accessible:', error)
      throw new Error(`Cannot connect to application at ${baseURL}. Make sure the development server is running.`)
    } finally {
      await page.close()
      await browser.close()
    }
    
    console.log('🎉 E2E Test Global Setup Complete!')
    
  } catch (error) {
    console.error('❌ E2E Test Global Setup Failed:', error)
    throw error
  }
}

export default globalSetup 
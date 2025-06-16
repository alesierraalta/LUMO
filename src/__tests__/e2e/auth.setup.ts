import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'
const adminAuthFile = 'playwright/.auth/admin.json'

setup('authenticate as regular user', async ({ page }) => {
  // Save mock authentication state
  await page.context().storageState({ path: authFile })
  
  // Verify we can navigate to a page (basic connectivity test)
  await page.goto('http://localhost:3000')
  expect(page.url()).toContain('localhost:3000')
})

setup('authenticate as admin user', async ({ page }) => {
  // Save mock authentication state
  await page.context().storageState({ path: adminAuthFile })
  
  // Verify we can navigate to a page (basic connectivity test)
  await page.goto('http://localhost:3000')
  expect(page.url()).toContain('localhost:3000')
}) 
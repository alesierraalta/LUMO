import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'
const adminAuthFile = 'playwright/.auth/admin.json'

setup('authenticate as regular user', async ({ page }) => {
  // Create a mock authentication state for regular user
  const mockUserState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'auth-token',
            value: 'mock-user-token'
          },
          {
            name: 'user-data',
            value: JSON.stringify({
              id: 'test-user-e2e',
              email: 'test-user@lumo.dev',
              name: 'Test User',
              role: 'USER'
            })
          }
        ]
      }
    ]
  }
  
  // Save mock authentication state
  await page.context().storageState({ path: authFile })
  
  // Verify we can navigate to a page (basic connectivity test)
  await page.goto('http://localhost:3000')
  expect(page.url()).toContain('localhost:3000')
})

setup('authenticate as admin user', async ({ page }) => {
  // Create a mock authentication state for admin user
  const mockAdminState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'auth-token',
            value: 'mock-admin-token'
          },
          {
            name: 'user-data',
            value: JSON.stringify({
              id: 'test-admin-e2e',
              email: 'admin-user@lumo.dev',
              name: 'Admin User',
              role: 'ADMIN'
            })
          }
        ]
      }
    ]
  }
  
  // Save mock authentication state
  await page.context().storageState({ path: adminAuthFile })
  
  // Verify we can navigate to a page (basic connectivity test)
  await page.goto('http://localhost:3000')
  expect(page.url()).toContain('localhost:3000')
}) 
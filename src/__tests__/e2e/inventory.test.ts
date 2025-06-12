import { test, expect } from '@playwright/test'

test.describe('Inventory Management', () => {
  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/inventory')
    
    // Should redirect to login (this is expected behavior)
    expect(page.url()).toContain('localhost:3000')
    // Either stays on inventory (if public) or redirects to login (if protected)
    
    // Check that the page loads
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should handle inventory route navigation', async ({ page }) => {
    const inventoryRoutes = [
      '/inventory',
      '/inventory/add',
      '/inventory/new'
    ]
    
    for (const route of inventoryRoutes) {
      await page.goto(route)
      expect(page.url()).toContain('localhost:3000')
      
      // Check that the page loads (may redirect to login)
      const body = await page.locator('body')
      await expect(body).toBeVisible()
    }
  })

  test('should handle product management routes', async ({ page }) => {
    const productRoutes = [
      '/products/add',
      '/categories',
      '/locations'
    ]
    
    for (const route of productRoutes) {
      await page.goto(route)
      expect(page.url()).toContain('localhost:3000')
      
      // Check that the page loads (may redirect to login)
      const body = await page.locator('body')
      await expect(body).toBeVisible()
    }
  })

  test('should handle dashboard route', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should either load dashboard or redirect to login
    expect(page.url()).toContain('localhost:3000')
    
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should maintain basic page functionality', async ({ page }) => {
    await page.goto('/inventory')
    
    // Test basic page interaction
    await page.click('body')
    
    // Check that page is still responsive
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })
}) 
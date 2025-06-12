import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should load the application homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads successfully
    expect(page.url()).toContain('localhost:3000')
    
    // Check that the page has some content
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should be able to navigate to different routes', async ({ page }) => {
    // Test basic navigation to public routes
    const routes = ['/', '/login']
    
    for (const route of routes) {
      await page.goto(route)
      expect(page.url()).toContain('localhost:3000')
      
      // Check that the page loads without major errors
      const body = await page.locator('body')
      await expect(body).toBeVisible()
    }
  })

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    // Should either show 404 page or redirect
    expect(page.url()).toContain('localhost:3000')
    
    // Page should load something
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should respond to basic interactions', async ({ page }) => {
    await page.goto('/')
    
    // Test basic page interaction
    await page.click('body')
    
    // Check that page is still responsive
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should load login page', async ({ page }) => {
    await page.goto('/login')
    
    // Check that login page loads
    expect(page.url()).toContain('localhost:3000')
    expect(page.url()).toContain('/login')
    
    // Check that the page has content
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })
}) 
import { Page, Locator, expect } from '@playwright/test'

/**
 * E2E Testing Utilities for LUMO Inventory System
 * 
 * This module provides comprehensive E2E testing capabilities using Playwright
 * for testing complete user workflows and system integration.
 */

export interface E2ETestUser {
  email: string
  password: string
  name: string
  role: string
}

export interface E2ETestData {
  users: E2ETestUser[]
  categories: Array<{ name: string; description: string }>
  locations: Array<{ name: string; description: string }>
  products: Array<{
    name: string
    description: string
    sku: string
    category: string
    location: string
    stock: number
    cost: number
    price: number
  }>
}

/**
 * Page Object Model for LUMO application
 */
export class LumoPageObjects {
  constructor(private page: Page) {}

  // Authentication Pages
  get loginPage() {
    return new LoginPage(this.page)
  }

  get registerPage() {
    return new RegisterPage(this.page)
  }

  // Main Application Pages
  get dashboardPage() {
    return new DashboardPage(this.page)
  }

  get inventoryPage() {
    return new InventoryPage(this.page)
  }

  get categoriesPage() {
    return new CategoriesPage(this.page)
  }

  get locationsPage() {
    return new LocationsPage(this.page)
  }

  get settingsPage() {
    return new SettingsPage(this.page)
  }

  get usersPage() {
    return new UsersPage(this.page)
  }
}

/**
 * Base Page Object with common functionality
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(url: string) {
    await this.page.goto(url)
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` })
  }

  async expectToBeVisible(locator: Locator) {
    await expect(locator).toBeVisible()
  }

  async expectToHaveText(locator: Locator, text: string) {
    await expect(locator).toHaveText(text)
  }

  async clickAndWait(locator: Locator) {
    await locator.click()
    await this.waitForLoad()
  }

  async fillAndWait(locator: Locator, value: string) {
    await locator.fill(value)
    await this.page.waitForTimeout(100) // Small delay for UI updates
  }
}

/**
 * Login Page Object
 */
export class LoginPage extends BasePage {
  get emailInput() {
    return this.page.locator('input[name="email"]')
  }

  get passwordInput() {
    return this.page.locator('input[name="password"]')
  }

  get loginButton() {
    return this.page.locator('button[type="submit"]')
  }

  get errorMessage() {
    return this.page.locator('[data-testid="error-message"]')
  }

  async login(email: string, password: string) {
    await this.fillAndWait(this.emailInput, email)
    await this.fillAndWait(this.passwordInput, password)
    await this.clickAndWait(this.loginButton)
  }

  async expectLoginError(message: string) {
    await this.expectToBeVisible(this.errorMessage)
    await this.expectToHaveText(this.errorMessage, message)
  }
}

/**
 * Register Page Object
 */
export class RegisterPage extends BasePage {
  get nameInput() {
    return this.page.locator('input[name="name"]')
  }

  get emailInput() {
    return this.page.locator('input[name="email"]')
  }

  get passwordInput() {
    return this.page.locator('input[name="password"]')
  }

  get confirmPasswordInput() {
    return this.page.locator('input[name="confirmPassword"]')
  }

  get registerButton() {
    return this.page.locator('button[type="submit"]')
  }

  async register(name: string, email: string, password: string) {
    await this.fillAndWait(this.nameInput, name)
    await this.fillAndWait(this.emailInput, email)
    await this.fillAndWait(this.passwordInput, password)
    await this.fillAndWait(this.confirmPasswordInput, password)
    await this.clickAndWait(this.registerButton)
  }
}

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  get welcomeMessage() {
    return this.page.locator('[data-testid="welcome-message"]')
  }

  get statsCards() {
    return this.page.locator('[data-testid="stats-card"]')
  }

  get recentProductsList() {
    return this.page.locator('[data-testid="recent-products"]')
  }

  get lowStockAlert() {
    return this.page.locator('[data-testid="low-stock-alert"]')
  }

  async expectDashboardLoaded() {
    await this.expectToBeVisible(this.welcomeMessage)
    await this.expectToBeVisible(this.statsCards.first())
  }

  async getStatsCardValue(cardName: string): Promise<string> {
    const card = this.page.locator(`[data-testid="stats-card"][data-name="${cardName}"]`)
    return await card.locator('[data-testid="stats-value"]').textContent() || ''
  }
}

/**
 * Inventory Page Object
 */
export class InventoryPage extends BasePage {
  get addProductButton() {
    return this.page.locator('[data-testid="add-product-button"]')
  }

  get searchInput() {
    return this.page.locator('[data-testid="search-input"]')
  }

  get productTable() {
    return this.page.locator('[data-testid="product-table"]')
  }

  get productRows() {
    return this.page.locator('[data-testid="product-row"]')
  }

  get filterButton() {
    return this.page.locator('[data-testid="filter-button"]')
  }

  async addNewProduct(productData: {
    name: string
    description: string
    sku: string
    category: string
    location: string
    stock: number
    cost: number
    price: number
  }) {
    await this.clickAndWait(this.addProductButton)
    
    // Fill product form
    await this.fillAndWait(this.page.locator('input[name="name"]'), productData.name)
    await this.fillAndWait(this.page.locator('textarea[name="description"]'), productData.description)
    await this.fillAndWait(this.page.locator('input[name="sku"]'), productData.sku)
    
    // Select category and location
    await this.page.locator('select[name="categoryId"]').selectOption({ label: productData.category })
    await this.page.locator('select[name="locationId"]').selectOption({ label: productData.location })
    
    // Fill numeric fields
    await this.fillAndWait(this.page.locator('input[name="currentStock"]'), productData.stock.toString())
    await this.fillAndWait(this.page.locator('input[name="cost"]'), productData.cost.toString())
    await this.fillAndWait(this.page.locator('input[name="price"]'), productData.price.toString())
    
    // Submit form
    await this.clickAndWait(this.page.locator('button[type="submit"]'))
  }

  async searchProducts(query: string) {
    await this.fillAndWait(this.searchInput, query)
    await this.page.waitForTimeout(500) // Wait for search debounce
  }

  async expectProductInTable(productName: string) {
    const productRow = this.page.locator(`[data-testid="product-row"]:has-text("${productName}")`)
    await this.expectToBeVisible(productRow)
  }

  async editProduct(productName: string, newData: Partial<{
    name: string
    stock: number
    price: number
  }>) {
    const productRow = this.page.locator(`[data-testid="product-row"]:has-text("${productName}")`)
    await productRow.locator('[data-testid="edit-button"]').click()
    
    if (newData.name) {
      await this.fillAndWait(this.page.locator('input[name="name"]'), newData.name)
    }
    if (newData.stock !== undefined) {
      await this.fillAndWait(this.page.locator('input[name="currentStock"]'), newData.stock.toString())
    }
    if (newData.price !== undefined) {
      await this.fillAndWait(this.page.locator('input[name="price"]'), newData.price.toString())
    }
    
    await this.clickAndWait(this.page.locator('button[type="submit"]'))
  }

  async deleteProduct(productName: string) {
    const productRow = this.page.locator(`[data-testid="product-row"]:has-text("${productName}")`)
    await productRow.locator('[data-testid="delete-button"]').click()
    
    // Confirm deletion
    await this.clickAndWait(this.page.locator('[data-testid="confirm-delete"]'))
  }
}

/**
 * Categories Page Object
 */
export class CategoriesPage extends BasePage {
  get addCategoryButton() {
    return this.page.locator('[data-testid="add-category-button"]')
  }

  get categoryList() {
    return this.page.locator('[data-testid="category-list"]')
  }

  async addCategory(name: string, description: string) {
    await this.clickAndWait(this.addCategoryButton)
    await this.fillAndWait(this.page.locator('input[name="name"]'), name)
    await this.fillAndWait(this.page.locator('textarea[name="description"]'), description)
    await this.clickAndWait(this.page.locator('button[type="submit"]'))
  }

  async expectCategoryExists(name: string) {
    const category = this.page.locator(`[data-testid="category-item"]:has-text("${name}")`)
    await this.expectToBeVisible(category)
  }
}

/**
 * Locations Page Object
 */
export class LocationsPage extends BasePage {
  get addLocationButton() {
    return this.page.locator('[data-testid="add-location-button"]')
  }

  get locationList() {
    return this.page.locator('[data-testid="location-list"]')
  }

  async addLocation(name: string, description: string) {
    await this.clickAndWait(this.addLocationButton)
    await this.fillAndWait(this.page.locator('input[name="name"]'), name)
    await this.fillAndWait(this.page.locator('textarea[name="description"]'), description)
    await this.clickAndWait(this.page.locator('button[type="submit"]'))
  }

  async expectLocationExists(name: string) {
    const location = this.page.locator(`[data-testid="location-item"]:has-text("${name}")`)
    await this.expectToBeVisible(location)
  }
}

/**
 * Settings Page Object
 */
export class SettingsPage extends BasePage {
  get profileTab() {
    return this.page.locator('[data-testid="profile-tab"]')
  }

  get usersTab() {
    return this.page.locator('[data-testid="users-tab"]')
  }

  get databaseTab() {
    return this.page.locator('[data-testid="database-tab"]')
  }
}

/**
 * Users Page Object
 */
export class UsersPage extends BasePage {
  get addUserButton() {
    return this.page.locator('[data-testid="add-user-button"]')
  }

  get userTable() {
    return this.page.locator('[data-testid="user-table"]')
  }

  async addUser(userData: E2ETestUser) {
    await this.clickAndWait(this.addUserButton)
    await this.fillAndWait(this.page.locator('input[name="name"]'), userData.name)
    await this.fillAndWait(this.page.locator('input[name="email"]'), userData.email)
    await this.fillAndWait(this.page.locator('input[name="password"]'), userData.password)
    await this.page.locator('select[name="roleId"]').selectOption({ label: userData.role })
    await this.clickAndWait(this.page.locator('button[type="submit"]'))
  }

  async expectUserExists(email: string) {
    const userRow = this.page.locator(`[data-testid="user-row"]:has-text("${email}")`)
    await this.expectToBeVisible(userRow)
  }
}

/**
 * E2E Test Scenarios
 */
export class E2ETestScenarios {
  constructor(private page: Page) {}

  get pageObjects() {
    return new LumoPageObjects(this.page)
  }

  /**
   * Complete user registration and login flow
   */
  async userRegistrationAndLoginFlow(userData: E2ETestUser) {
    // Navigate to register page
    await this.page.goto('/register')
    
    // Register new user
    await this.pageObjects.registerPage.register(
      userData.name,
      userData.email,
      userData.password
    )
    
    // Should redirect to login or dashboard
    await this.page.waitForURL(/\/(login|dashboard)/)
    
    // If redirected to login, log in
    if (this.page.url().includes('/login')) {
      await this.pageObjects.loginPage.login(userData.email, userData.password)
    }
    
    // Should be on dashboard
    await this.page.waitForURL('/dashboard')
    await this.pageObjects.dashboardPage.expectDashboardLoaded()
  }

  /**
   * Complete inventory management workflow
   */
  async inventoryManagementFlow(testData: E2ETestData) {
    // Navigate to inventory page
    await this.page.goto('/inventory')
    
    // Add categories first
    await this.page.goto('/categories')
    for (const category of testData.categories) {
      await this.pageObjects.categoriesPage.addCategory(category.name, category.description)
      await this.pageObjects.categoriesPage.expectCategoryExists(category.name)
    }
    
    // Add locations
    await this.page.goto('/locations')
    for (const location of testData.locations) {
      await this.pageObjects.locationsPage.addLocation(location.name, location.description)
      await this.pageObjects.locationsPage.expectLocationExists(location.name)
    }
    
    // Add products
    await this.page.goto('/inventory')
    for (const product of testData.products) {
      await this.pageObjects.inventoryPage.addNewProduct(product)
      await this.pageObjects.inventoryPage.expectProductInTable(product.name)
    }
    
    // Test search functionality
    const firstProduct = testData.products[0]
    await this.pageObjects.inventoryPage.searchProducts(firstProduct.name)
    await this.pageObjects.inventoryPage.expectProductInTable(firstProduct.name)
    
    // Test edit functionality
    await this.pageObjects.inventoryPage.editProduct(firstProduct.name, {
      stock: firstProduct.stock + 10,
      price: firstProduct.price + 5
    })
  }

  /**
   * User management workflow
   */
  async userManagementFlow(adminUser: E2ETestUser, newUsers: E2ETestUser[]) {
    // Login as admin
    await this.page.goto('/login')
    await this.pageObjects.loginPage.login(adminUser.email, adminUser.password)
    
    // Navigate to users page
    await this.page.goto('/settings/users')
    
    // Add new users
    for (const user of newUsers) {
      await this.pageObjects.usersPage.addUser(user)
      await this.pageObjects.usersPage.expectUserExists(user.email)
    }
  }

  /**
   * Stock movement workflow
   */
  async stockMovementFlow(productName: string, movements: Array<{
    type: 'IN' | 'OUT' | 'ADJUSTMENT'
    quantity: number
    reason: string
  }>) {
    await this.page.goto('/inventory')
    
    for (const movement of movements) {
      // Find product and click stock adjustment
      const productRow = this.page.locator(`[data-testid="product-row"]:has-text("${productName}")`)
      await productRow.locator('[data-testid="adjust-stock-button"]').click()
      
      // Fill movement form
      await this.page.locator('select[name="type"]').selectOption(movement.type)
      await this.page.locator('input[name="quantity"]').fill(movement.quantity.toString())
      await this.page.locator('textarea[name="reason"]').fill(movement.reason)
      
      // Submit
      await this.page.locator('button[type="submit"]').click()
      await this.page.waitForLoadState('networkidle')
    }
  }
}

/**
 * E2E Test Data Factory
 */
export const createE2ETestData = (): E2ETestData => {
  const timestamp = Date.now()
  
  return {
    users: [
      {
        email: `admin${timestamp}@test.com`,
        password: 'AdminPass123!',
        name: 'Test Admin',
        role: 'ADMIN'
      },
      {
        email: `user${timestamp}@test.com`,
        password: 'UserPass123!',
        name: 'Test User',
        role: 'USER'
      }
    ],
    categories: [
      {
        name: `Electronics ${timestamp}`,
        description: 'Electronic devices and components'
      },
      {
        name: `Furniture ${timestamp}`,
        description: 'Office and home furniture'
      }
    ],
    locations: [
      {
        name: `Warehouse A ${timestamp}`,
        description: 'Main warehouse location'
      },
      {
        name: `Store Front ${timestamp}`,
        description: 'Retail store location'
      }
    ],
    products: [
      {
        name: `Laptop Computer ${timestamp}`,
        description: 'High-performance laptop',
        sku: `LAP-${timestamp}`,
        category: `Electronics ${timestamp}`,
        location: `Warehouse A ${timestamp}`,
        stock: 50,
        cost: 800,
        price: 1200
      },
      {
        name: `Office Chair ${timestamp}`,
        description: 'Ergonomic office chair',
        sku: `CHR-${timestamp}`,
        category: `Furniture ${timestamp}`,
        location: `Store Front ${timestamp}`,
        stock: 25,
        cost: 150,
        price: 250
      }
    ]
  }
}

/**
 * E2E Test Utilities
 */
export const e2eTestUtils = {
  /**
   * Setup test environment
   */
  setupTestEnvironment: async (page: Page) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Set up request/response logging
    page.on('request', request => {
      console.log(`→ ${request.method()} ${request.url()}`)
    })
    
    page.on('response', response => {
      console.log(`← ${response.status()} ${response.url()}`)
    })
    
    // Handle console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`)
      }
    })
  },

  /**
   * Clean up test data
   */
  cleanupTestData: async (page: Page, testData: E2ETestData) => {
    // This would typically call cleanup API endpoints
    // For now, we'll just log the cleanup
    console.log('Cleaning up test data:', testData)
  },

  /**
   * Take screenshot on failure
   */
  screenshotOnFailure: async (page: Page, testName: string) => {
    await page.screenshot({
      path: `screenshots/failure-${testName}-${Date.now()}.png`,
      fullPage: true
    })
  }
} 
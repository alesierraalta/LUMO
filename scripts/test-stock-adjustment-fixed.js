/**
 * Comprehensive Stock Adjustment Test Script
 * Tests both add-stock and remove-stock endpoints with database verification
 */

const puppeteer = require('puppeteer');

async function testStockAdjustment() {
  let browser;
  
  try {
    console.log('🚀 Starting comprehensive stock adjustment test...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Enable request interception to monitor API calls
    await page.setRequestInterception(true);
    const apiCalls = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/inventory/') && 
          (request.url().includes('/add-stock') || request.url().includes('/remove-stock'))) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
      request.continue();
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/inventory/') && 
          (response.url().includes('/add-stock') || response.url().includes('/remove-stock'))) {
        const responseData = await response.text();
        console.log(`📡 API Response for ${response.url()}:`, responseData);
      }
    });

    // Navigate to inventory list
    console.log('📋 Navigating to inventory list...');
    await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle0' });
    
    // Wait for inventory items to load
    await page.waitForSelector('[data-testid="inventory-item"]', { timeout: 10000 });
    
    // Get the first inventory item
    const firstItem = await page.$('[data-testid="inventory-item"]');
    if (!firstItem) {
      throw new Error('No inventory items found');
    }
    
    // Get item ID and current stock
    const itemId = await firstItem.evaluate(el => el.getAttribute('data-item-id'));
    const currentStockElement = await firstItem.$('[data-testid="current-stock"]');
    const initialStock = await currentStockElement.evaluate(el => parseInt(el.textContent));
    
    console.log(`📦 Testing with item ID: ${itemId}, Initial stock: ${initialStock}`);
    
    // Test 1: Add Stock
    console.log('\n🔄 TEST 1: Adding stock...');
    
    // Navigate to add stock page
    await page.goto(`http://localhost:3000/inventory/adjust/${itemId}/add`, { waitUntil: 'networkidle0' });
    
    // Wait for form to load
    await page.waitForSelector('input[name="quantity"]', { timeout: 5000 });
    
    // Fill in quantity to add
    const addQuantity = 10;
    await page.type('input[name="quantity"]', addQuantity.toString());
    await page.type('textarea[name="notes"]', 'Test add stock operation');
    
    // Take screenshot before adding
    await page.screenshot({ path: 'test-add-stock-before.png', fullPage: true });
    
    // Click add stock button
    const addButton = await page.$('button.flex-1');
    if (!addButton) {
      throw new Error('Add stock button not found');
    }
    
    await addButton.click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Take screenshot after adding
    await page.screenshot({ path: 'test-add-stock-after.png', fullPage: true });
    
    // Navigate back to inventory list to verify stock change
    await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle0' });
    await page.waitForSelector(`[data-item-id="${itemId}"]`, { timeout: 5000 });
    
    const updatedItem = await page.$(`[data-item-id="${itemId}"]`);
    const updatedStockElement = await updatedItem.$('[data-testid="current-stock"]');
    const stockAfterAdd = await updatedStockElement.evaluate(el => parseInt(el.textContent));
    
    console.log(`📊 Stock after adding ${addQuantity}: ${stockAfterAdd} (expected: ${initialStock + addQuantity})`);
    
    if (stockAfterAdd === initialStock + addQuantity) {
      console.log('✅ ADD STOCK TEST PASSED');
    } else {
      console.log('❌ ADD STOCK TEST FAILED');
    }
    
    // Test 2: Remove Stock
    console.log('\n🔄 TEST 2: Removing stock...');
    
    // Navigate to remove stock page
    await page.goto(`http://localhost:3000/inventory/adjust/${itemId}/remove`, { waitUntil: 'networkidle0' });
    
    // Wait for form to load
    await page.waitForSelector('input[name="quantity"]', { timeout: 5000 });
    
    // Fill in quantity to remove
    const removeQuantity = 5;
    await page.type('input[name="quantity"]', removeQuantity.toString());
    await page.type('textarea[name="notes"]', 'Test remove stock operation');
    
    // Take screenshot before removing
    await page.screenshot({ path: 'test-remove-stock-before.png', fullPage: true });
    
    // Click remove stock button
    const removeButton = await page.$('button.flex-1');
    if (!removeButton) {
      throw new Error('Remove stock button not found');
    }
    
    await removeButton.click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Take screenshot after removing
    await page.screenshot({ path: 'test-remove-stock-after.png', fullPage: true });
    
    // Navigate back to inventory list to verify stock change
    await page.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle0' });
    await page.waitForSelector(`[data-item-id="${itemId}"]`, { timeout: 5000 });
    
    const finalItem = await page.$(`[data-item-id="${itemId}"]`);
    const finalStockElement = await finalItem.$('[data-testid="current-stock"]');
    const finalStock = await finalStockElement.evaluate(el => parseInt(el.textContent));
    
    const expectedFinalStock = stockAfterAdd - removeQuantity;
    console.log(`📊 Final stock after removing ${removeQuantity}: ${finalStock} (expected: ${expectedFinalStock})`);
    
    if (finalStock === expectedFinalStock) {
      console.log('✅ REMOVE STOCK TEST PASSED');
    } else {
      console.log('❌ REMOVE STOCK TEST FAILED');
    }
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log(`Initial stock: ${initialStock}`);
    console.log(`After adding ${addQuantity}: ${stockAfterAdd} ${stockAfterAdd === initialStock + addQuantity ? '✅' : '❌'}`);
    console.log(`After removing ${removeQuantity}: ${finalStock} ${finalStock === expectedFinalStock ? '✅' : '❌'}`);
    
    console.log('\n📡 API Calls Made:');
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url}`);
      if (call.postData) {
        console.log(`   Data: ${call.postData}`);
      }
    });
    
    console.log('\n🎉 Stock adjustment test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testStockAdjustment().catch(console.error);
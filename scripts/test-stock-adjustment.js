#!/usr/bin/env node

/**
 * Simple test for stock adjustment functionality
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TEST_INVENTORY_ID = '08db24a5-fd16-4f84-82b8-ef085939f100';

async function testStockAdjustment() {
  console.log('🧪 Testing Stock Adjustment Functionality...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: ['--window-size=1200,800']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/add-stock') || request.url().includes('/remove-stock')) {
        console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/add-stock') || response.url().includes('/remove-stock')) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // Test Add Stock
    console.log('1️⃣ Testing Add Stock...');
    const addUrl = `${BASE_URL}/inventory/adjust/${TEST_INVENTORY_ID}/add`;
    await page.goto(addUrl, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill quantity
    const quantityInput = await page.$('#quantity');
    if (quantityInput) {
      await quantityInput.click();
      await quantityInput.evaluate(el => el.value = '');
      await quantityInput.type('5');
      console.log('✅ Quantity input filled with 5');
    } else {
      console.log('❌ Quantity input not found');
      return;
    }
    
    // Find and click Add Stock button (it's in a fixed bottom container with flex-1 class)
    const addButton = await page.$('button.flex-1') ||
                     await page.evaluateHandle(() => {
                       const buttons = Array.from(document.querySelectorAll('button'));
                       return buttons.find(btn => btn.textContent.includes('Add') && btn.textContent.includes('Units'));
                     });
    if (addButton && addButton.asElement) {
      console.log('🖱️ Clicking Add Stock button...');
      await addButton.asElement().click();
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Add Stock button clicked');
    } else {
      console.log('❌ Add Stock button not found');
      // Debug: List all buttons
      const allButtons = await page.$$eval('button', buttons =>
        buttons.map(btn => ({ text: btn.textContent, classes: btn.className }))
      );
      console.log('🔍 Available buttons:', allButtons);
    }
    
    // Test Remove Stock
    console.log('\n2️⃣ Testing Remove Stock...');
    const removeUrl = `${BASE_URL}/inventory/adjust/${TEST_INVENTORY_ID}/remove`;
    await page.goto(removeUrl, { waitUntil: 'networkidle0' });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill quantity for removal
    const removeQuantityInput = await page.$('#quantity');
    if (removeQuantityInput) {
      await removeQuantityInput.click();
      await removeQuantityInput.evaluate(el => el.value = '');
      await removeQuantityInput.type('2');
      console.log('✅ Remove quantity input filled with 2');
    } else {
      console.log('❌ Remove quantity input not found');
      return;
    }
    
    // Find and click Remove Stock button (it's in a fixed bottom container with flex-1 class)
    const removeButton = await page.$('button.flex-1') ||
                         await page.evaluateHandle(() => {
                           const buttons = Array.from(document.querySelectorAll('button'));
                           return buttons.find(btn => btn.textContent.includes('Remove') && btn.textContent.includes('Units'));
                         });
    if (removeButton && removeButton.asElement) {
      console.log('🖱️ Clicking Remove Stock button...');
      await removeButton.asElement().click();
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Remove Stock button clicked');
    } else {
      console.log('❌ Remove Stock button not found');
      // Debug: List all buttons
      const allButtons = await page.$$eval('button', buttons =>
        buttons.map(btn => ({ text: btn.textContent, classes: btn.className }))
      );
      console.log('🔍 Available buttons:', allButtons);
    }
    
    console.log('\n✅ Stock Adjustment Test Completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testStockAdjustment().catch(console.error);
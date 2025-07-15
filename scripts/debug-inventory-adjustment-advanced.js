#!/usr/bin/env node

/**
 * Advanced Debug Script for Inventory Adjustment Issues
 * Tests both frontend and backend functionality with detailed logging
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TEST_INVENTORY_ID = '08db24a5-fd16-4f84-82b8-ef085939f100';

async function runAdvancedDebugTest() {
  console.log('🔍 Starting Advanced Debug Test for Inventory Adjustment...\n');
  
  let browser;
  try {
    // Launch browser with debug options
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      devtools: true,  // Open DevTools
      slowMo: 500,     // Slow down actions
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=360,640' // Mobile viewport
      ]
    });

    const page = await browser.newPage();
    
    // Set mobile viewport
    await page.setViewport({ width: 360, height: 640 });
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (text.includes('🔍')) {
        console.log(`📱 BROWSER: ${text}`);
      }
    });

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/inventory/')) {
        console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/inventory/')) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // Test Add Stock Page
    console.log('1️⃣ Testing Add Stock Page...');
    const addUrl = `${BASE_URL}/inventory/adjust/${TEST_INVENTORY_ID}/add`;
    await page.goto(addUrl, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000))(2000);
    
    // Check if debug overlay is available
    console.log('🔧 Activating debug overlay...');
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('KeyD');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    
    await new Promise(resolve => setTimeout(resolve, 2000))(1000);
    
    // Check for buttons
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
        disabled: btn.disabled,
        className: btn.className,
        position: {
          top: btn.getBoundingClientRect().top,
          bottom: btn.getBoundingClientRect().bottom,
          left: btn.getBoundingClientRect().left,
          right: btn.getBoundingClientRect().right
        }
      }))
    );
    
    console.log('🔘 Button Analysis:');
    buttons.forEach((btn, index) => {
      console.log(`   ${index + 1}. "${btn.text}" - Visible: ${btn.visible}, Disabled: ${btn.disabled}`);
      console.log(`      Position: top=${btn.position.top}, bottom=${btn.position.bottom}`);
      console.log(`      Viewport height: 640, Button in viewport: ${btn.position.bottom <= 640}`);
    });
    
    // Check fixed elements
    const fixedElements = await page.$$eval('[class*="fixed"]', elements =>
      elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        position: {
          top: el.getBoundingClientRect().top,
          bottom: el.getBoundingClientRect().bottom,
          left: el.getBoundingClientRect().left,
          right: el.getBoundingClientRect().right
        }
      }))
    );
    
    console.log('📌 Fixed Elements:');
    fixedElements.forEach((el, index) => {
      console.log(`   ${index + 1}. ${el.tagName} - ${el.className}`);
      console.log(`      Position: top=${el.position.top}, bottom=${el.position.bottom}`);
    });
    
    // Try to fill form and click button
    console.log('📝 Testing form interaction...');
    
    // Fill quantity
    const quantityInput = await page.$('#quantity');
    if (quantityInput) {
      await quantityInput.click();
      await quantityInput.type('5');
      console.log('✅ Quantity input filled');
    } else {
      console.log('❌ Quantity input not found');
    }
    
    // Try to find and click the Add Stock button
    const addButton = await page.$('button:has-text("Add 5 Units")') || 
                     await page.$('button[class*="flex-1"]:not([variant="outline"])');
    
    if (addButton) {
      const buttonRect = await addButton.boundingBox();
      console.log(`🎯 Add button found at: ${JSON.stringify(buttonRect)}`);
      
      // Check if button is in viewport
      const isInViewport = buttonRect && buttonRect.y + buttonRect.height <= 640;
      console.log(`📱 Button in viewport: ${isInViewport}`);
      
      if (isInViewport) {
        console.log('🖱️ Attempting to click Add button...');
        await addButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000))(2000);
        console.log('✅ Add button clicked');
      } else {
        console.log('❌ Add button not in viewport - trying to scroll');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 2000))(1000);
        
        const newButtonRect = await addButton.boundingBox();
        console.log(`🎯 Add button after scroll: ${JSON.stringify(newButtonRect)}`);
        
        await addButton.click();
        console.log('✅ Add button clicked after scroll');
      }
    } else {
      console.log('❌ Add Stock button not found');
    }
    
    // Take screenshot for analysis
    await page.screenshot({ 
      path: 'debug-add-stock-mobile.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: debug-add-stock-mobile.png');
    
    // Test Remove Stock Page
    console.log('\n2️⃣ Testing Remove Stock Page...');
    const removeUrl = `${BASE_URL}/inventory/adjust/${TEST_INVENTORY_ID}/remove`;
    await page.goto(removeUrl, { waitUntil: 'networkidle0' });
    
    await new Promise(resolve => setTimeout(resolve, 2000))(2000);
    
    // Activate debug overlay
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('KeyD');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    
    await new Promise(resolve => setTimeout(resolve, 2000))(1000);
    
    // Similar analysis for remove page
    const removeButtons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
        disabled: btn.disabled,
        position: {
          top: btn.getBoundingClientRect().top,
          bottom: btn.getBoundingClientRect().bottom
        }
      }))
    );
    
    console.log('🔘 Remove Page Button Analysis:');
    removeButtons.forEach((btn, index) => {
      console.log(`   ${index + 1}. "${btn.text}" - Visible: ${btn.visible}, In viewport: ${btn.position.bottom <= 640}`);
    });
    
    await page.screenshot({ 
      path: 'debug-remove-stock-mobile.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: debug-remove-stock-mobile.png');
    
    console.log('\n✅ Advanced Debug Test Completed');
    console.log('📋 Check the screenshots and console output for detailed analysis');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runAdvancedDebugTest().catch(console.error);
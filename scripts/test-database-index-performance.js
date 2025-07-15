/**
 * Phase 3 Database Index Performance Testing Script
 * Measures query performance before and after index application
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Performance test queries using Supabase client
const testQueries = [
  {
    name: 'Inventory Items - Basic Active Filter',
    queryFunction: async () => {
      return await supabase
        .from('inventory_items')
        .select('id, name, sku, current_stock, category_id, location_id')
        .eq('is_active', true)
        .order('name')
        .limit(50);
    },
    expectedIndex: 'idx_inventory_items_active_name'
  },
  {
    name: 'Inventory Items - Category Filter',
    queryFunction: async () => {
      return await supabase
        .from('inventory_items')
        .select('id, name, sku, current_stock, category_id')
        .eq('is_active', true)
        .not('category_id', 'is', null)
        .order('name')
        .limit(50);
    },
    expectedIndex: 'idx_inventory_items_active_category'
  },
  {
    name: 'Inventory Items - Low Stock Query',
    queryFunction: async () => {
      return await supabase
        .from('inventory_items')
        .select('id, name, current_stock, min_stock_level')
        .eq('is_active', true)
        .filter('current_stock', 'lte', 'min_stock_level')
        .order('name');
    },
    expectedIndex: 'idx_inventory_items_low_stock'
  },
  {
    name: 'Inventory Items - Text Search',
    queryFunction: async () => {
      return await supabase
        .from('inventory_items')
        .select('id, name, sku, description')
        .eq('is_active', true)
        .ilike('name', '%test%')
        .order('name')
        .limit(50);
    },
    expectedIndex: 'idx_inventory_items_name_text'
  },
  {
    name: 'Categories - Name Search',
    queryFunction: async () => {
      return await supabase
        .from('categories')
        .select('id, name, description')
        .ilike('name', '%general%')
        .order('name');
    },
    expectedIndex: 'idx_categories_name'
  },
  {
    name: 'Categories - Full Text Search',
    queryFunction: async () => {
      return await supabase
        .from('categories')
        .select('id, name, description')
        .or('name.ilike.%elec%,description.ilike.%elec%')
        .order('name');
    },
    expectedIndex: 'idx_categories_text_search'
  },
  {
    name: 'Locations - Active Filter',
    queryFunction: async () => {
      return await supabase
        .from('locations')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
    },
    expectedIndex: 'idx_locations_active_name'
  },
  {
    name: 'Users - Email Lookup',
    queryFunction: async () => {
      return await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', 'alesierraalta@gmail.com');
    },
    expectedIndex: 'idx_users_email'
  },
  {
    name: 'Complex JOIN Query',
    queryFunction: async () => {
      return await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          current_stock,
          categories(name),
          locations(name),
          users(name)
        `)
        .eq('is_active', true)
        .order('name')
        .limit(50);
    },
    expectedIndex: 'Multiple indexes should be used'
  }
];

async function measureQueryPerformance(queryFunction, iterations = 5) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await queryFunction();
      
      if (error) {
        console.error(`❌ Query error:`, error.message);
        return null;
      }
      
      const endTime = Date.now();
      times.push(endTime - startTime);
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.error(`❌ Query exception:`, err.message);
      return null;
    }
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times
  };
}

async function analyzeQueryPlan(queryName) {
  // Note: Query plan analysis is not available with Supabase client methods
  // This would require raw SQL access which we're avoiding due to authentication issues
  console.log(`   📊 Query plan analysis skipped for: ${queryName}`);
  return {
    note: 'Query plan analysis not available with Supabase client methods',
    recommendation: 'Use database management tools for detailed query analysis'
  };
}

async function runPerformanceTests() {
  console.log('🚀 Starting Database Index Performance Tests...\n');
  
  const results = [];
  
  for (let i = 0; i < testQueries.length; i++) {
    const test = testQueries[i];
    console.log(`⏳ Testing ${i + 1}/${testQueries.length}: ${test.name}`);
    
    // Measure performance
    const performance = await measureQueryPerformance(test.queryFunction);
    
    if (performance) {
      console.log(`   ⚡ Average: ${performance.average.toFixed(2)}ms`);
      console.log(`   📊 Range: ${performance.min}ms - ${performance.max}ms`);
      
      // Analyze query plan
      const plan = await analyzeQueryPlan(test.name);
      
      results.push({
        name: test.name,
        expectedIndex: test.expectedIndex,
        performance,
        plan: plan || null
      });
      
    } else {
      console.log(`   ❌ Performance test failed`);
      results.push({
        name: test.name,
        expectedIndex: test.expectedIndex,
        performance: null,
        plan: null
      });
    }
    
    console.log(''); // Empty line for readability
  }
  
  return results;
}

async function checkIndexUsage() {
  console.log('🔍 Checking Index Usage Statistics...\n');
  
  // Note: Index usage statistics require raw SQL access to system tables
  // This would require PostgreSQL system table access which is not available through Supabase client methods
  console.log('📊 Index Usage Statistics:');
  console.log('   ℹ️  Index usage statistics not available with Supabase client methods');
  console.log('   💡 Recommendation: Use database management tools or Supabase dashboard for index analysis');
  console.log('   📈 Performance improvements will be measured through query response times\n');
  
  return {
    note: 'Index usage statistics not available with Supabase client methods',
    recommendation: 'Use database management tools for detailed index analysis',
    alternative: 'Performance improvements measured through query response times'
  };
}

async function generatePerformanceReport(results) {
  console.log('\n📋 Performance Test Report\n');
  console.log('='.repeat(80));
  
  const successfulTests = results.filter(r => r.performance !== null);
  const failedTests = results.filter(r => r.performance === null);
  
  console.log(`✅ Successful Tests: ${successfulTests.length}`);
  console.log(`❌ Failed Tests: ${failedTests.length}`);
  console.log(`📈 Success Rate: ${((successfulTests.length / results.length) * 100).toFixed(1)}%\n`);
  
  if (successfulTests.length > 0) {
    console.log('⚡ Performance Summary:');
    console.log('-'.repeat(80));
    
    successfulTests.forEach(test => {
      const grade = test.performance.average < 50 ? 'A' : 
                   test.performance.average < 100 ? 'B' : 
                   test.performance.average < 200 ? 'C' : 'D';
      
      console.log(`${test.name}:`);
      console.log(`  Average: ${test.performance.average.toFixed(2)}ms (Grade: ${grade})`);
      console.log(`  Range: ${test.performance.min}ms - ${test.performance.max}ms`);
      console.log(`  Expected Index: ${test.expectedIndex}`);
      console.log('');
    });
    
    const overallAverage = successfulTests.reduce((sum, test) => sum + test.performance.average, 0) / successfulTests.length;
    const overallGrade = overallAverage < 50 ? 'A (Excellent)' : 
                        overallAverage < 100 ? 'B (Good)' : 
                        overallAverage < 200 ? 'C (Fair)' : 'D (Poor)';
    
    console.log(`🎯 Overall Performance: ${overallAverage.toFixed(2)}ms - Grade: ${overallGrade}`);
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    console.log('-'.repeat(80));
    failedTests.forEach(test => {
      console.log(`- ${test.name}`);
    });
  }
}

async function main() {
  try {
    console.log('🎯 Phase 3 Database Index Performance Testing\n');
    
    // Run performance tests
    const results = await runPerformanceTests();
    
    // Check index usage
    await checkIndexUsage();
    
    // Generate report
    await generatePerformanceReport(results);
    
    console.log('\n🏁 Performance testing completed!');
    console.log('📊 Results can be used to compare before/after index application');
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests, checkIndexUsage, generatePerformanceReport };
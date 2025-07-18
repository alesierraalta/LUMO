#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST EXECUTION SCRIPT
 * 
 * Main entry point for executing the complete testing system.
 * Prevents issues like DELETE functionality failures through systematic testing.
 * 
 * Usage:
 *   node tests/run-comprehensive-tests.js
 *   node tests/run-comprehensive-tests.js --suite=crud
 *   node tests/run-comprehensive-tests.js --environment=production
 */

const MasterTestOrchestrator = require('./master-test-orchestrator');
const { TEST_CONFIG } = require('./config/test-config');

class ComprehensiveTestRunner {
  constructor() {
    this.orchestrator = new MasterTestOrchestrator();
    this.options = this.parseCommandLineArgs();
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🚀 COMPREHENSIVE TESTING SYSTEM');
    console.log('═══════════════════════════════════════');
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log(`🌐 Environment: ${TEST_CONFIG.ENVIRONMENT.BASE_URL}`);
    console.log(`🔧 Configuration: ${this.options.environment || 'default'}`);
    console.log('');

    try {
      // Display pre-execution summary
      this.displayPreExecutionSummary();
      
      // Execute comprehensive tests
      const results = await this.orchestrator.runComprehensiveTests(this.options);
      
      // Display final results
      this.displayFinalResults(results);
      
      // Exit with appropriate code
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  parseCommandLineArgs() {
    const args = process.argv.slice(2);
    const options = {
      suite: null,
      environment: null,
      verbose: false,
      skipCleanup: false
    };

    for (const arg of args) {
      if (arg.startsWith('--suite=')) {
        options.suite = arg.split('=')[1];
      } else if (arg.startsWith('--environment=')) {
        options.environment = arg.split('=')[1];
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--skip-cleanup') {
        options.skipCleanup = true;
      } else if (arg === '--help' || arg === '-h') {
        this.displayHelp();
        process.exit(0);
      }
    }

    return options;
  }

  /**
   * Display help information
   */
  displayHelp() {
    console.log(`
🧪 COMPREHENSIVE TESTING SYSTEM - HELP

USAGE:
  node tests/run-comprehensive-tests.js [OPTIONS]

OPTIONS:
  --suite=<name>        Run specific test suite only
                        Options: crud, auth, api, database
  
  --environment=<env>   Target environment
                        Options: development, staging, production
  
  --verbose, -v         Enable verbose logging
  
  --skip-cleanup        Skip post-test cleanup (for debugging)
  
  --help, -h           Show this help message

EXAMPLES:
  # Run all tests
  node tests/run-comprehensive-tests.js
  
  # Run only CRUD tests
  node tests/run-comprehensive-tests.js --suite=crud
  
  # Run tests against production
  node tests/run-comprehensive-tests.js --environment=production
  
  # Verbose mode with no cleanup
  node tests/run-comprehensive-tests.js --verbose --skip-cleanup

SAFETY FEATURES:
  ✅ Only deletes data with TEST_ or DEBUG_ prefixes
  ✅ Production data protection through validation
  ✅ Comprehensive cleanup procedures
  ✅ Detailed error reporting and logging
  ✅ Emergency cleanup on failures

FOCUS AREAS:
  🎯 DELETE functionality testing (prevents main issue)
  🎯 Authentication and authorization validation
  🎯 API endpoint comprehensive coverage
  🎯 Database integrity and constraint testing
  🎯 Performance and security testing
`);
  }

  /**
   * Display pre-execution summary
   */
  displayPreExecutionSummary() {
    console.log('📋 TEST EXECUTION PLAN');
    console.log('─────────────────────────────────────');
    
    const enabledSuites = Object.entries(TEST_CONFIG.SCENARIOS)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
    
    console.log(`🧪 Test Suites: ${enabledSuites.join(', ')}`);
    console.log(`🔒 Safe Prefixes: ${Object.values(TEST_CONFIG.SAFE_PREFIXES).join(', ')}`);
    console.log(`📊 Test Limits: ${TEST_CONFIG.LIMITS.MAX_TEST_ITEMS} items per entity`);
    console.log(`⏱️  Timeout: ${TEST_CONFIG.ENVIRONMENT.TIMEOUT}ms`);
    
    if (this.options.suite) {
      console.log(`🎯 Running specific suite: ${this.options.suite}`);
    }
    
    if (this.options.skipCleanup) {
      console.log('⚠️  Cleanup will be skipped (debugging mode)');
    }
    
    console.log('');
    console.log('🛡️  SAFETY MEASURES ACTIVE:');
    console.log('   ✅ Production data protection');
    console.log('   ✅ Test data prefix validation');
    console.log('   ✅ Automated cleanup procedures');
    console.log('   ✅ Emergency rollback capabilities');
    console.log('');
  }

  /**
   * Display final results
   */
  displayFinalResults(results) {
    console.log('\n🏁 FINAL TEST RESULTS');
    console.log('═══════════════════════════════════════');
    
    const duration = results.duration ? (results.duration / 1000).toFixed(2) : 'N/A';
    const successRate = results.totalTests > 0 
      ? (results.passed / results.totalTests * 100).toFixed(2)
      : 0;
    
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Total Tests: ${results.totalTests}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log('');
    
    // Display suite-specific results
    if (results.suites && Object.keys(results.suites).length > 0) {
      console.log('📋 SUITE BREAKDOWN:');
      for (const [suiteName, suiteResults] of Object.entries(results.suites)) {
        const suiteRate = suiteResults.total > 0 
          ? (suiteResults.passed / suiteResults.total * 100).toFixed(1)
          : 0;
        console.log(`   ${suiteName}: ${suiteResults.passed}/${suiteResults.total} (${suiteRate}%)`);
      }
      console.log('');
    }
    
    // Display cleanup results
    if (results.cleanup) {
      console.log('🧹 CLEANUP SUMMARY:');
      console.log(`   Deleted: ${results.cleanup.totalDeleted} items`);
      console.log(`   Errors: ${results.cleanup.totalErrors}`);
      console.log(`   Skipped: ${results.cleanup.totalSkipped}`);
      console.log('');
    }
    
    // Display errors if any
    if (results.errors && results.errors.length > 0) {
      console.log('⚠️  ERRORS ENCOUNTERED:');
      results.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.error} (${error.timestamp})`);
      });
      
      if (results.errors.length > 5) {
        console.log(`   ... and ${results.errors.length - 5} more errors`);
      }
      console.log('');
    }
    
    // Display performance summary if available
    if (results.suites && results.suites['API Endpoints'] && results.suites['API Endpoints'].performance) {
      const perfData = results.suites['API Endpoints'].performance;
      const avgResponseTime = perfData.reduce((sum, p) => sum + p.responseTime, 0) / perfData.length;
      
      console.log('⚡ PERFORMANCE SUMMARY:');
      console.log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Fastest: ${Math.min(...perfData.map(p => p.responseTime))}ms`);
      console.log(`   Slowest: ${Math.max(...perfData.map(p => p.responseTime))}ms`);
      console.log('');
    }
    
    // Final status
    if (results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! System is ready for production.');
      console.log('✅ DELETE functionality and all other features validated.');
    } else {
      console.log('❌ SOME TESTS FAILED! Review errors before deployment.');
      console.log('🔍 Check detailed report for specific issues.');
    }
    
    console.log(`📄 Detailed report: tests/reports/test-report-${results.sessionId}.json`);
    console.log('═══════════════════════════════════════');
  }
}

// Execute if run directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;
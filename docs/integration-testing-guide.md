# 🧪 Integration Testing Guide

## Overview

This guide provides comprehensive documentation for running and understanding the integration test suite for the inventory management application. The tests are designed to validate functionality across both development and production environments, ensuring the application works correctly when deployed to Vercel.

## Table of Contents

1. [Test Architecture](#test-architecture)
2. [Environment Setup](#environment-setup)
3. [Running Tests Locally](#running-tests-locally)
4. [Test Suites](#test-suites)
5. [CI/CD Integration](#cicd-integration)
6. [Performance Benchmarking](#performance-benchmarking)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Test Architecture

### Directory Structure

```
src/__tests__/
├── integration/
│   ├── vercel-production-validation.test.ts  # Production validation suite
│   ├── environment-sync-validation.test.ts   # Cross-environment sync tests
│   ├── performance-benchmarking.test.ts      # Performance benchmarks
│   ├── auth-api.test.ts                      # Authentication tests
│   ├── categories-comprehensive.test.ts      # Category management tests
│   ├── inventory-*.test.ts                   # Inventory tests
│   └── users-*.test.ts                       # User management tests
└── setup/
    ├── test-utilities.ts                      # Test helper functions
    └── jest-global-setup.js                  # Jest configuration
```

### Key Components

1. **Test Utilities**: Provides mock implementations and helper functions
2. **Environment Configuration**: Supports testing against development and production
3. **Performance Metrics**: Tracks and reports performance benchmarks
4. **CI/CD Integration**: Automated testing via GitHub Actions

## Environment Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Access to Supabase projects (development and production)
- Environment variables configured

### Environment Variables

Create a `.env.local` file for development testing:

```env
# Development Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
DATABASE_URL=your-dev-database-url

# Production URLs (for cross-environment tests)
PROD_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
PROD_SUPABASE_ANON_KEY=your-prod-anon-key
PROD_APP_URL=https://lumo-woad.vercel.app
```

For production testing, create `.env.production`:

```env
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
# Add other production variables
```

## Running Tests Locally

### Using the Test Runner Script

The easiest way to run tests is using the provided script:

```bash
# Run all tests in development environment
node scripts/run-integration-tests.js

# Run specific test suite
node scripts/run-integration-tests.js --suite auth

# Run tests against production (⚠️ Use with caution!)
node scripts/run-integration-tests.js --env production --suite production

# Run with coverage
node scripts/run-integration-tests.js --coverage

# Watch mode for development
node scripts/run-integration-tests.js --suite categories --watch
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--env, -e` | Environment to test (development/production) | development |
| `--suite, -s` | Test suite to run (see below) | all |
| `--verbose, -v` | Show detailed output | false |
| `--coverage, -c` | Generate code coverage report | false |
| `--watch, -w` | Watch mode for development | false |
| `--bail, -b` | Stop on first test failure | false |

### Using npm Scripts

```bash
# Run all integration tests
npm run test:integration

# Run specific test pattern
npm run test:integration -- --testPathPattern="auth"

# Run with coverage
npm run test:integration -- --coverage

# Run in CI mode
npm run test:integration -- --ci
```

## Test Suites

### 1. Authentication Tests (`auth`)

Tests authentication flows including login, registration, token validation, and role-based access.

```bash
node scripts/run-integration-tests.js --suite auth
```

**Key scenarios:**
- User registration and login
- Token generation and validation
- Password reset flows
- Role-based permissions
- Session management

### 2. Category Management (`categories`)

Tests CRUD operations for categories and related constraints.

```bash
node scripts/run-integration-tests.js --suite categories
```

**Key scenarios:**
- Create, read, update, delete categories
- Pagination and filtering
- Search functionality
- Referential integrity constraints
- Concurrent operations

### 3. Inventory Management (`inventory`)

Tests inventory operations and stock management.

```bash
node scripts/run-integration-tests.js --suite inventory
```

**Key scenarios:**
- Item CRUD operations
- Stock adjustments
- Low stock alerts
- Category associations
- Bulk operations

### 4. User Management (`users`)

Tests user administration and role management.

```bash
node scripts/run-integration-tests.js --suite users
```

**Key scenarios:**
- User CRUD operations
- Role assignments
- Permission validation
- Profile updates
- Account deactivation

### 5. Production Validation (`production`)

Comprehensive tests specifically for the production environment.

```bash
node scripts/run-integration-tests.js --env production --suite production
```

**Key scenarios:**
- Health checks
- API endpoint validation
- Performance metrics
- Security headers
- Rate limiting
- CORS configuration

### 6. Environment Synchronization (`sync`)

Tests data consistency between development and production.

```bash
node scripts/run-integration-tests.js --suite sync
```

**Key scenarios:**
- Cross-environment data validation
- Schema consistency
- API response comparison
- Error handling consistency

### 7. Performance Benchmarking (`performance`)

Establishes performance baselines for critical operations.

```bash
node scripts/run-integration-tests.js --suite performance --verbose
```

**Key metrics:**
- Response time percentiles (P50, P95, P99)
- Throughput measurements
- Concurrent operation handling
- Resource utilization
- Load pattern simulations

## CI/CD Integration

### GitHub Actions Workflow

The project includes a comprehensive GitHub Actions workflow that:

1. **Runs on:**
   - Push to main/develop branches
   - Pull requests
   - Daily schedule (2 AM UTC)
   - Manual trigger

2. **Features:**
   - Parallel test execution
   - Coverage reporting to Codecov
   - Artifact uploads
   - Slack notifications on failure
   - Performance benchmark comments on PRs

### Manual Workflow Trigger

```yaml
# Trigger via GitHub UI with custom parameters
workflow_dispatch:
  inputs:
    environment:
      description: 'Environment to test'
      options: [development, production]
    test_suite:
      description: 'Test suite to run'
      options: [all, auth, categories, inventory, users, performance]
```

### Required Secrets

Configure these secrets in your GitHub repository:

```
# Development environment
DEV_SUPABASE_URL
DEV_SUPABASE_ANON_KEY
DEV_SUPABASE_SERVICE_KEY
DEV_DATABASE_URL

# Production environment
PROD_SUPABASE_URL
PROD_SUPABASE_ANON_KEY
PROD_APP_URL

# Optional
SLACK_WEBHOOK (for notifications)
```

## Performance Benchmarking

### Running Benchmarks

```bash
# Run full benchmark suite
node scripts/run-integration-tests.js --suite performance --verbose

# Results are saved to ./benchmark-results/
```

### Understanding Results

Benchmark results include:

```json
{
  "operation": "User Login",
  "metrics": {
    "min": 120,      // Minimum response time
    "max": 450,      // Maximum response time
    "avg": 235.5,    // Average response time
    "p50": 220,      // 50th percentile (median)
    "p95": 380,      // 95th percentile
    "p99": 445,      // 99th percentile
    "samples": 50    // Number of iterations
  },
  "threshold": 500,  // Performance threshold
  "passed": true     // Pass/fail status
}
```

### Performance Thresholds

Default thresholds (in milliseconds):

| Operation | Threshold | Description |
|-----------|-----------|-------------|
| Login | 500ms | User authentication |
| Simple GET | 300ms | Basic data retrieval |
| Complex Query | 800ms | Filtered/paginated queries |
| Create | 600ms | Resource creation |
| Update | 500ms | Resource modification |
| Delete | 400ms | Resource deletion |
| Bulk Operation | 2000ms | Multiple concurrent operations |

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

```bash
Error: Login failed with status 401
```

**Solution:**
- Verify test user credentials exist in the target environment
- Check environment variables are correctly set
- Ensure Supabase service is accessible

#### 2. Timeout Errors

```bash
Error: Timeout of 30000ms exceeded
```

**Solution:**
- Increase Jest timeout in jest.config.integration.js
- Check network connectivity to Vercel/Supabase
- Verify API endpoints are responding

#### 3. Database Constraints

```bash
Error: Foreign key constraint violation
```

**Solution:**
- Ensure test data cleanup is working
- Check for orphaned records from previous test runs
- Run cleanup script: `node scripts/manage-test-data.js cleanup`

#### 4. Rate Limiting

```bash
Error: Too many requests (429)
```

**Solution:**
- Add delays between requests in tests
- Reduce concurrent operation count
- Contact service provider to increase limits

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment variable
DEBUG=test:* node scripts/run-integration-tests.js --verbose

# Enable Supabase client logging
SUPABASE_LOG_LEVEL=debug npm run test:integration
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up test data after execution
- Use unique identifiers for test data
- Don't rely on execution order

### 2. Environment Safety

- **Never** use production credentials in development
- Always confirm before running tests against production
- Use read-only operations when possible in production tests
- Implement safeguards for destructive operations

### 3. Performance Testing

- Run benchmarks during off-peak hours
- Establish baselines before optimization
- Monitor for performance regressions
- Document any threshold changes

### 4. CI/CD Integration

- Keep test execution time under 10 minutes
- Use parallel execution for faster feedback
- Archive test artifacts for debugging
- Set up notifications for failures

### 5. Test Data Management

```javascript
// Use consistent test data patterns
const TEST_PREFIX = `TEST_${Date.now()}_`;

// Always clean up
afterAll(async () => {
  await cleanupTestData(TEST_PREFIX);
});
```

### 6. Error Handling

```javascript
// Provide meaningful error messages
expect(response.status).toBe(200, 
  `Expected successful response but got ${response.status}: ${response.data}`
);

// Log additional context on failure
if (response.status !== 200) {
  console.error('Request details:', {
    url: endpoint,
    method: 'POST',
    body: requestBody,
    response: response.data
  });
}
```

## Monitoring and Alerts

### Test Result Monitoring

1. **GitHub Actions Dashboard**: Monitor test runs and success rates
2. **Codecov**: Track coverage trends over time
3. **Benchmark Results**: Compare performance across releases

### Setting Up Alerts

1. **Slack Integration**: Configure webhook for test failures
2. **Email Notifications**: GitHub Actions can send emails on failure
3. **Custom Webhooks**: Integrate with monitoring services

## Contributing

When adding new integration tests:

1. Follow the existing naming convention
2. Add appropriate test categories
3. Update this documentation
4. Include cleanup logic
5. Add performance thresholds if applicable
6. Test in both development and production modes

### Test Template

```typescript
describe('Feature: Your Feature Name', () => {
  let testData: any;
  
  beforeAll(async () => {
    // Setup test data
  });
  
  afterAll(async () => {
    // Cleanup test data
  });
  
  it('should perform expected behavior', async () => {
    // Arrange
    const input = prepareTestInput();
    
    // Act
    const result = await performAction(input);
    
    // Assert
    expect(result).toMatchExpectedOutput();
  });
});
```

## Appendix

### Useful Commands

```bash
# View latest benchmark results
cat benchmark-results/benchmark-*.json | jq '.results[] | select(.passed == false)'

# Clean all test data
node scripts/manage-test-data.js cleanup --all

# Run tests in Docker
docker run -v $(pwd):/app -w /app node:18 npm run test:integration

# Generate coverage report
npm run test:integration -- --coverage --coverageReporters=html
open coverage/lcov-report/index.html
```

### Related Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [GitHub Actions Reference](https://docs.github.com/en/actions)

---

For questions or issues, please create a GitHub issue or contact the development team.
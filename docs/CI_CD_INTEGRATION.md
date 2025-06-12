# 🚀 CI/CD Integration Guide

## Overview

This guide covers integrating LUMO's comprehensive testing suite into Continuous Integration and Continuous Deployment pipelines. Our testing infrastructure supports multiple CI/CD platforms and deployment strategies.

## 🏗️ CI/CD Architecture

### Testing Pipeline Stages

```
Code Push → Install Dependencies → Lint & Format → Unit Tests → Integration Tests → Build Application → E2E Tests → Performance Tests → Security Scan → Deploy to Staging → Smoke Tests → Deploy to Production
```

### Parallel Execution Strategy

```yaml
# Example GitHub Actions workflow
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, performance]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}
```

## 🔧 Platform-Specific Configurations

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Check Prettier formatting
        run: npm run format:check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage --watchAll=false
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: lumo_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          npx prisma migrate deploy
          npx prisma db seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/lumo_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/lumo_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        env:
          NODE_ENV: test
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results.json

  build-and-deploy:
    needs: [lint-and-format, unit-tests, integration-tests, e2e-tests, performance-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to staging
        run: npm run deploy:staging
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}
      
      - name: Deploy to production
        if: success()
        run: npm run deploy:production
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

## 🔐 Environment Configuration

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/lumo
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Testing
NODE_ENV=test
CI=true

# Deployment
DEPLOY_TOKEN=your-deploy-token
STAGING_URL=https://staging.lumo.app
PRODUCTION_URL=https://lumo.app
```

### Secrets Management

```yaml
# GitHub Actions Secrets
secrets:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
  DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

## 📊 Test Reporting and Monitoring

### Coverage Reporting

```javascript
// jest.config.js - Coverage configuration
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'cobertura' // For GitLab CI
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

### Performance Monitoring

```javascript
// performance-monitor.js
const fs = require('fs');

class PerformanceMonitor {
  constructor() {
    this.results = [];
  }

  recordTest(testName, duration, threshold) {
    const result = {
      testName,
      duration,
      threshold,
      passed: duration <= threshold,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    if (!result.passed) {
      console.warn(`⚠️ Performance test failed: ${testName} took ${duration}ms (threshold: ${threshold}ms)`);
    }
  }

  generateReport() {
    const report = {
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length
      },
      results: this.results
    };

    fs.writeFileSync('performance-results.json', JSON.stringify(report, null, 2));
    return report;
  }
}

module.exports = PerformanceMonitor;
```

## 🚀 Deployment Strategies

### Blue-Green Deployment

```yaml
deploy-blue-green:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to blue environment
      run: npm run deploy:blue
    
    - name: Run smoke tests on blue
      run: npm run test:smoke
      env:
        TARGET_URL: ${{ secrets.BLUE_URL }}
    
    - name: Switch traffic to blue
      if: success()
      run: npm run switch-traffic:blue
    
    - name: Cleanup green environment
      run: npm run cleanup:green
```

### Canary Deployment

```yaml
deploy-canary:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy canary (10% traffic)
      run: npm run deploy:canary --traffic=10
    
    - name: Monitor canary metrics
      run: npm run monitor:canary --duration=300
    
    - name: Increase traffic to 50%
      if: success()
      run: npm run deploy:canary --traffic=50
    
    - name: Full deployment
      if: success()
      run: npm run deploy:production
```

## 🔍 Quality Gates

### Pre-merge Checks

```yaml
quality-gate:
  runs-on: ubuntu-latest
  steps:
    - name: Check test coverage
      run: |
        COVERAGE=$(npm run test:unit -- --coverage --silent | grep "Lines" | awk '{print $3}' | sed 's/%//')
        if [ "$COVERAGE" -lt "80" ]; then
          echo "❌ Coverage $COVERAGE% is below 80% threshold"
          exit 1
        fi
        echo "✅ Coverage $COVERAGE% meets threshold"
    
    - name: Check performance benchmarks
      run: |
        npm run test:performance
        if [ $? -ne 0 ]; then
          echo "❌ Performance tests failed"
          exit 1
        fi
        echo "✅ Performance tests passed"
    
    - name: Security audit
      run: |
        npm audit --audit-level=high
        if [ $? -ne 0 ]; then
          echo "❌ Security vulnerabilities found"
          exit 1
        fi
        echo "✅ No high-severity vulnerabilities"
```

## 📈 Metrics and Analytics

### Test Execution Metrics

```javascript
// test-metrics.js
const metrics = {
  testExecution: {
    totalTests: 111,
    passRate: 100,
    executionTime: {
      unit: 1.3,
      integration: 1.0,
      e2e: 47.0,
      performance: 1.8,
      total: 51.1
    }
  },
  coverage: {
    statements: 85.2,
    branches: 78.9,
    functions: 82.1,
    lines: 84.7
  },
  performance: {
    apiResponseTime: 245,
    databaseQueryTime: 89,
    pageLoadTime: 1200
  }
};

// Send to monitoring service
fetch('https://monitoring.lumo.app/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(metrics)
});
```

## 🛠️ Troubleshooting CI/CD Issues

### Common Problems and Solutions

1. **Flaky E2E Tests**
   ```yaml
   - name: Retry E2E tests on failure
     run: npm run test:e2e || npm run test:e2e || npm run test:e2e
   ```

2. **Database Connection Issues**
   ```yaml
   - name: Wait for database
     run: |
       until pg_isready -h localhost -p 5432; do
         echo "Waiting for database..."
         sleep 2
       done
   ```

3. **Memory Issues**
   ```yaml
   - name: Increase Node.js memory
     run: NODE_OPTIONS="--max-old-space-size=4096" npm run test:all
   ```

4. **Timeout Issues**
   ```yaml
   - name: Set test timeouts
     run: npm run test:e2e -- --timeout=60000
   ```

## 📚 Best Practices

### 1. Fast Feedback Loop
- Run unit tests first (fastest)
- Parallel test execution
- Fail fast on critical issues

### 2. Environment Parity
- Use same Node.js version across environments
- Consistent dependency versions
- Environment-specific configurations

### 3. Test Data Management
- Isolated test databases
- Automated cleanup
- Seed data for consistent testing

### 4. Security
- Secure secret management
- Regular dependency updates
- Security scanning in pipeline

### 5. Monitoring
- Test execution metrics
- Performance benchmarks
- Error tracking and alerting

---

**Next**: [Troubleshooting Guide](./TROUBLESHOOTING.md) 
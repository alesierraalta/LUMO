# 🔧 Testing Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when running tests in the LUMO inventory management system. It covers all testing types and provides step-by-step debugging approaches.

## 🚨 Quick Diagnostics

### Health Check Commands

```bash
# Check test environment
npm run test:health

# Verify all dependencies
npm run test:deps

# Check database connectivity
npm run test:db-connection

# Validate configuration
npm run test:config
```

### Environment Verification

```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version

# Verify environment variables
echo $NODE_ENV
echo $DATABASE_URL
echo $SUPABASE_URL
```

## 🔬 Unit Test Issues

### Common Problems

#### 1. "Cannot find module" Errors

**Problem**: Module resolution failures in tests
```
Error: Cannot find module '@/components/ui/button'
```

**Solutions**:
```javascript
// Check jest.config.js moduleNameMapping
module.exports = {
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1'
  }
};
```

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. React Testing Library Act Warnings

**Problem**: 
```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**Solutions**:
```javascript
// ❌ Incorrect
fireEvent.click(button);
expect(screen.getByText('Updated')).toBeInTheDocument();

// ✅ Correct
await user.click(button);
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

#### 3. Mock Function Issues

**Problem**: Mocks not working correctly
```javascript
// ❌ Mock not reset between tests
const mockFn = jest.fn();

// ✅ Proper mock cleanup
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

#### 4. Async Test Failures

**Problem**: Tests failing due to async operations
```javascript
// ❌ Not waiting for async operations
test('async test', () => {
  fetchData();
  expect(screen.getByText('Data')).toBeInTheDocument();
});

// ✅ Proper async handling
test('async test', async () => {
  fetchData();
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});
```

### Debugging Steps

1. **Check Test Output**
   ```bash
   npm run test:unit -- --verbose
   ```

2. **Run Single Test**
   ```bash
   npm run test:unit -- --testNamePattern="specific test name"
   ```

3. **Debug Mode**
   ```bash
   npm run test:unit -- --detectOpenHandles --forceExit
   ```

## 🔗 Integration Test Issues

### Common Problems

#### 1. Database Connection Failures

**Problem**: Cannot connect to test database
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:
```bash
# Check database status
pg_isready -h localhost -p 5432

# Start local PostgreSQL
brew services start postgresql  # macOS
sudo service postgresql start   # Linux

# Check environment variables
echo $DATABASE_URL
```

#### 2. Schema Mismatch Errors

**Problem**: Prisma schema doesn't match database
```
Error: P1012: Schema validation error
```

**Solutions**:
```bash
# Reset database
npx prisma migrate reset --force

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

#### 3. Test Data Conflicts

**Problem**: Tests interfering with each other
```javascript
// ✅ Proper test isolation
beforeEach(async () => {
  await db.user.deleteMany();
  await db.role.deleteMany();
});

afterEach(async () => {
  await db.user.deleteMany();
  await db.role.deleteMany();
});
```

#### 4. Supabase Connection Issues

**Problem**: Supabase authentication failures
```javascript
// Check Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}
```

### Debugging Steps

1. **Check Database Connection**
   ```bash
   npm run test:integration -- --testNamePattern="database connection"
   ```

2. **Verify Schema**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

3. **Test Supabase Connection**
   ```bash
   npm run test:integration -- --testNamePattern="supabase"
   ```

## 🎭 E2E Test Issues

### Common Problems

#### 1. Browser Installation Failures

**Problem**: Playwright browsers not installed
```
Error: Executable doesn't exist at /path/to/browser
```

**Solutions**:
```bash
# Install browsers
npx playwright install

# Install with dependencies
npx playwright install --with-deps

# Install specific browser
npx playwright install chromium
```

#### 2. Application Not Starting

**Problem**: E2E tests can't connect to application
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solutions**:
```bash
# Check if app is running
curl http://localhost:3000

# Start application in background
npm run build
npm start &

# Wait for application
npx wait-on http://localhost:3000
```

#### 3. Element Not Found Errors

**Problem**: Playwright can't find elements
```javascript
// ❌ Element might not be loaded
await page.click('button');

// ✅ Wait for element
await page.waitForSelector('button');
await page.click('button');

// ✅ Use more specific selectors
await page.click('button[data-testid="submit-button"]');
```

#### 4. Authentication Issues

**Problem**: Tests failing due to authentication
```javascript
// Check auth setup
const authFile = 'src/__tests__/e2e/.auth/user.json';
if (!fs.existsSync(authFile)) {
  console.error('Auth file not found. Run auth setup.');
}
```

### Debugging Steps

1. **Run in Headed Mode**
   ```bash
   npm run test:e2e -- --headed
   ```

2. **Debug Mode**
   ```bash
   npm run test:e2e -- --debug
   ```

3. **Screenshot on Failure**
   ```javascript
   // playwright.config.ts
   use: {
     screenshot: 'only-on-failure',
     video: 'retain-on-failure'
   }
   ```

## ⚡ Performance Test Issues

### Common Problems

#### 1. Timeout Errors

**Problem**: Performance tests timing out
```javascript
// Increase timeout for slow operations
test('bulk operation performance', async () => {
  // Test implementation
}, 30000); // 30 second timeout
```

#### 2. Memory Issues

**Problem**: Tests running out of memory
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run test:performance
```

#### 3. Inconsistent Results

**Problem**: Performance results vary significantly
```javascript
// Run multiple iterations and average
const iterations = 5;
const results = [];

for (let i = 0; i < iterations; i++) {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  results.push(endTime - startTime);
}

const averageTime = results.reduce((a, b) => a + b) / results.length;
expect(averageTime).toBeLessThan(threshold);
```

### Debugging Steps

1. **Profile Performance**
   ```bash
   npm run test:performance -- --verbose
   ```

2. **Check System Resources**
   ```bash
   # Monitor CPU and memory
   top
   htop
   ```

## 🌐 Environment-Specific Issues

### Development Environment

#### Node.js Version Mismatch
```bash
# Check version
node --version

# Use nvm to switch
nvm use 18
nvm alias default 18
```

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### CI/CD Environment

#### GitHub Actions Issues

**Problem**: Tests pass locally but fail in CI
```yaml
# Add debugging steps
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Environment: $NODE_ENV"
    ls -la
```

**Problem**: Out of memory in CI
```yaml
# Increase memory
- name: Run tests
  run: NODE_OPTIONS="--max-old-space-size=4096" npm run test:all
```

#### Docker Issues

**Problem**: Tests fail in Docker container
```dockerfile
# Ensure proper Node.js version
FROM node:18-alpine

# Install dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont
```

## 🔍 Debugging Strategies

### 1. Systematic Approach

```bash
# Step 1: Check environment
npm run test:health

# Step 2: Run minimal test
npm run test:unit -- --testNamePattern="basic"

# Step 3: Isolate the problem
npm run test:unit -- --testPathPattern="specific-file"

# Step 4: Add debugging
npm run test:unit -- --verbose --no-cache
```

### 2. Logging and Debugging

```javascript
// Add debug logging
console.log('Test environment:', process.env.NODE_ENV);
console.log('Database URL:', process.env.DATABASE_URL);

// Use Jest debugging
test('debug test', () => {
  console.log('Current state:', component.debug());
});
```

### 3. Incremental Testing

```bash
# Test one type at a time
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
```

## 📊 Performance Monitoring

### Test Execution Times

```javascript
// Monitor test performance
const testTimes = {};

beforeEach(() => {
  testTimes.start = performance.now();
});

afterEach(() => {
  const duration = performance.now() - testTimes.start;
  if (duration > 5000) { // 5 second threshold
    console.warn(`Slow test detected: ${duration}ms`);
  }
});
```

### Resource Usage

```bash
# Monitor during test execution
npm run test:all &
PID=$!

# Monitor resources
while kill -0 $PID 2>/dev/null; do
  ps -p $PID -o pid,ppid,pcpu,pmem,cmd
  sleep 5
done
```

## 🛠️ Recovery Procedures

### Complete Reset

```bash
# Nuclear option - complete reset
rm -rf node_modules package-lock.json
rm -rf .next
rm -rf coverage
rm -rf playwright-report
rm -rf test-results

# Reinstall everything
npm install
npx playwright install
npx prisma generate

# Run tests
npm run test:all
```

### Database Reset

```bash
# Reset Prisma database
npx prisma migrate reset --force
npx prisma db seed

# Reset Supabase (if using)
# Manual reset through Supabase dashboard
```

### Cache Clearing

```bash
# Clear all caches
npx jest --clearCache
npm cache clean --force
rm -rf .next/cache
```

## 📞 Getting Help

### Internal Resources

1. **Check Documentation**
   - [Testing Guide](./TESTING_GUIDE.md)
   - [Unit Testing Guide](./UNIT_TESTING.md)
   - [Integration Testing Guide](./INTEGRATION_TESTING.md)

2. **Review Test Examples**
   - Look at existing passing tests
   - Check test patterns in codebase

3. **Team Communication**
   - Ask in team chat
   - Create GitHub issue
   - Schedule debugging session

### External Resources

1. **Jest Documentation**: https://jestjs.io/docs/troubleshooting
2. **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
3. **Playwright Documentation**: https://playwright.dev/docs/debug
4. **Prisma Troubleshooting**: https://www.prisma.io/docs/guides/other/troubleshooting

## 📋 Checklist for Common Issues

### Before Reporting a Bug

- [ ] Cleared all caches
- [ ] Verified environment variables
- [ ] Checked Node.js version
- [ ] Ran tests in isolation
- [ ] Checked for recent changes
- [ ] Reviewed error logs completely
- [ ] Tried on different machine/environment
- [ ] Checked documentation

### Information to Include

- [ ] Exact error message
- [ ] Steps to reproduce
- [ ] Environment details (OS, Node.js version)
- [ ] Test command used
- [ ] Recent changes made
- [ ] Screenshots/logs if applicable

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: LUMO Development Team 
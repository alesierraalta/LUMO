# 🧪 LUMO Testing Guide

## Overview

This guide provides comprehensive documentation for the testing infrastructure implemented in the LUMO inventory management system. Our testing strategy follows industry best practices and covers all aspects of the application.

## 📊 Testing Statistics

- **Total Tests**: 111 tests
- **Success Rate**: 100% ✅
- **Coverage Types**: Unit, Integration, E2E, Performance
- **Execution Time**: ~51 seconds (full suite)

## 🏗️ Testing Architecture

### Testing Types Implemented

| Type | Count | Purpose | Execution Time |
|------|-------|---------|----------------|
| **Unit Tests** | 5 | Component isolation testing | ~1.3s |
| **Integration Tests** | 18 | API and database integration | ~1s |
| **E2E Tests** | 73 | Full user workflow testing | ~47s |
| **Performance Tests** | 15 | Load and performance validation | ~1.8s |

### Technology Stack

- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: Jest + Supertest + Custom DB abstraction
- **E2E Testing**: Playwright (Cross-browser)
- **Performance Testing**: Jest + Custom performance utilities
- **Database**: Dual support (Prisma dev + Supabase prod)

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Run tests in watch mode
npm run test:unit -- --watch

# Run tests with coverage
npm run test:unit -- --coverage
```

### Test Structure

```
src/__tests__/
├── unit/                    # Unit tests
│   ├── components/         # React component tests
│   ├── hooks/             # Custom hook tests
│   └── utils/             # Utility function tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   ├── database/          # Database operation tests
│   └── test-setup.ts      # Shared test utilities
├── e2e/                   # End-to-end tests
│   ├── auth.test.ts       # Authentication flows
│   ├── inventory.test.ts  # Inventory management
│   └── setup/             # E2E test setup
└── performance/           # Performance tests
    ├── api-performance.test.ts
    └── database-performance.test.ts
```

## 📋 Test Naming Conventions

Following Node.js best practices, we use descriptive test names that include:

1. **Unit under test**
2. **Scenario being tested**
3. **Expected outcome**

### ✅ Good Examples

```javascript
describe('Products Service', () => {
  describe('Add new product', () => {
    it('When no price is specified, then the product status is pending approval', () => {
      // Test implementation
    });
    
    it('When valid product data is provided, then product is created successfully', () => {
      // Test implementation
    });
  });
});
```

### ❌ Avoid

```javascript
it('Should return the right status', () => {
  // Unclear what scenario and expectation
});
```

## 🔧 Configuration Files

### Jest Configuration

- `jest.config.js` - Unit tests (jsdom environment)
- `jest.config.integration.js` - Integration tests (node environment)
- `jest.setup.js` - Global test setup and mocks

### Playwright Configuration

- `playwright.config.ts` - E2E test configuration
- Cross-browser testing (Chromium, Firefox, WebKit, Mobile)
- Automatic screenshots and videos on failure

## 🗄️ Database Testing Strategy

### Dual Database Support

Our testing infrastructure supports both development and production database environments:

```typescript
// Automatic environment detection
const isDevelopment = process.env.NODE_ENV === 'development'
const isSupabaseEnv = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY

// Unified API for both Prisma and Supabase
export const db = {
  user: { create, findMany, findUnique, deleteMany },
  role: { create, findMany, deleteMany },
  category: { create, findMany, deleteMany }
}
```

### Test Data Management

- **Isolation**: Each test creates its own data
- **Cleanup**: Automatic cleanup after each test
- **Factories**: Reusable test data factories
- **No Global Fixtures**: Avoid shared test data

## 🎯 Best Practices

### 1. AAA Pattern (Arrange, Act, Assert)

```javascript
test('When customer spent more than 500$, should be classified as premium', () => {
  // Arrange
  const customerToClassify = {spent: 505, joined: new Date(), id: 1}
  const DBStub = sinon.stub(dataAccess, 'getCustomer')
    .reply({id: 1, classification: 'regular'});

  // Act
  const receivedClassification = customerClassifier.classifyCustomer(customerToClassify);

  // Assert
  expect(receivedClassification).toMatch('premium');
});
```

### 2. Test Independence

- Each test should be able to run in isolation
- No dependencies between tests
- Clean setup and teardown

### 3. Meaningful Assertions

```javascript
// ✅ Good - Specific assertion
expect(user.status).toBe('active');
expect(response.data).toHaveLength(3);

// ❌ Avoid - Generic assertion
expect(result).toBeTruthy();
```

### 4. Error Testing

```javascript
describe('Authentication', () => {
  it('Should throw ConnectionError when service is unavailable', () => {
    const authService = new AuthService();
    authService.participants = getDisconnectedParticipants();
    
    expect(authService.login.bind({email: 'test@example.com'}))
      .to.throw(ConnectionError);
  });
});
```

## 🔍 Debugging Tests

### Common Issues and Solutions

1. **Async Test Failures**
   ```javascript
   // ✅ Proper async handling
   test('async operation', async () => {
     const result = await asyncFunction();
     expect(result).toBe(expected);
   });
   ```

2. **Mock Cleanup**
   ```javascript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Environment Variables**
   ```javascript
   beforeEach(() => {
     process.env.NODE_ENV = 'test';
   });
   ```

## 📈 Performance Benchmarks

### Thresholds

- **Simple Queries**: < 100ms
- **Complex Queries**: < 500ms
- **Bulk Operations**: < 1000ms
- **API Responses**: < 300ms
- **E2E User Flows**: < 5000ms

### Monitoring

```javascript
test('should handle bulk operations efficiently', async () => {
  const startTime = performance.now();
  
  await performBulkOperation();
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  expect(executionTime).toBeLessThan(1000); // 1 second threshold
});
```

## 🔗 Related Documentation

- [Unit Testing Guide](./UNIT_TESTING.md)
- [Integration Testing Guide](./INTEGRATION_TESTING.md)
- [E2E Testing Guide](./E2E_TESTING.md)
- [Performance Testing Guide](./PERFORMANCE_TESTING.md)
- [CI/CD Integration](./CI_CD_INTEGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

## 🤝 Contributing

When adding new tests:

1. Follow the established naming conventions
2. Use the AAA pattern
3. Ensure test independence
4. Add appropriate documentation
5. Update this guide if needed

## 📞 Support

For questions about testing:
- Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review existing test examples
- Consult the team's testing standards

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: LUMO Development Team 
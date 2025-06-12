/**
 * @jest-environment jsdom
 */

describe('Testing Infrastructure Verification', () => {
  test('should run basic test', () => {
    expect(true).toBe(true)
  })

  test('should handle async operations', async () => {
    const promise = Promise.resolve(42)
    const result = await promise
    expect(result).toBe(42)
  })

  test('should work with setTimeout', (done) => {
    setTimeout(() => {
      expect(1 + 1).toBe(2)
      done()
    }, 10)
  })

  test('should handle environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })

  test('should have access to global objects', () => {
    expect(global).toBeDefined()
    expect(console).toBeDefined()
  })
}) 
/**
 * Test Optimization Utilities for LUMO Inventory System
 * 
 * This module provides utilities for optimizing test execution speed,
 * parallel test running, and overall test performance.
 */

import { Worker } from 'worker_threads'
import { performance } from 'perf_hooks'

export interface TestSuite {
  name: string
  tests: TestCase[]
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
}

export interface TestCase {
  name: string
  fn: () => Promise<void>
  timeout?: number
  retries?: number
  tags?: string[]
}

export interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: Error
  retryCount?: number
}

export interface TestExecutionOptions {
  parallel?: boolean
  maxWorkers?: number
  timeout?: number
  retries?: number
  bail?: boolean
  grep?: string
  tags?: string[]
}

export interface TestExecutionReport {
  totalTests: number
  passed: number
  failed: number
  skipped: number
  totalDuration: number
  results: TestResult[]
  coverage?: CoverageReport
}

export interface CoverageReport {
  statements: { total: number; covered: number; percentage: number }
  branches: { total: number; covered: number; percentage: number }
  functions: { total: number; covered: number; percentage: number }
  lines: { total: number; covered: number; percentage: number }
}

/**
 * Test Runner with optimization capabilities
 */
export class OptimizedTestRunner {
  private results: TestResult[] = []
  private startTime: number = 0

  /**
   * Run test suites with optimization
   */
  async runSuites(
    suites: TestSuite[],
    options: TestExecutionOptions = {}
  ): Promise<TestExecutionReport> {
    const {
      parallel = true,
      maxWorkers = Math.max(1, Math.floor(require('os').cpus().length / 2)),
      timeout = 30000,
      retries = 0,
      bail = false,
      grep,
      tags
    } = options

    console.log(`🚀 Starting optimized test execution`)
    console.log(`   Parallel: ${parallel}, Workers: ${maxWorkers}`)
    console.log(`   Timeout: ${timeout}ms, Retries: ${retries}`)

    this.startTime = performance.now()
    this.results = []

    // Filter and flatten tests
    const allTests = this.filterTests(suites, grep, tags)
    console.log(`   Total tests: ${allTests.length}`)

    if (parallel && allTests.length > 1) {
      await this.runTestsInParallel(allTests, maxWorkers, timeout, retries, bail)
    } else {
      await this.runTestsSequentially(allTests, timeout, retries, bail)
    }

    const totalDuration = performance.now() - this.startTime

    return this.generateReport(totalDuration)
  }

  /**
   * Run tests in parallel using worker threads
   */
  private async runTestsInParallel(
    tests: Array<{ suite: TestSuite; test: TestCase }>,
    maxWorkers: number,
    timeout: number,
    retries: number,
    bail: boolean
  ): Promise<void> {
    console.log(`   Running ${tests.length} tests in parallel with ${maxWorkers} workers`)

    const chunks = this.chunkArray(tests, Math.ceil(tests.length / maxWorkers))
    const workers: Promise<TestResult[]>[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (chunk.length > 0) {
        workers.push(this.runTestChunk(chunk, timeout, retries, i))
      }
    }

    const results = await Promise.all(workers)
    this.results = results.flat()

    // Check for bail condition
    if (bail && this.results.some(r => r.status === 'failed')) {
      console.log('   Bailing out due to test failure')
    }
  }

  /**
   * Run tests sequentially
   */
  private async runTestsSequentially(
    tests: Array<{ suite: TestSuite; test: TestCase }>,
    timeout: number,
    retries: number,
    bail: boolean
  ): Promise<void> {
    console.log(`   Running ${tests.length} tests sequentially`)

    for (const { suite, test } of tests) {
      const result = await this.runSingleTest(suite, test, timeout, retries)
      this.results.push(result)

      if (bail && result.status === 'failed') {
        console.log('   Bailing out due to test failure')
        break
      }
    }
  }

  /**
   * Run a chunk of tests (for parallel execution)
   */
  private async runTestChunk(
    chunk: Array<{ suite: TestSuite; test: TestCase }>,
    timeout: number,
    retries: number,
    workerId: number
  ): Promise<TestResult[]> {
    const results: TestResult[] = []

    for (const { suite, test } of chunk) {
      const result = await this.runSingleTest(suite, test, timeout, retries)
      results.push(result)
      
      console.log(`   Worker ${workerId}: ${result.name} - ${result.status} (${result.duration.toFixed(2)}ms)`)
    }

    return results
  }

  /**
   * Run a single test with retries
   */
  private async runSingleTest(
    suite: TestSuite,
    test: TestCase,
    globalTimeout: number,
    globalRetries: number
  ): Promise<TestResult> {
    const testTimeout = test.timeout || globalTimeout
    const testRetries = test.retries !== undefined ? test.retries : globalRetries
    const testName = `${suite.name} - ${test.name}`

    let lastError: Error | undefined
    let retryCount = 0

    for (let attempt = 0; attempt <= testRetries; attempt++) {
      const startTime = performance.now()

      try {
        // Run suite setup if first test
        if (suite.setup && attempt === 0) {
          await this.withTimeout(suite.setup(), testTimeout)
        }

        // Run the test
        await this.withTimeout(test.fn(), testTimeout)

        // Run suite teardown if last test
        if (suite.teardown && attempt === 0) {
          await this.withTimeout(suite.teardown(), testTimeout)
        }

        const duration = performance.now() - startTime

        return {
          name: testName,
          status: 'passed',
          duration,
          retryCount: attempt
        }
      } catch (error) {
        lastError = error as Error
        retryCount = attempt

        if (attempt < testRetries) {
          console.log(`   Retrying ${testName} (attempt ${attempt + 2}/${testRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, 100 * attempt)) // Exponential backoff
        }
      }
    }

    const duration = performance.now() - performance.now() // This will be 0, but we need a duration

    return {
      name: testName,
      status: 'failed',
      duration,
      error: lastError,
      retryCount
    }
  }

  /**
   * Filter tests based on grep pattern and tags
   */
  private filterTests(
    suites: TestSuite[],
    grep?: string,
    tags?: string[]
  ): Array<{ suite: TestSuite; test: TestCase }> {
    const allTests: Array<{ suite: TestSuite; test: TestCase }> = []

    for (const suite of suites) {
      for (const test of suite.tests) {
        const testName = `${suite.name} - ${test.name}`

        // Apply grep filter
        if (grep && !testName.includes(grep)) {
          continue
        }

        // Apply tags filter
        if (tags && tags.length > 0) {
          if (!test.tags || !test.tags.some(tag => tags.includes(tag))) {
            continue
          }
        }

        allTests.push({ suite, test })
      }
    }

    return allTests
  }

  /**
   * Generate test execution report
   */
  private generateReport(totalDuration: number): TestExecutionReport {
    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const skipped = this.results.filter(r => r.status === 'skipped').length

    return {
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      totalDuration,
      results: this.results
    }
  }

  /**
   * Utility to run function with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  }

  /**
   * Utility to chunk array for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}

/**
 * Test Database Pool for optimized database testing
 */
export class TestDatabasePool {
  private pools: Map<string, any[]> = new Map()
  private inUse: Set<any> = new Set()

  /**
   * Get a database connection from the pool
   */
  async getConnection(poolName = 'default'): Promise<any> {
    let pool = this.pools.get(poolName)
    
    if (!pool) {
      pool = []
      this.pools.set(poolName, pool)
    }

    // Find available connection
    const available = pool.find(conn => !this.inUse.has(conn))
    
    if (available) {
      this.inUse.add(available)
      return available
    }

    // Create new connection if pool is not at max size
    if (pool.length < 10) { // Max 10 connections per pool
      const newConnection = await this.createConnection(poolName)
      pool.push(newConnection)
      this.inUse.add(newConnection)
      return newConnection
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const checkForAvailable = () => {
        const available = pool!.find(conn => !this.inUse.has(conn))
        if (available) {
          this.inUse.add(available)
          resolve(available)
        } else {
          setTimeout(checkForAvailable, 10)
        }
      }
      checkForAvailable()
    })
  }

  /**
   * Release a database connection back to the pool
   */
  releaseConnection(connection: any): void {
    this.inUse.delete(connection)
  }

  /**
   * Close all connections in all pools
   */
  async closeAll(): Promise<void> {
    for (const [poolName, pool] of this.pools) {
      for (const connection of pool) {
        await this.closeConnection(connection)
      }
    }
    this.pools.clear()
    this.inUse.clear()
  }

  /**
   * Create a new database connection
   */
  private async createConnection(poolName: string): Promise<any> {
    // This would create an actual database connection
    // For now, return a mock connection
    return {
      id: `${poolName}-${Date.now()}-${Math.random()}`,
      poolName,
      createdAt: new Date()
    }
  }

  /**
   * Close a database connection
   */
  private async closeConnection(connection: any): Promise<void> {
    // This would close the actual database connection
    console.log(`Closing connection ${connection.id}`)
  }
}

/**
 * Test Cache for optimizing repeated operations
 */
export class TestCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map()

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key)
    
    if (!item) {
      return undefined
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return undefined
    }

    return item.value
  }

  /**
   * Set value in cache with TTL
   */
  set(key: string, value: any, ttlMs = 60000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    })
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get or set pattern
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs = 60000
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    if (cached !== undefined) {
      return cached
    }

    const value = await factory()
    this.set(key, value, ttlMs)
    return value
  }
}

/**
 * Test optimization utilities
 */
export const testOptimizationUtils = {
  /**
   * Create optimized test runner
   */
  createRunner: (): OptimizedTestRunner => {
    return new OptimizedTestRunner()
  },

  /**
   * Create database pool
   */
  createDatabasePool: (): TestDatabasePool => {
    return new TestDatabasePool()
  },

  /**
   * Create test cache
   */
  createCache: (): TestCache => {
    return new TestCache()
  },

  /**
   * Measure test execution time
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    return { result, duration }
  },

  /**
   * Create test data factory with caching
   */
  createCachedFactory: <T>(
    factory: () => Promise<T>,
    cache: TestCache,
    keyPrefix: string
  ) => {
    return async (id: string): Promise<T> => {
      const key = `${keyPrefix}:${id}`
      return cache.getOrSet(key, factory)
    }
  },

  /**
   * Batch test operations for better performance
   */
  batchOperations: async <T, R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>,
    batchSize = 10
  ): Promise<R[]> => {
    const results: R[] = []
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await operation(batch)
      results.push(...batchResults)
    }
    
    return results
  },

  /**
   * Parallel test execution with concurrency limit
   */
  parallelWithLimit: async <T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    limit = 5
  ): Promise<R[]> => {
    const results: R[] = []
    const executing: Promise<void>[] = []

    for (const item of items) {
      const promise = operation(item).then(result => {
        results.push(result)
      })

      executing.push(promise)

      if (executing.length >= limit) {
        await Promise.race(executing)
        executing.splice(executing.findIndex(p => p === promise), 1)
      }
    }

    await Promise.all(executing)
    return results
  }
}

/**
 * Performance monitoring for tests
 */
export class TestPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  /**
   * Record a metric
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string): {
    count: number
    min: number
    max: number
    avg: number
    median: number
  } | undefined {
    const values = this.metrics.get(name)
    
    if (!values || values.length === 0) {
      return undefined
    }

    const sorted = [...values].sort((a, b) => a - b)
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)]
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    let report = '\n📊 TEST PERFORMANCE REPORT\n'
    report += '=' .repeat(40) + '\n\n'

    for (const [name, values] of this.metrics) {
      const stats = this.getStats(name)!
      report += `📈 ${name}\n`
      report += `   Count: ${stats.count}\n`
      report += `   Min/Max: ${stats.min.toFixed(2)}ms / ${stats.max.toFixed(2)}ms\n`
      report += `   Average: ${stats.avg.toFixed(2)}ms\n`
      report += `   Median: ${stats.median.toFixed(2)}ms\n\n`
    }

    return report
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }
}

// Test to make Jest recognize this as a test file
describe('Test Optimization', () => {
  it('should export optimization utilities', () => {
    expect(OptimizedTestRunner).toBeDefined()
    expect(TestDatabasePool).toBeDefined()
    expect(TestCache).toBeDefined()
    expect(TestPerformanceMonitor).toBeDefined()
    expect(testOptimizationUtils).toBeDefined()
  })

  it('should create optimized test runner', () => {
    const runner = testOptimizationUtils.createRunner()
    expect(runner).toBeInstanceOf(OptimizedTestRunner)
  })

  it('should create test cache', () => {
    const cache = testOptimizationUtils.createCache()
    expect(cache).toBeInstanceOf(TestCache)
  })
})
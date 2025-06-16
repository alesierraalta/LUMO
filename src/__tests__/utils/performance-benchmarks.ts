/**
 * Performance Benchmarking Utilities for LUMO Inventory System
 * 
 * This module provides comprehensive performance testing and benchmarking
 * capabilities for database operations and API endpoints.
 */

export interface BenchmarkResult {
  name: string
  iterations: number
  totalDuration: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  medianDuration: number
  p95Duration: number
  p99Duration: number
  throughput: number // operations per second
  timestamp: Date
}

export interface BenchmarkOptions {
  iterations?: number
  warmupIterations?: number
  maxDuration?: number // max duration per operation in ms
  minThroughput?: number // min operations per second
  timeout?: number // overall timeout in ms
}

export interface DatabaseBenchmarkSuite {
  name: string
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
  benchmarks: DatabaseBenchmark[]
}

export interface DatabaseBenchmark {
  name: string
  operation: () => Promise<any>
  expectedMaxDuration?: number
  expectedMinThroughput?: number
}

export interface ApiBenchmarkSuite {
  name: string
  baseUrl?: string
  setup?: () => Promise<void>
  teardown?: () => Promise<void>
  benchmarks: ApiBenchmark[]
}

export interface ApiBenchmark {
  name: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  expectedMaxDuration?: number
  expectedMinThroughput?: number
}

/**
 * Core benchmarking engine
 */
export class PerformanceBenchmark {
  private results: BenchmarkResult[] = []

  /**
   * Run a single benchmark
   */
  async runBenchmark(
    name: string,
    operation: () => Promise<any>,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 10,
      warmupIterations = 2,
      maxDuration: maxDurationThreshold = 5000,
      minThroughput = 1,
      timeout = 30000
    } = options

    console.log(`🚀 Running benchmark: ${name}`)
    console.log(`   Iterations: ${iterations}, Warmup: ${warmupIterations}`)

    // Warmup phase
    console.log('   Warming up...')
    for (let i = 0; i < warmupIterations; i++) {
      await operation()
    }

    // Actual benchmark
    console.log('   Benchmarking...')
    const durations: number[] = []
    const startTime = Date.now()

    for (let i = 0; i < iterations; i++) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Benchmark timeout exceeded: ${timeout}ms`)
      }

      const start = performance.now()
      await operation()
      const end = performance.now()
      
      const duration = end - start
      durations.push(duration)

      // Check if operation is too slow
      if (duration > maxDurationThreshold) {
        console.warn(`   ⚠️  Iteration ${i + 1} exceeded max duration: ${duration.toFixed(2)}ms`)
      }
    }

    // Calculate statistics
    const sortedDurations = durations.sort((a, b) => a - b)
    const totalDuration = durations.reduce((sum, d) => sum + d, 0)
    const avgDuration = totalDuration / iterations
    const minDuration = Math.min(...durations)
    const maxDuration = Math.max(...durations)
    const medianDuration = this.calculatePercentile(sortedDurations, 50)
    const p95Duration = this.calculatePercentile(sortedDurations, 95)
    const p99Duration = this.calculatePercentile(sortedDurations, 99)
    const throughput = (iterations / totalDuration) * 1000 // ops per second

    const result: BenchmarkResult = {
      name,
      iterations,
      totalDuration,
      avgDuration,
      minDuration,
      maxDuration,
      medianDuration,
      p95Duration,
      p99Duration,
      throughput,
      timestamp: new Date()
    }

    this.results.push(result)
    this.logResult(result)

    // Validate performance thresholds
    if (avgDuration > maxDuration) {
      console.warn(`   ⚠️  Average duration (${avgDuration.toFixed(2)}ms) exceeds threshold (${maxDuration}ms)`)
    }
    
    if (throughput < minThroughput) {
      console.warn(`   ⚠️  Throughput (${throughput.toFixed(2)} ops/s) below threshold (${minThroughput} ops/s)`)
    }

    return result
  }

  /**
   * Run database benchmark suite
   */
  async runDatabaseBenchmarks(suite: DatabaseBenchmarkSuite): Promise<BenchmarkResult[]> {
    console.log(`\n📊 Running Database Benchmark Suite: ${suite.name}`)
    
    if (suite.setup) {
      console.log('   Setting up...')
      await suite.setup()
    }

    const results: BenchmarkResult[] = []

    try {
      for (const benchmark of suite.benchmarks) {
        const result = await this.runBenchmark(
          `${suite.name} - ${benchmark.name}`,
          benchmark.operation,
          {
            maxDuration: benchmark.expectedMaxDuration,
            minThroughput: benchmark.expectedMinThroughput
          }
        )
        results.push(result)
      }
    } finally {
      if (suite.teardown) {
        console.log('   Tearing down...')
        await suite.teardown()
      }
    }

    return results
  }

  /**
   * Run API benchmark suite
   */
  async runApiBenchmarks(suite: ApiBenchmarkSuite): Promise<BenchmarkResult[]> {
    console.log(`\n🌐 Running API Benchmark Suite: ${suite.name}`)
    
    if (suite.setup) {
      console.log('   Setting up...')
      await suite.setup()
    }

    const results: BenchmarkResult[] = []

    try {
      for (const benchmark of suite.benchmarks) {
        const operation = async () => {
          const url = suite.baseUrl ? `${suite.baseUrl}${benchmark.endpoint}` : benchmark.endpoint
          const response = await fetch(url, {
            method: benchmark.method,
            headers: {
              'Content-Type': 'application/json',
              ...benchmark.headers
            },
            body: benchmark.body ? JSON.stringify(benchmark.body) : undefined
          })
          
          if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`)
          }
          
          return response.json()
        }

                 const result = await this.runBenchmark(
           `${suite.name} - ${benchmark.name}`,
           operation,
           {
             maxDuration: benchmark.expectedMaxDuration,
             minThroughput: benchmark.expectedMinThroughput
           }
         )
        results.push(result)
      }
    } finally {
      if (suite.teardown) {
        console.log('   Tearing down...')
        await suite.teardown()
      }
    }

    return results
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.'
    }

    let report = '\n📈 PERFORMANCE BENCHMARK REPORT\n'
    report += '=' .repeat(50) + '\n\n'

    this.results.forEach(result => {
      report += `🔍 ${result.name}\n`
      report += `   Iterations: ${result.iterations}\n`
      report += `   Average: ${result.avgDuration.toFixed(2)}ms\n`
      report += `   Median: ${result.medianDuration.toFixed(2)}ms\n`
      report += `   Min/Max: ${result.minDuration.toFixed(2)}ms / ${result.maxDuration.toFixed(2)}ms\n`
      report += `   P95/P99: ${result.p95Duration.toFixed(2)}ms / ${result.p99Duration.toFixed(2)}ms\n`
      report += `   Throughput: ${result.throughput.toFixed(2)} ops/sec\n`
      report += `   Timestamp: ${result.timestamp.toISOString()}\n\n`
    })

    return report
  }

  /**
   * Export results to JSON
   */
  exportResults(): BenchmarkResult[] {
    return [...this.results]
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = []
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) {
      return sortedArray[lower]
    }
    
    const weight = index - lower
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
  }

  /**
   * Log benchmark result
   */
  private logResult(result: BenchmarkResult): void {
    console.log(`   ✅ Completed: ${result.avgDuration.toFixed(2)}ms avg, ${result.throughput.toFixed(2)} ops/s`)
  }
}

/**
 * Predefined benchmark suites for LUMO Inventory System
 */
export const lumoBenchmarkSuites = {
  /**
   * Database operations benchmark suite
   */
  database: (): DatabaseBenchmarkSuite => ({
    name: 'Database Operations',
    setup: async () => {
      // Setup test data if needed
    },
    teardown: async () => {
      // Cleanup test data
    },
    benchmarks: [
      {
        name: 'User Creation',
        operation: async () => {
          // Mock user creation operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
          return { id: 'test-user', email: 'test@example.com' }
        },
        expectedMaxDuration: 100,
        expectedMinThroughput: 50
      },
      {
        name: 'Inventory Item Query',
        operation: async () => {
          // Mock inventory query operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 20))
          return [{ id: 'item-1', name: 'Test Item' }]
        },
        expectedMaxDuration: 200,
        expectedMinThroughput: 25
      },
      {
        name: 'Stock Movement Creation',
        operation: async () => {
          // Mock stock movement operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 15))
          return { id: 'movement-1', type: 'IN', quantity: 10 }
        },
        expectedMaxDuration: 150,
        expectedMinThroughput: 30
      }
    ]
  }),

  /**
   * API endpoints benchmark suite
   */
  api: (baseUrl = 'http://localhost:3000'): ApiBenchmarkSuite => ({
    name: 'API Endpoints',
    baseUrl,
    setup: async () => {
      // Setup test data or authentication
    },
    teardown: async () => {
      // Cleanup
    },
    benchmarks: [
      {
        name: 'Health Check',
        endpoint: '/api/health',
        method: 'GET',
        expectedMaxDuration: 50,
        expectedMinThroughput: 100
      },
      {
        name: 'User Authentication',
        endpoint: '/api/auth/login',
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'testpassword'
        },
        expectedMaxDuration: 500,
        expectedMinThroughput: 10
      },
      {
        name: 'Inventory List',
        endpoint: '/api/products',
        method: 'GET',
        expectedMaxDuration: 300,
        expectedMinThroughput: 20
      }
    ]
  })
}

/**
 * Performance test assertions
 */
export const performanceAssertions = {
  /**
   * Assert that operation completes within time limit
   */
  expectDuration: (result: BenchmarkResult, maxDuration: number) => {
    expect(result.avgDuration).toBeLessThan(maxDuration)
  },

  /**
   * Assert minimum throughput
   */
  expectThroughput: (result: BenchmarkResult, minThroughput: number) => {
    expect(result.throughput).toBeGreaterThan(minThroughput)
  },

  /**
   * Assert P95 performance
   */
  expectP95: (result: BenchmarkResult, maxP95: number) => {
    expect(result.p95Duration).toBeLessThan(maxP95)
  },

  /**
   * Assert consistent performance (low variance)
   */
  expectConsistency: (result: BenchmarkResult, maxVarianceRatio = 2) => {
    const variance = result.maxDuration / result.minDuration
    expect(variance).toBeLessThan(maxVarianceRatio)
  }
}

/**
 * Create a new performance benchmark instance
 */
export const createBenchmark = (): PerformanceBenchmark => {
  return new PerformanceBenchmark()
}

// Test to make Jest recognize this as a test file
describe('Performance Benchmarks', () => {
  it('should export benchmark utilities', () => {
    expect(PerformanceBenchmark).toBeDefined()
    expect(lumoBenchmarkSuites).toBeDefined()
    expect(performanceAssertions).toBeDefined()
    expect(createBenchmark).toBeDefined()
  })

  it('should create benchmark instance', () => {
    const benchmark = createBenchmark()
    expect(benchmark).toBeInstanceOf(PerformanceBenchmark)
  })
})
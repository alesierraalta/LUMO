/**
 * Circuit Breaker Pattern Implementation
 * 
 * This utility implements the circuit breaker pattern for handling failing operations.
 * It provides retry capabilities with exponential backoff and circuit-breaking
 * to prevent cascading failures during transient errors.
 */

import { v4 as uuidv4 } from 'uuid';

// Circuit breaker states
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

// Circuit breaker options
interface CircuitBreakerOptions {
  maxFailures: number;       // Number of failures before opening circuit
  resetTimeout: number;      // Time in ms before trying half-open state
  maxRetries: number;        // Maximum number of retry attempts
  timeout: number;           // Operation timeout in ms
  retryDelay: number;        // Base delay between retries in ms
  operationName?: string;    // Name for logging purposes
}

// Default options
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  maxFailures: 3,
  resetTimeout: 30000,       // 30 seconds
  maxRetries: 3,
  timeout: 10000,            // 10 seconds
  retryDelay: 500,           // 500ms base delay
};

// State tracking for each circuit breaker instance
interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  lastFailureTime: number | null;
  operationId: string;
}

/**
 * The CircuitBreaker class provides resilience against failed operations
 */
export class CircuitBreaker {
  private options: CircuitBreakerOptions;
  private state: CircuitBreakerState;
  private static instances: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker instance by name
   * This ensures we reuse the same circuit state across calls
   */
  static getInstance(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CircuitBreaker({
        ...DEFAULT_OPTIONS,
        ...options,
        operationName: name,
      }));
    }
    return this.instances.get(name)!;
  }

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: null,
      operationId: `cb-${uuidv4().slice(0, 8)}`
    };

    // Log creation of new circuit breaker
    console.log(`[${this.state.operationId}] 🔌 Created new circuit breaker for ${this.options.operationName || 'operation'}`, {
      config: {
        ...this.options,
      }
    });
  }

  /**
   * Execute an operation with circuit breaking and retry logic
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Generate unique ID for this execution
    const executionId = `exec-${Date.now().toString(36)}`;

    // Check if circuit is open
    if (this.state.state === 'OPEN') {
      // Check if it's time to try half-open state
      const now = Date.now();
      if (this.state.lastFailureTime && now - this.state.lastFailureTime >= this.options.resetTimeout) {
        console.log(`[${this.state.operationId}:${executionId}] 🔄 Circuit moving from OPEN to HALF_OPEN`);
        this.state.state = 'HALF_OPEN';
      } else {
        // Still open, fast-fail
        console.warn(`[${this.state.operationId}:${executionId}] ⚠️ Circuit OPEN - fast failing`);
        throw new Error(`Circuit breaker open for ${this.options.operationName || 'operation'}`);
      }
    }

    // Execute with retry logic
    return this.executeWithRetries(operation, executionId);
  }

  /**
   * Internal method to execute with retry logic
   */
  private async executeWithRetries<T>(
    operation: () => Promise<T>,
    executionId: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      if (retryCount > 0) {
        console.log(`[${this.state.operationId}:${executionId}] 🔁 Retry attempt ${retryCount}/${this.options.maxRetries}`);
      } else {
        console.log(`[${this.state.operationId}:${executionId}] 🚀 Executing operation`);
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${this.options.timeout}ms`));
        }, this.options.timeout);
      });

      // Execute operation with timeout
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);

      // Success handling
      if (this.state.state === 'HALF_OPEN') {
        console.log(`[${this.state.operationId}:${executionId}] ✅ Success in HALF_OPEN state - closing circuit`);
        this.resetCircuit();
      } else if (retryCount > 0) {
        console.log(`[${this.state.operationId}:${executionId}] ✅ Success after ${retryCount} retries`);
      } else {
        console.log(`[${this.state.operationId}:${executionId}] ✅ Operation executed successfully`);
      }

      return result;
    } catch (error) {
      // If we're in half-open state, any failure returns to open
      if (this.state.state === 'HALF_OPEN') {
        console.error(`[${this.state.operationId}:${executionId}] ❌ Failed in HALF_OPEN state - reopening circuit`);
        this.state.state = 'OPEN';
        this.state.lastFailureTime = Date.now();
        throw error;
      }

      // Failure count tracking in closed state
      if (this.state.state === 'CLOSED') {
        this.state.failures++;
        console.error(
          `[${this.state.operationId}:${executionId}] ❌ Operation failed (${this.state.failures}/${this.options.maxFailures})`,
          error
        );

        if (this.state.failures >= this.options.maxFailures) {
          console.error(`[${this.state.operationId}:${executionId}] 🔌 Circuit OPEN after ${this.state.failures} failures`);
          this.state.state = 'OPEN';
          this.state.lastFailureTime = Date.now();
          throw error;
        }
      }

      // Check if we should retry
      if (retryCount < this.options.maxRetries) {
        // Calculate backoff delay with exponential backoff and small jitter
        const backoffDelay = this.options.retryDelay * Math.pow(2, retryCount) + Math.random() * 100;
        console.log(`[${this.state.operationId}:${executionId}] ⏳ Retrying in ${backoffDelay.toFixed(0)}ms (attempt ${retryCount + 1}/${this.options.maxRetries})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
        // Retry the operation
        return this.executeWithRetries(operation, executionId, retryCount + 1);
      } else {
        // Max retries exceeded
        console.error(`[${this.state.operationId}:${executionId}] 💥 Max retries exceeded - operation failed`);
        throw error;
      }
    }
  }

  /**
   * Reset the circuit breaker to closed state
   */
  resetCircuit() {
    this.state.state = 'CLOSED';
    this.state.failures = 0;
    this.state.lastFailureTime = null;
    console.log(`[${this.state.operationId}] 🔄 Circuit reset to CLOSED state`);
  }

  /**
   * Get the current state of the circuit
   */
  getState(): CircuitState {
    return this.state.state;
  }
}

/**
 * Convenience function to execute an operation with circuit breaking
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  name: string,
  options?: Partial<CircuitBreakerOptions>
): Promise<T> {
  const circuitBreaker = CircuitBreaker.getInstance(name, options);
  return circuitBreaker.execute(operation);
} 
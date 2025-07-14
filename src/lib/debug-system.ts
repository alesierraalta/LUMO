/**
 * Comprehensive Debugging System
 * Provides detailed error logging, execution tracking, and state monitoring
 */

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export interface DebugEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  function: string;
  message: string;
  data?: any;
  error?: Error;
  stackTrace?: string;
  executionContext?: string;
}

export interface ExecutionState {
  functionName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  variables: Record<string, any>;
  status: 'started' | 'completed' | 'failed';
  error?: Error;
}

class DebugSystem {
  private logs: DebugEntry[] = [];
  private executionStates: Map<string, ExecutionState> = new Map();
  private maxLogs = 1000;
  private logLevel = LogLevel.TRACE;
  private isEnabled = true;

  constructor() {
    // Enable debugging in development
    this.isEnabled = process.env.NODE_ENV === 'development';
    
    // Clear old logs periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupLogs(), 60000); // Clean every minute
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.isEnabled && level >= this.logLevel;
  }

  private addLog(entry: DebugEntry): void {
    if (!this.shouldLog(entry.level)) return;

    this.logs.push(entry);
    
    // Console output with color coding
    const colors = {
      [LogLevel.TRACE]: '#999',
      [LogLevel.DEBUG]: '#0066cc',
      [LogLevel.INFO]: '#00aa00',
      [LogLevel.WARN]: '#ff8800',
      [LogLevel.ERROR]: '#cc0000',
      [LogLevel.FATAL]: '#990000'
    };

    const color = colors[entry.level];
    const levelName = LogLevel[entry.level];
    
    console.group(`%c[${levelName}] ${entry.module}::${entry.function}`, `color: ${color}; font-weight: bold`);
    console.log(`%c${entry.message}`, `color: ${color}`);
    
    if (entry.data) {
      console.log('📊 Data:', entry.data);
    }
    
    if (entry.error) {
      console.error('❌ Error:', entry.error);
      if (entry.stackTrace) {
        console.error('📋 Stack Trace:', entry.stackTrace);
      }
    }
    
    console.groupEnd();

    // Keep logs within limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  public trace(module: string, func: string, message: string, data?: any): void {
    this.addLog({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.TRACE,
      module,
      function: func,
      message,
      data,
      executionContext: this.getExecutionContext()
    });
  }

  public debug(module: string, func: string, message: string, data?: any): void {
    this.addLog({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      module,
      function: func,
      message,
      data,
      executionContext: this.getExecutionContext()
    });
  }

  public info(module: string, func: string, message: string, data?: any): void {
    this.addLog({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      module,
      function: func,
      message,
      data,
      executionContext: this.getExecutionContext()
    });
  }

  public warn(module: string, func: string, message: string, data?: any): void {
    this.addLog({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      module,
      function: func,
      message,
      data,
      executionContext: this.getExecutionContext()
    });
  }

  public error(module: string, func: string, message: string, error?: Error, data?: any): void {
    this.addLog({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      module,
      function: func,
      message,
      data,
      error,
      stackTrace: error?.stack,
      executionContext: this.getExecutionContext()
    });
  }

  public fatal(module: string, func: string, message: string, error?: Error, data?: any): void {
    this.addLog({
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.FATAL,
      module,
      function: func,
      message,
      data,
      error,
      stackTrace: error?.stack,
      executionContext: this.getExecutionContext()
    });
  }

  // Execution tracking
  public startExecution(functionName: string, variables: Record<string, any> = {}): string {
    const executionId = this.generateId();
    const state: ExecutionState = {
      functionName,
      startTime: Date.now(),
      variables: { ...variables },
      status: 'started'
    };
    
    this.executionStates.set(executionId, state);
    this.trace('ExecutionTracker', functionName, `🚀 Execution started`, { executionId, variables });
    
    return executionId;
  }

  public updateExecution(executionId: string, variables: Record<string, any>): void {
    const state = this.executionStates.get(executionId);
    if (state) {
      state.variables = { ...state.variables, ...variables };
      this.trace('ExecutionTracker', state.functionName, `📝 Variables updated`, { executionId, variables });
    }
  }

  public endExecution(executionId: string, success: boolean = true, error?: Error): void {
    const state = this.executionStates.get(executionId);
    if (state) {
      state.endTime = Date.now();
      state.duration = state.endTime - state.startTime;
      state.status = success ? 'completed' : 'failed';
      state.error = error;

      if (success) {
        this.trace('ExecutionTracker', state.functionName, `✅ Execution completed in ${state.duration}ms`, { executionId });
      } else {
        this.error('ExecutionTracker', state.functionName, `❌ Execution failed after ${state.duration}ms`, error, { executionId });
      }
    }
  }

  // State monitoring
  public captureState(module: string, func: string, stateName: string, state: any): void {
    this.debug('StateMonitor', func, `📊 State captured: ${stateName}`, {
      module,
      stateName,
      state: this.sanitizeState(state),
      timestamp: Date.now()
    });
  }

  // Exception handling wrapper
  public async withErrorHandling<T>(
    module: string,
    func: string,
    operation: () => Promise<T>,
    variables?: Record<string, any>
  ): Promise<T> {
    const executionId = this.startExecution(func, variables);
    
    try {
      this.trace(module, func, '🔧 Starting operation');
      const result = await operation();
      this.endExecution(executionId, true);
      this.trace(module, func, '✅ Operation completed successfully');
      return result;
    } catch (error) {
      this.endExecution(executionId, false, error as Error);
      this.error(module, func, '❌ Operation failed', error as Error, variables);
      throw error;
    }
  }

  public withSyncErrorHandling<T>(
    module: string,
    func: string,
    operation: () => T,
    variables?: Record<string, any>
  ): T {
    const executionId = this.startExecution(func, variables);
    
    try {
      this.trace(module, func, '🔧 Starting sync operation');
      const result = operation();
      this.endExecution(executionId, true);
      this.trace(module, func, '✅ Sync operation completed successfully');
      return result;
    } catch (error) {
      this.endExecution(executionId, false, error as Error);
      this.error(module, func, '❌ Sync operation failed', error as Error, variables);
      throw error;
    }
  }

  // Utility methods
  private getExecutionContext(): string {
    if (typeof window !== 'undefined') {
      return `Browser - ${window.location.pathname}`;
    }
    return 'Server';
  }

  private sanitizeState(state: any): any {
    try {
      // Remove circular references and sensitive data
      return JSON.parse(JSON.stringify(state, (key, value) => {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
          return '[REDACTED]';
        }
        return value;
      }));
    } catch {
      return '[Complex Object - Cannot Serialize]';
    }
  }

  private cleanupLogs(): void {
    const cutoff = Date.now() - (10 * 60 * 1000); // 10 minutes
    this.logs = this.logs.filter(log => new Date(log.timestamp).getTime() > cutoff);
    
    // Clean up completed executions older than 5 minutes
    const execCutoff = Date.now() - (5 * 60 * 1000);
    for (const [id, state] of this.executionStates.entries()) {
      if (state.endTime && state.endTime < execCutoff) {
        this.executionStates.delete(id);
      }
    }
  }

  // Public getters for debugging tools
  public getLogs(level?: LogLevel, module?: string): DebugEntry[] {
    return this.logs.filter(log => {
      if (level !== undefined && log.level < level) return false;
      if (module && log.module !== module) return false;
      return true;
    });
  }

  public getExecutionStates(): ExecutionState[] {
    return Array.from(this.executionStates.values());
  }

  public getActiveExecutions(): ExecutionState[] {
    return Array.from(this.executionStates.values()).filter(state => state.status === 'started');
  }

  // Configuration
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info('DebugSystem', 'setLogLevel', `Log level changed to ${LogLevel[level]}`);
  }

  public getLogLevel(): LogLevel {
    return this.logLevel;
  }

  public enable(): void {
    this.isEnabled = true;
    this.info('DebugSystem', 'enable', 'Debugging enabled');
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public clear(): void {
    this.logs = [];
    this.executionStates.clear();
    console.clear();
    this.info('DebugSystem', 'clear', 'Debug logs cleared');
  }
}

// Singleton instance
export const debugSystem = new DebugSystem();

// Convenience functions
export const debug = {
  trace: (module: string, func: string, message: string, data?: any) => 
    debugSystem.trace(module, func, message, data),
  
  debug: (module: string, func: string, message: string, data?: any) => 
    debugSystem.debug(module, func, message, data),
  
  info: (module: string, func: string, message: string, data?: any) => 
    debugSystem.info(module, func, message, data),
  
  warn: (module: string, func: string, message: string, data?: any) => 
    debugSystem.warn(module, func, message, data),
  
  error: (module: string, func: string, message: string, error?: Error, data?: any) => 
    debugSystem.error(module, func, message, error, data),
  
  fatal: (module: string, func: string, message: string, error?: Error, data?: any) => 
    debugSystem.fatal(module, func, message, error, data),
  
  startExecution: (functionName: string, variables?: Record<string, any>) => 
    debugSystem.startExecution(functionName, variables),
  
  updateExecution: (executionId: string, variables: Record<string, any>) => 
    debugSystem.updateExecution(executionId, variables),
  
  endExecution: (executionId: string, success?: boolean, error?: Error) => 
    debugSystem.endExecution(executionId, success, error),
  
  captureState: (module: string, func: string, stateName: string, state: any) => 
    debugSystem.captureState(module, func, stateName, state),
  
  withErrorHandling: async <T>(
    module: string,
    func: string,
    operation: () => Promise<T>,
    variables?: Record<string, any>
  ) => debugSystem.withErrorHandling(module, func, operation, variables),
  
  withSyncErrorHandling: <T>(
    module: string,
    func: string,
    operation: () => T,
    variables?: Record<string, any>
  ) => debugSystem.withSyncErrorHandling(module, func, operation, variables)
};

// Global debug access for browser console
if (typeof window !== 'undefined') {
  (window as any).debugSystem = debugSystem;
  (window as any).debug = debug;
}
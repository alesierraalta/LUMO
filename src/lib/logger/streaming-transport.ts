import { LogEntry, LogLevel } from './types';
import { LogFormatter } from './formatters';

/**
 * Real-time streaming transport interface
 */
export interface StreamingTransport {
  write(entry: LogEntry): Promise<void>;
  flush(): Promise<void>;
  close(): Promise<void>;
  subscribe(callback: (entry: LogEntry) => void): () => void;
  getHealth(): { connected: boolean; streamCount: number; errorCount: number };
}

/**
 * WebSocket streaming transport for real-time log streaming
 */
export class WebSocketStreamingTransport implements StreamingTransport {
  private ws: WebSocket | null = null;
  private subscribers: Set<(entry: LogEntry) => void> = new Set();
  private buffer: LogEntry[] = [];
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private streamCount = 0;
  private errorCount = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    private url: string,
    private options: {
      maxBufferSize?: number;
      heartbeatInterval?: number;
      reconnectDelay?: number;
      maxReconnectAttempts?: number;
    } = {}
  ) {
    this.options = {
      maxBufferSize: 1000,
      heartbeatInterval: 30000,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      ...options
    };
  }

  private async connect(): Promise<void> {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      return;
    }

    this.connectionState = 'connecting';

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('🔗 WebSocket streaming transport connected');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushBuffer();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'log') {
            this.notifySubscribers(data.entry);
          } else if (data.type === 'heartbeat') {
            // Server heartbeat received
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          this.errorCount++;
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket streaming transport disconnected:', event.code, event.reason);
        this.connectionState = 'disconnected';
        this.stopHeartbeat();
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket streaming transport error:', error);
        this.connectionState = 'error';
        this.errorCount++;
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.connectionState = 'error';
      this.errorCount++;
      throw error;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling WebSocket reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ WebSocket reconnect failed:', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
      }
    }, this.options.heartbeatInterval!);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0 || this.connectionState !== 'connected') {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    for (const entry of entries) {
      await this.sendEntry(entry);
    }
  }

  private async sendEntry(entry: LogEntry): Promise<void> {
    if (this.connectionState !== 'connected' || !this.ws) {
      this.bufferEntry(entry);
      return;
    }

    try {
      const message = {
        type: 'log',
        entry: entry,
        timestamp: new Date().toISOString()
      };

      this.ws.send(JSON.stringify(message));
      this.streamCount++;
      this.notifySubscribers(entry);
    } catch (error) {
      console.error('❌ Failed to send log entry via WebSocket:', error);
      this.errorCount++;
      this.bufferEntry(entry);
    }
  }

  private bufferEntry(entry: LogEntry): void {
    this.buffer.push(entry);
    
    // Prevent buffer overflow
    if (this.buffer.length > this.options.maxBufferSize!) {
      this.buffer.shift(); // Remove oldest entry
    }
  }

  private notifySubscribers(entry: LogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('❌ Error in log subscriber callback:', error);
      }
    });
  }

  async write(entry: LogEntry): Promise<void> {
    if (this.connectionState === 'disconnected') {
      await this.connect();
    }

    await this.sendEntry(entry);
  }

  async flush(): Promise<void> {
    await this.flushBuffer();
  }

  async close(): Promise<void> {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Transport closing');
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
    this.subscribers.clear();
  }

  subscribe(callback: (entry: LogEntry) => void): () => void {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getHealth(): { connected: boolean; streamCount: number; errorCount: number } {
    return {
      connected: this.connectionState === 'connected',
      streamCount: this.streamCount,
      errorCount: this.errorCount
    };
  }
}

/**
 * Server-Sent Events (SSE) streaming transport
 */
export class SSEStreamingTransport implements StreamingTransport {
  private eventSource: EventSource | null = null;
  private subscribers: Set<(entry: LogEntry) => void> = new Set();
  private buffer: LogEntry[] = [];
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private streamCount = 0;
  private errorCount = 0;

  constructor(
    private url: string,
    private options: {
      maxBufferSize?: number;
      withCredentials?: boolean;
    } = {}
  ) {
    this.options = {
      maxBufferSize: 1000,
      withCredentials: false,
      ...options
    };
  }

  private async connect(): Promise<void> {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      return;
    }

    this.connectionState = 'connecting';

    try {
      this.eventSource = new EventSource(this.url, {
        withCredentials: this.options.withCredentials
      });

      this.eventSource.onopen = () => {
        console.log('📡 SSE streaming transport connected');
        this.connectionState = 'connected';
        this.flushBuffer();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const entry: LogEntry = JSON.parse(event.data);
          this.notifySubscribers(entry);
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
          this.errorCount++;
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE streaming transport error:', error);
        this.connectionState = 'error';
        this.errorCount++;
      };

    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      this.connectionState = 'error';
      this.errorCount++;
      throw error;
    }
  }

  private async flushBuffer(): Promise<void> {
    // SSE is read-only, so we can't send buffered entries
    // But we can notify subscribers of any buffered entries
    const entries = [...this.buffer];
    this.buffer = [];

    for (const entry of entries) {
      this.notifySubscribers(entry);
    }
  }

  private notifySubscribers(entry: LogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('❌ Error in log subscriber callback:', error);
      }
    });
  }

  async write(entry: LogEntry): Promise<void> {
    // SSE is read-only, so we buffer entries for local subscribers
    this.buffer.push(entry);
    this.streamCount++;
    
    if (this.buffer.length > this.options.maxBufferSize!) {
      this.buffer.shift();
    }

    this.notifySubscribers(entry);
  }

  async flush(): Promise<void> {
    await this.flushBuffer();
  }

  async close(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.connectionState = 'disconnected';
    this.subscribers.clear();
  }

  subscribe(callback: (entry: LogEntry) => void): () => void {
    this.subscribers.add(callback);
    
    // Auto-connect when first subscriber is added
    if (this.subscribers.size === 1 && this.connectionState === 'disconnected') {
      this.connect().catch(error => {
        console.error('❌ Failed to connect SSE transport:', error);
      });
    }
    
    return () => {
      this.subscribers.delete(callback);
      
      // Auto-disconnect when no subscribers
      if (this.subscribers.size === 0) {
        this.close();
      }
    };
  }

  getHealth(): { connected: boolean; streamCount: number; errorCount: number } {
    return {
      connected: this.connectionState === 'connected',
      streamCount: this.streamCount,
      errorCount: this.errorCount
    };
  }
}

/**
 * Console streaming transport with enhanced formatting
 */
export class ConsoleStreamingTransport implements StreamingTransport {
  private subscribers: Set<(entry: LogEntry) => void> = new Set();
  private streamCount = 0;
  private errorCount = 0;

  constructor(
    private options: {
      useColors?: boolean;
      includeTimestamp?: boolean;
      includeCorrelation?: boolean;
    } = {}
  ) {
    this.options = {
      useColors: true,
      includeTimestamp: true,
      includeCorrelation: true,
      ...options
    };
  }

  private getColorCode(level: LogLevel): string {
    if (!this.options.useColors) return '';
    
    switch (level) {
      case LogLevel.TRACE: return '\x1b[90m'; // Gray
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.FATAL: return '\x1b[35m'; // Magenta
      default: return '';
    }
  }

  private formatEntry(entry: LogEntry): string {
    const reset = this.options.useColors ? '\x1b[0m' : '';
    const color = this.getColorCode(entry.level);
    
    let formatted = `${color}[${LogLevel[entry.level]}]${reset} `;
    
    if (this.options.includeTimestamp) {
      formatted += `${new Date(entry.timestamp).toISOString()} `;
    }
    
    if (this.options.includeCorrelation && entry.context.correlationId) {
      formatted += `[${entry.context.correlationId.slice(0, 8)}] `;
    }
    
    formatted += entry.message;
    
    if (entry.metadata) {
      formatted += ` ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      formatted += `\n${color}Error: ${entry.error.message}${reset}`;
      if (entry.error.stack) {
        formatted += `\n${entry.error.stack}`;
      }
    }
    
    return formatted;
  }

  async write(entry: LogEntry): Promise<void> {
    try {
      const formatted = this.formatEntry(entry);
      
      // Use appropriate console method based on log level
      switch (entry.level) {
        case LogLevel.TRACE:
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formatted);
          break;
        default:
          console.log(formatted);
      }
      
      this.streamCount++;
      this.notifySubscribers(entry);
    } catch (error) {
      console.error('❌ Error writing to console:', error);
      this.errorCount++;
    }
  }

  private notifySubscribers(entry: LogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('❌ Error in log subscriber callback:', error);
      }
    });
  }

  async flush(): Promise<void> {
    // Console doesn't need flushing
  }

  async close(): Promise<void> {
    this.subscribers.clear();
  }

  subscribe(callback: (entry: LogEntry) => void): () => void {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getHealth(): { connected: boolean; streamCount: number; errorCount: number } {
    return {
      connected: true,
      streamCount: this.streamCount,
      errorCount: this.errorCount
    };
  }
}

/**
 * Real-time log buffer for client-side streaming
 */
export class RealTimeLogBuffer implements StreamingTransport {
  private buffer: LogEntry[] = [];
  private subscribers: Set<(entry: LogEntry) => void> = new Set();
  private maxBufferSize: number;
  private streamCount = 0;
  private errorCount = 0;

  constructor(maxBufferSize = 1000) {
    this.maxBufferSize = maxBufferSize;
  }

  async write(entry: LogEntry): Promise<void> {
    try {
      // Add to buffer
      this.buffer.push(entry);
      
      // Maintain buffer size
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift(); // Remove oldest entry
      }
      
      this.streamCount++;
      this.notifySubscribers(entry);
    } catch (error) {
      console.error('❌ Error writing to buffer:', error);
      this.errorCount++;
    }
  }

  private notifySubscribers(entry: LogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('❌ Error in log subscriber callback:', error);
      }
    });
  }

  async flush(): Promise<void> {
    // Buffer doesn't need flushing
  }

  async close(): Promise<void> {
    this.buffer = [];
    this.subscribers.clear();
  }

  subscribe(callback: (entry: LogEntry) => void): () => void {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getHealth(): { connected: boolean; streamCount: number; errorCount: number } {
    return {
      connected: true,
      streamCount: this.streamCount,
      errorCount: this.errorCount
    };
  }

  // Additional methods for buffer management
  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  getBufferSince(timestamp: string): LogEntry[] {
    return this.buffer.filter(entry => entry.timestamp >= timestamp);
  }

  getBufferByLevel(level: LogLevel): LogEntry[] {
    return this.buffer.filter(entry => entry.level >= level);
  }

  getBufferByCorrelationId(correlationId: string): LogEntry[] {
    return this.buffer.filter(entry => entry.context.correlationId === correlationId);
  }

  clearBuffer(): void {
    this.buffer = [];
  }

  getBufferStats(): {
    size: number;
    maxSize: number;
    oldestEntry?: string;
    newestEntry?: string;
    levelCounts: Record<string, number>;
  } {
    const levelCounts: Record<string, number> = {};
    
    this.buffer.forEach(entry => {
      const levelName = LogLevel[entry.level];
      levelCounts[levelName] = (levelCounts[levelName] || 0) + 1;
    });

    return {
      size: this.buffer.length,
      maxSize: this.maxBufferSize,
      oldestEntry: this.buffer[0]?.timestamp,
      newestEntry: this.buffer[this.buffer.length - 1]?.timestamp,
      levelCounts
    };
  }
}

/**
 * Multiplexing streaming transport that sends to multiple transports
 */
export class MultiplexStreamingTransport implements StreamingTransport {
  private transports: StreamingTransport[] = [];
  private subscribers: Set<(entry: LogEntry) => void> = new Set();

  constructor(transports: StreamingTransport[]) {
    this.transports = transports;
  }

  addTransport(transport: StreamingTransport): void {
    this.transports.push(transport);
  }

  removeTransport(transport: StreamingTransport): void {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
    }
  }

  async write(entry: LogEntry): Promise<void> {
    // Send to all transports in parallel
    const promises = this.transports.map(transport => 
      transport.write(entry).catch(error => {
        console.error('❌ Error writing to transport:', error);
      })
    );
    
    await Promise.allSettled(promises);
    this.notifySubscribers(entry);
  }

  private notifySubscribers(entry: LogEntry): void {
    this.subscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('❌ Error in log subscriber callback:', error);
      }
    });
  }

  async flush(): Promise<void> {
    const promises = this.transports.map(transport => 
      transport.flush().catch(error => {
        console.error('❌ Error flushing transport:', error);
      })
    );
    
    await Promise.allSettled(promises);
  }

  async close(): Promise<void> {
    const promises = this.transports.map(transport => 
      transport.close().catch(error => {
        console.error('❌ Error closing transport:', error);
      })
    );
    
    await Promise.allSettled(promises);
    this.subscribers.clear();
  }

  subscribe(callback: (entry: LogEntry) => void): () => void {
    this.subscribers.add(callback);
    
    // Subscribe to all transports
    const unsubscribes = this.transports.map(transport => 
      transport.subscribe(callback)
    );
    
    return () => {
      this.subscribers.delete(callback);
      unsubscribes.forEach(unsub => unsub());
    };
  }

  getHealth(): { connected: boolean; streamCount: number; errorCount: number } {
    const healthStats = this.transports.map(transport => transport.getHealth());
    
    return {
      connected: healthStats.some(health => health.connected),
      streamCount: healthStats.reduce((sum, health) => sum + health.streamCount, 0),
      errorCount: healthStats.reduce((sum, health) => sum + health.errorCount, 0)
    };
  }
}

/**
 * Enhanced streaming logger factory
 */
export function createStreamingLogger(options: {
  enableConsole?: boolean;
  enableBuffer?: boolean;
  bufferSize?: number;
  consoleOptions?: {
    useColors?: boolean;
    includeTimestamp?: boolean;
    includeCorrelation?: boolean;
  };
}): StreamingTransport {
  const transports: StreamingTransport[] = [];

  if (options.enableConsole !== false) {
    transports.push(new ConsoleStreamingTransport(options.consoleOptions));
  }

  if (options.enableBuffer !== false) {
    transports.push(new RealTimeLogBuffer(options.bufferSize));
  }

  if (transports.length === 1) {
    return transports[0];
  }

  return new MultiplexStreamingTransport(transports);
} 
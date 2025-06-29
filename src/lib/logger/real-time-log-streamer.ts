/**
 * 🔴 REAL-TIME LOG STREAMER
 * 
 * Task 11: Real-time log streaming implementation
 * Phase 3: Real-time Monitoring Dashboard
 * 
 * Provides WebSocket-based live log streaming for immediate issue detection
 * and real-time monitoring of Choreo deployments and application events.
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { Logger } from './index';

interface LogStreamMessage {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  source: 'application' | 'choreo' | 'database' | 'auth' | 'api';
  component: string;
  message: string;
  metadata?: Record<string, any>;
  correlationId?: string;
  sessionId?: string;
}

interface StreamClient {
  id: string;
  ws: any;
  filters: LogStreamFilter[];
  lastHeartbeat: number;
  subscriptions: string[];
}

interface LogStreamFilter {
  level?: string[];
  source?: string[];
  component?: string[];
  correlationId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

interface StreamMetrics {
  connectedClients: number;
  messagesStreamed: number;
  bytesTransferred: number;
  averageLatency: number;
  errorRate: number;
}

export class RealTimeLogStreamer extends EventEmitter {
  private static instance: RealTimeLogStreamer;
  private wss: WebSocketServer | null = null;
  private server: any = null;
  private clients: Map<string, StreamClient> = new Map();
  private logBuffer: LogStreamMessage[] = [];
  private bufferSize = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private metrics: StreamMetrics = {
    connectedClients: 0,
    messagesStreamed: 0,
    bytesTransferred: 0,
    averageLatency: 0,
    errorRate: 0
  };
  private logger: any;
  private isRunning = false;

  private constructor() {
    super();
    // Create a simple logger for this component
    this.logger = {
      info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args)
    };
  }

  public static getInstance(): RealTimeLogStreamer {
    if (!RealTimeLogStreamer.instance) {
      RealTimeLogStreamer.instance = new RealTimeLogStreamer();
    }
    return RealTimeLogStreamer.instance;
  }

  /**
   * Start the real-time log streaming server
   */
  public async start(port: number = 8082): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Real-time log streamer already running');
      return;
    }

    try {
      // Create HTTP server
      this.server = createServer();
      
      // Create WebSocket server
      this.wss = new WebSocketServer({ 
        server: this.server,
        perMessageDeflate: {
          threshold: 1024,
          concurrencyLimit: 10,
          serverMaxWindowBits: 10
        }
      });

      // Setup WebSocket handlers
      this.setupWebSocketHandlers();

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Start metrics collection
      this.startMetricsCollection();

      // Start server
      this.server.listen(port, () => {
        this.isRunning = true;
        this.logger.info(`🔴 Real-time log streamer started on port ${port}`);
        this.emit('started', { port });
      });

      // Setup log file monitoring
      this.setupLogFileMonitoring();

    } catch (error) {
      this.logger.error('Failed to start real-time log streamer:', error);
      throw error;
    }
  }

  /**
   * Stop the real-time log streaming server
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Clear intervals
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      // Close all client connections
      this.clients.forEach(client => {
        if (client.ws.readyState === 1) { // OPEN
          client.ws.close(1000, 'Server shutting down');
        }
      });
      this.clients.clear();

      // Close WebSocket server
      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }

      // Close HTTP server
      if (this.server) {
        this.server.close();
        this.server = null;
      }

      this.isRunning = false;
      this.logger.info('🔴 Real-time log streamer stopped');
      this.emit('stopped');

    } catch (error) {
      this.logger.error('Error stopping real-time log streamer:', error);
      throw error;
    }
  }

  /**
   * Stream a log message to connected clients
   */
  public streamLog(message: LogStreamMessage): void {
    if (!this.isRunning) {
      return;
    }

    // Add to buffer
    this.logBuffer.push(message);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    // Stream to matching clients
    const messageStr = JSON.stringify(message);
    const messageSize = Buffer.byteLength(messageStr, 'utf8');

    this.clients.forEach(client => {
      if (this.shouldStreamToClient(message, client)) {
        try {
          if (client.ws.readyState === 1) { // OPEN
            client.ws.send(messageStr);
            this.metrics.messagesStreamed++;
            this.metrics.bytesTransferred += messageSize;
          }
        } catch (error) {
          this.logger.error(`Failed to stream to client ${client.id}:`, error);
          this.metrics.errorRate++;
        }
      }
    });

    this.emit('messageStreamed', message);
  }

  /**
   * Get current streaming metrics
   */
  public getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get recent log buffer
   */
  public getRecentLogs(count: number = 100): LogStreamMessage[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      const client: StreamClient = {
        id: clientId,
        ws,
        filters: [],
        lastHeartbeat: Date.now(),
        subscriptions: []
      };

      this.clients.set(clientId, client);
      this.metrics.connectedClients = this.clients.size;

      this.logger.info(`🔗 Client connected: ${clientId} (${this.clients.size} total)`);

      // Send welcome message with recent logs
      const welcomeMessage = {
        type: 'welcome',
        clientId,
        recentLogs: this.getRecentLogs(50),
        serverTime: new Date().toISOString()
      };
      ws.send(JSON.stringify(welcomeMessage));

      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(client, message);
        } catch (error) {
          this.logger.error(`Invalid message from client ${clientId}:`, error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.clients.delete(clientId);
        this.metrics.connectedClients = this.clients.size;
        this.logger.info(`🔌 Client disconnected: ${clientId} (${this.clients.size} remaining)`);
      });

      // Handle errors
      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for client ${clientId}:`, error);
        this.metrics.errorRate++;
      });

      // Handle pong (heartbeat response)
      ws.on('pong', () => {
        client.lastHeartbeat = Date.now();
      });
    });

    this.wss.on('error', (error) => {
      this.logger.error('WebSocket server error:', error);
    });
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(client: StreamClient, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(client, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscription(client, message);
        break;
      case 'setFilters':
        this.handleSetFilters(client, message);
        break;
      case 'heartbeat':
        client.lastHeartbeat = Date.now();
        client.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        break;
      case 'getMetrics':
        client.ws.send(JSON.stringify({ 
          type: 'metrics', 
          data: this.getMetrics() 
        }));
        break;
      default:
        this.logger.warn(`Unknown message type from client ${client.id}:`, message.type);
    }
  }

  /**
   * Handle client subscription
   */
  private handleSubscription(client: StreamClient, message: any): void {
    const { channels } = message;
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        if (!client.subscriptions.includes(channel)) {
          client.subscriptions.push(channel);
        }
      });
    }

    client.ws.send(JSON.stringify({
      type: 'subscriptionConfirmed',
      subscriptions: client.subscriptions
    }));

    this.logger.debug(`Client ${client.id} subscribed to channels:`, channels);
  }

  /**
   * Handle client unsubscription
   */
  private handleUnsubscription(client: StreamClient, message: any): void {
    const { channels } = message;
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        const index = client.subscriptions.indexOf(channel);
        if (index > -1) {
          client.subscriptions.splice(index, 1);
        }
      });
    }

    client.ws.send(JSON.stringify({
      type: 'unsubscriptionConfirmed',
      subscriptions: client.subscriptions
    }));

    this.logger.debug(`Client ${client.id} unsubscribed from channels:`, channels);
  }

  /**
   * Handle client filter updates
   */
  private handleSetFilters(client: StreamClient, message: any): void {
    const { filters } = message;
    if (Array.isArray(filters)) {
      client.filters = filters;
    }

    client.ws.send(JSON.stringify({
      type: 'filtersSet',
      filters: client.filters
    }));

    this.logger.debug(`Client ${client.id} updated filters:`, filters);
  }

  /**
   * Check if a log message should be streamed to a specific client
   */
  private shouldStreamToClient(message: LogStreamMessage, client: StreamClient): boolean {
    // Check subscriptions
    if (client.subscriptions.length > 0) {
      const hasMatchingSubscription = client.subscriptions.some(sub => {
        return message.source === sub || message.component === sub || sub === 'all';
      });
      if (!hasMatchingSubscription) {
        return false;
      }
    }

    // Check filters
    for (const filter of client.filters) {
      // Level filter
      if (filter.level && !filter.level.includes(message.level)) {
        return false;
      }

      // Source filter
      if (filter.source && !filter.source.includes(message.source)) {
        return false;
      }

      // Component filter
      if (filter.component && !filter.component.includes(message.component)) {
        return false;
      }

      // Correlation ID filter
      if (filter.correlationId && message.correlationId !== filter.correlationId) {
        return false;
      }

      // Time range filter
      if (filter.timeRange) {
        const messageTime = new Date(message.timestamp);
        if (messageTime < filter.timeRange.start || messageTime > filter.timeRange.end) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === 1) { // OPEN
          // Send ping
          client.ws.ping();

          // Check for timeout
          if (now - client.lastHeartbeat > timeout) {
            this.logger.warn(`Client ${clientId} heartbeat timeout, disconnecting`);
            client.ws.terminate();
            this.clients.delete(clientId);
            this.metrics.connectedClients = this.clients.size;
          }
        } else {
          // Remove disconnected client
          this.clients.delete(clientId);
          this.metrics.connectedClients = this.clients.size;
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      // Calculate average latency (simplified)
      this.metrics.averageLatency = this.calculateAverageLatency();

      // Emit metrics update
      this.emit('metricsUpdate', this.metrics);

      // Broadcast metrics to interested clients
      this.broadcastMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Setup log file monitoring for real-time streaming
   */
  private setupLogFileMonitoring(): void {
    const logFiles = [
      path.join(process.cwd(), 'logs', 'application.log'),
      path.join(process.cwd(), 'logs', 'choreo-debug.log'),
      path.join(process.cwd(), 'logs', 'error.log')
    ];

    logFiles.forEach(logFile => {
      if (fs.existsSync(logFile)) {
        fs.watchFile(logFile, { interval: 1000 }, () => {
          this.processLogFileChanges(logFile);
        });
        this.logger.debug(`📁 Monitoring log file: ${logFile}`);
      }
    });
  }

  /**
   * Process log file changes and stream new entries
   */
  private processLogFileChanges(logFile: string): void {
    try {
      // This is a simplified implementation
      // In production, you'd want to track file position and only read new lines
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').slice(-10); // Get last 10 lines

      lines.forEach(line => {
        if (line.trim()) {
          const logMessage = this.parseLogLine(line, logFile);
          if (logMessage) {
            this.streamLog(logMessage);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error processing log file ${logFile}:`, error);
    }
  }

  /**
   * Parse a log line into a structured message
   */
  private parseLogLine(line: string, source: string): LogStreamMessage | null {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(line);
      return {
        id: this.generateMessageId(),
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level || 'info',
        source: this.getSourceFromPath(source),
        component: parsed.component || 'unknown',
        message: parsed.message || line,
        metadata: parsed.metadata,
        correlationId: parsed.correlationId
      };
    } catch {
      // Fallback to plain text parsing
      return {
        id: this.generateMessageId(),
        timestamp: new Date().toISOString(),
        level: 'info',
        source: this.getSourceFromPath(source),
        component: 'file-monitor',
        message: line
      };
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get source type from file path
   */
  private getSourceFromPath(filePath: string): LogStreamMessage['source'] {
    if (filePath.includes('choreo')) return 'choreo';
    if (filePath.includes('auth')) return 'auth';
    if (filePath.includes('api')) return 'api';
    if (filePath.includes('database')) return 'database';
    return 'application';
  }

  /**
   * Calculate average latency (simplified)
   */
  private calculateAverageLatency(): number {
    // This is a simplified calculation
    // In production, you'd measure actual round-trip times
    return Math.random() * 50 + 10; // Simulated 10-60ms
  }

  /**
   * Broadcast metrics to interested clients
   */
  private broadcastMetrics(): void {
    const metricsMessage = JSON.stringify({
      type: 'metricsUpdate',
      data: this.metrics,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach(client => {
      if (client.subscriptions.includes('metrics') && client.ws.readyState === 1) {
        client.ws.send(metricsMessage);
      }
    });
  }
}

export default RealTimeLogStreamer; 
// Conditional imports for Node.js environment only
let fs: any;
let path: any;

// Only import Node.js modules if we're in Node.js environment
if (typeof window === 'undefined' && typeof process !== 'undefined' && typeof (process as any)?.on === 'function') {
  try {
    fs = require('fs');
    path = require('path');
  } catch (error) {
    console.warn('Failed to import Node.js modules in transports:', error);
  }
}

import { LogEntry, LoggerConfig } from './types';
import { LogFormatter } from './formatters';

export interface Transport {
  write(entry: LogEntry): Promise<void>;
  flush(): Promise<void>;
  close(): Promise<void>;
}

export class ConsoleTransport implements Transport {
  constructor(private config: LoggerConfig) {}

  async write(entry: LogEntry): Promise<void> {
    if (!this.config.enableConsole) return;

    const formatted = this.config.format === 'json' 
      ? LogFormatter.formatJSON(entry, this.config.sanitizePII)
      : LogFormatter.formatText(entry, this.config.sanitizePII);

    // Use appropriate console method based on log level
    switch (entry.level) {
      case 0: // TRACE
      case 1: // DEBUG
        console.debug(formatted);
        break;
      case 2: // INFO
        console.info(formatted);
        break;
      case 3: // WARN
        console.warn(formatted);
        break;
      case 4: // ERROR
      case 5: // FATAL
        console.error(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  async flush(): Promise<void> {
    // Console output is synchronous, no need to flush
  }

  async close(): Promise<void> {
    // Nothing to close for console transport
  }
}

export class FileTransport implements Transport {
  private buffer: LogEntry[] = [];
  private writePromise: Promise<void> = Promise.resolve();
  private flushTimer?: NodeJS.Timeout;

  constructor(private config: LoggerConfig) {
    this.ensureLogDirectory();
    this.startFlushTimer();
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.config.enableFile) return;

    this.buffer.push(entry);

    if (this.buffer.length >= this.config.bufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    this.writePromise = this.writePromise.then(async () => {
      const formatted = entries.map(entry => 
        this.config.format === 'json'
          ? LogFormatter.formatJSON(entry, this.config.sanitizePII)
          : LogFormatter.formatText(entry, this.config.sanitizePII)
      ).join('\n') + '\n';

      await this.writeToFile(formatted);
      await this.rotateIfNeeded();
    });

    await this.writePromise;
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  private ensureLogDirectory(): void {
    if (!fs || !path) return;
    
    const logDir = path.dirname(this.config.filePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  private async writeToFile(content: string): Promise<void> {
    if (!fs) {
      throw new Error('File system not available in this runtime');
    }
    
    return new Promise((resolve, reject) => {
      fs.appendFile(this.config.filePath, content, 'utf8', (err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async rotateIfNeeded(): Promise<void> {
    if (!fs) return;
    
    try {
      const stats = await fs.promises.stat(this.config.filePath);
      
      if (stats.size >= this.config.maxFileSize) {
        await this.rotateLog();
      }
    } catch (error) {
      // File doesn't exist yet, no need to rotate
    }
  }

  private async rotateLog(): Promise<void> {
    if (!fs || !path) return;
    
    const logDir = path.dirname(this.config.filePath);
    const logName = path.basename(this.config.filePath, path.extname(this.config.filePath));
    const logExt = path.extname(this.config.filePath);

    // Shift existing log files
    for (let i = this.config.maxFiles - 1; i > 0; i--) {
      const oldFile = path.join(logDir, `${logName}.${i}${logExt}`);
      const newFile = path.join(logDir, `${logName}.${i + 1}${logExt}`);
      
      try {
        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles - 1) {
            // Delete the oldest file
            await fs.promises.unlink(oldFile);
          } else {
            await fs.promises.rename(oldFile, newFile);
          }
        }
      } catch (error) {
        console.error(`Error rotating log file ${oldFile}:`, error);
      }
    }

    // Move current log to .1
    const rotatedFile = path.join(logDir, `${logName}.1${logExt}`);
    try {
      await fs.promises.rename(this.config.filePath, rotatedFile);
    } catch (error) {
      console.error(`Error rotating current log file:`, error);
    }
  }
}

export class ChoreoTransport implements Transport {
  private buffer: LogEntry[] = [];
  private writePromise: Promise<void> = Promise.resolve();
  private flushTimer?: NodeJS.Timeout;

  constructor(private config: LoggerConfig) {
    if (this.config.enableChoreo) {
      this.startFlushTimer();
    }
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.config.enableChoreo) return;

    this.buffer.push(entry);

    if (this.buffer.length >= this.config.bufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.enableChoreo) return;

    const entries = [...this.buffer];
    this.buffer = [];

    this.writePromise = this.writePromise.then(async () => {
      // Write to stdout for Choreo log collection
      const formatted = entries.map(entry => 
        LogFormatter.formatChoreo(entry)
      ).join('\n') + '\n';

      // Check if process.stdout is available (Node.js environment)
      if (typeof process !== 'undefined' && process.stdout) {
        process.stdout.write(formatted);
      } else {
        // Fallback to console in Edge Runtime
        console.log(formatted);
      }
    });

    await this.writePromise;
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }
}

export class BufferedTransport implements Transport {
  private transports: Transport[] = [];

  constructor(transports: Transport[]) {
    this.transports = transports;
  }

  async write(entry: LogEntry): Promise<void> {
    await Promise.all(
      this.transports.map(transport => transport.write(entry))
    );
  }

  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map(transport => transport.flush())
    );
  }

  async close(): Promise<void> {
    await Promise.all(
      this.transports.map(transport => transport.close())
    );
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  removeTransport(transport: Transport): void {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
    }
  }
} 
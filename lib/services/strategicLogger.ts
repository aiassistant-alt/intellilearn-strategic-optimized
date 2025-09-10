/**
 * ^StrategicLogger
 * Author: Luis Arturo Parra - Telmo AI  
 * Created: 2025-09-10
 * Last Modified: 2025-09-10
 * Context: Strategic logging system for Nova Sonic to prevent browser freezing
 * Usage: Replaces scattered console.log calls with buffered, categorized logging
 * Enhancement Proposal: Add telemetry, log shipping to CloudWatch, performance metrics
 * 
 * Problem Solved: Nova Sonic was logging ~100 console.log per audio packet causing browser freeze
 * Solution: Buffered logging with configurable levels, batching, and strategic output
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
export type LogCategory = 'VAD' | 'NOVA' | 'AUDIO' | 'STREAM' | 'SECURITY' | 'PERFORMANCE' | 'SYSTEM';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  sessionId?: string;
}

interface LoggerConfig {
  // Logging levels (higher number = more verbose)
  level: LogLevel;
  
  // Buffer management to prevent console spam
  bufferSize: number;
  flushInterval: number; // ms
  
  // Production settings
  enableConsole: boolean;
  enableRemote: boolean;
  
  // Performance settings  
  maxEntriesPerFlush: number;
  suppressRepeated: boolean;
}

class StrategicLogger {
  /**
   * Context: Singleton logger for Nova Sonic platform
   * Last Modified: 2025-09-10 by Luis Arturo Parra
   * Usage: Prevents browser freeze from excessive console.log in audio processing
   * Enhancement: Add CloudWatch integration, session recording, performance analytics
   */
  
  private static instance: StrategicLogger;
  private config: LoggerConfig;
  private buffer: LogEntry[];
  private flushTimer?: NodeJS.Timeout;
  private lastMessages: Map<string, number> = new Map(); // Suppress repeated messages
  
  private readonly levelPriority: Record<LogLevel, number> = {
    'DEBUG': 0,
    'INFO': 1, 
    'WARN': 2,
    'ERROR': 3,
    'CRITICAL': 4
  };
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    /**
     * Context: Initialize strategic logger with production-ready defaults
     * Last Modified: 2025-09-10 by Luis Arturo Parra  
     * Usage: Configured for Nova Sonic audio processing without console spam
     * Enhancement: Auto-detect environment, dynamic level adjustment based on errors
     */
    
    this.config = {
      level: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO',
      bufferSize: 100, // Buffer up to 100 entries before forced flush
      flushInterval: 2000, // Flush every 2 seconds max
      enableConsole: true,
      enableRemote: false, // TODO: CloudWatch integration
      maxEntriesPerFlush: 20, // Max 20 logs per flush to prevent spam
      suppressRepeated: true,
      ...config
    };
    
    this.buffer = [];
    this.startFlushTimer();
  }
  
  public static getInstance(config?: Partial<LoggerConfig>): StrategicLogger {
    /**
     * Context: Singleton pattern for consistent logging across Nova Sonic
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Single logger instance prevents memory leaks and conflicting configs
     * Enhancement: Add logger factory for different modules (VAD, Stream, Audio)
     */
    
    if (!StrategicLogger.instance) {
      StrategicLogger.instance = new StrategicLogger(config);
    }
    return StrategicLogger.instance;
  }
  
  private startFlushTimer(): void {
    /**
     * Context: Automatic buffer flushing to prevent memory buildup
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Ensures logs are output regularly without blocking audio processing
     * Enhancement: Adaptive flushing based on log volume and system load
     */
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
  
  private shouldLog(level: LogLevel): boolean {
    /**
     * Context: Level-based filtering to reduce noise in production
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Prevents debug spam in production while allowing errors through
     * Enhancement: Dynamic level adjustment based on error rates
     */
    
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }
  
  private addToBuffer(entry: LogEntry): void {
    /**
     * Context: Buffered logging to prevent console.log spam during audio processing
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Critical for Nova Sonic - prevents browser freeze from rapid audio logs
     * Enhancement: Circular buffer, compression for repeated messages
     */
    
    // Suppress repeated messages if enabled
    if (this.config.suppressRepeated) {
      const messageKey = `${entry.category}:${entry.message}`;
      const lastTime = this.lastMessages.get(messageKey);
      const now = Date.now();
      
      if (lastTime && (now - lastTime) < 1000) { // Suppress if same message within 1s
        return;
      }
      this.lastMessages.set(messageKey, now);
    }
    
    this.buffer.push(entry);
    
    // Force flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }
  
  private flush(): void {
    /**
     * Context: Strategic output of buffered logs to console
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Batch output prevents console spam while maintaining debuggability
     * Enhancement: Send to CloudWatch, format for log aggregation systems
     */
    
    if (this.buffer.length === 0) return;
    
    const toFlush = this.buffer.splice(0, this.config.maxEntriesPerFlush);
    
    if (this.config.enableConsole) {
      // Group logs by category for better readability
      const grouped = toFlush.reduce((acc, entry) => {
        if (!acc[entry.category]) acc[entry.category] = [];
        acc[entry.category].push(entry);
        return acc;
      }, {} as Record<LogCategory, LogEntry[]>);
      
      Object.entries(grouped).forEach(([category, entries]) => {
        if (entries.length === 1) {
          const entry = entries[0];
          this.outputToConsole(entry);
        } else {
          console.groupCollapsed(`📊 ${category} (${entries.length} entries)`);
          entries.forEach(entry => this.outputToConsole(entry));
          console.groupEnd();
        }
      });
    }
    
    // TODO: Remote logging to CloudWatch
    if (this.config.enableRemote) {
      this.sendToRemote(toFlush);
    }
  }
  
  private outputToConsole(entry: LogEntry): void {
    /**
     * Context: Formatted console output with emojis and context
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Maintains existing Nova Sonic log format while being strategic
     * Enhancement: Color coding, stack traces for errors, performance timing
     */
    
    const timestamp = new Date(entry.timestamp).toISOString().slice(11, 23);
    const prefix = this.getCategoryEmoji(entry.category);
    const message = `${prefix} [${entry.category}] ${entry.message}`;
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(`🔍 ${timestamp}`, message, entry.data || '');
        break;
      case 'INFO':
        console.log(`ℹ️ ${timestamp}`, message, entry.data || '');
        break;
      case 'WARN':
        console.warn(`⚠️ ${timestamp}`, message, entry.data || '');
        break;
      case 'ERROR':
        console.error(`❌ ${timestamp}`, message, entry.data || '');
        break;
      case 'CRITICAL':
        console.error(`🚨 ${timestamp}`, message, entry.data || '');
        break;
    }
  }
  
  private getCategoryEmoji(category: LogCategory): string {
    /**
     * Context: Visual categorization for rapid log scanning  
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Maintains Nova Sonic's emoji-based log identification
     * Enhancement: User-customizable emoji themes, category-specific colors
     */
    
    const emojis: Record<LogCategory, string> = {
      'VAD': '🎤',
      'NOVA': '🗣️',
      'AUDIO': '🔊', 
      'STREAM': '📥',
      'SECURITY': '🔐',
      'PERFORMANCE': '⚡',
      'SYSTEM': '🖥️'
    };
    return emojis[category] || '📝';
  }
  
  private sendToRemote(entries: LogEntry[]): void {
    /**
     * Context: Future CloudWatch integration for production monitoring
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Placeholder for remote log shipping and analytics
     * Enhancement: AWS CloudWatch Logs, custom metrics, alerts on errors
     */
    
    // TODO: Implement CloudWatch Logs integration
    // AWS SDK v3 with log groups per environment
    console.debug('📡 Would send to CloudWatch:', entries.length, 'entries');
  }
  
  // Public logging methods
  public vad(message: string, data?: any, sessionId?: string): void {
    /**
     * Context: Voice Activity Detection logging
     * Last Modified: 2025-09-10 by Luis Arturo Parra  
     * Usage: Strategic VAD logging without console spam during audio processing
     * Enhancement: RMS histograms, silence pattern analysis, accuracy metrics
     */
    if (this.shouldLog('DEBUG')) {
      this.addToBuffer({
        timestamp: Date.now(),
        level: 'DEBUG',
        category: 'VAD', 
        message,
        data,
        sessionId
      });
    }
  }
  
  public nova(message: string, data?: any, sessionId?: string): void {
    /**
     * Context: Nova Sonic protocol and streaming events
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Tracks Nova Sonic state changes without browser freeze
     * Enhancement: Turn timing analysis, response quality metrics, error patterns
     */
    if (this.shouldLog('INFO')) {
      this.addToBuffer({
        timestamp: Date.now(),
        level: 'INFO',
        category: 'NOVA',
        message,
        data,
        sessionId
      });
    }
  }
  
  public audio(message: string, data?: any, sessionId?: string): void {
    /**
     * Context: Audio processing and PCM16 handling
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Audio pipeline monitoring without performance impact
     * Enhancement: Audio quality metrics, latency tracking, buffer health
     */
    if (this.shouldLog('DEBUG')) {
      this.addToBuffer({
        timestamp: Date.now(),
        level: 'DEBUG',
        category: 'AUDIO',
        message,
        data,
        sessionId
      });
    }
  }
  
  public stream(message: string, data?: any, sessionId?: string): void {
    /**
     * Context: Bidirectional streaming events and data flow
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Stream health monitoring without overwhelming console
     * Enhancement: Throughput metrics, backpressure detection, error recovery
     */
    if (this.shouldLog('INFO')) {
      this.addToBuffer({
        timestamp: Date.now(),
        level: 'INFO', 
        category: 'STREAM',
        message,
        data,
        sessionId
      });
    }
  }
  
  public error(message: string, error?: any, sessionId?: string): void {
    /**
     * Context: Error tracking and debugging information
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Immediate error visibility for critical Nova Sonic issues
     * Enhancement: Error analytics, automatic retry suggestions, escalation
     */
    this.addToBuffer({
      timestamp: Date.now(),
      level: 'ERROR',
      category: 'SYSTEM',
      message,
      data: error,
      sessionId
    });
    
    // Force immediate flush for errors
    this.flush();
  }
  
  public performance(message: string, metrics?: any, sessionId?: string): void {
    /**
     * Context: Performance monitoring and optimization data
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Track Nova Sonic performance without impacting performance
     * Enhancement: Performance baselines, regression detection, optimization hints
     */
    if (this.shouldLog('INFO')) {
      this.addToBuffer({
        timestamp: Date.now(),
        level: 'INFO',
        category: 'PERFORMANCE',
        message,
        data: metrics,
        sessionId
      });
    }
  }
  
  public destroy(): void {
    /**
     * Context: Cleanup logger resources on app shutdown
     * Last Modified: 2025-09-10 by Luis Arturo Parra
     * Usage: Prevents memory leaks and ensures final log flush
     * Enhancement: Graceful shutdown with log completion guarantee
     */
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
    this.buffer = [];
  }
}

// Export singleton instance
export const logger = StrategicLogger.getInstance();

// Export factory for custom configurations
export { StrategicLogger };


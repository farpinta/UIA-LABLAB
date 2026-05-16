/**
 * Logging Utility
 * Centralized logging with different levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    console.info(this.formatMessage(LogLevel.INFO, message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const errorMeta = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...meta }
      : { error, ...meta };
    
    console.error(this.formatMessage(LogLevel.ERROR, message, errorMeta));
  }

  // Sanitize sensitive data before logging
  sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

export const logger = new Logger();

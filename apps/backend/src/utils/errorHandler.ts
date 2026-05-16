/**
 * Error Handling Utilities
 * Centralized error handling for the application
 */

import { FastifyReply } from 'fastify';
import { logger } from './logger';

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Common error types
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error') {
    super(message, 502, true);
  }
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error: Error | AppError, includeStack: boolean = false) {
  const isAppError = error instanceof AppError;
  
  return {
    success: false,
    error: error.message,
    statusCode: isAppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
    ...(includeStack && { stack: error.stack })
  };
}

/**
 * Global error handler for Fastify
 */
export function errorHandler(error: Error, reply: FastifyReply) {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Log the error
  if (isAppError && error.isOperational) {
    logger.warn('Operational error occurred', error, { statusCode });
  } else {
    logger.error('Unexpected error occurred', error, { statusCode });
  }

  // Send error response
  const response = formatErrorResponse(error, isDevelopment);
  
  reply.status(statusCode).send(response);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error;
    }
  };
}

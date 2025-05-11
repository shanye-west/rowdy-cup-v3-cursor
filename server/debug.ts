import { Request, Response, NextFunction } from 'express';

// Debug levels
export enum DebugLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE'
}

// Debug context
interface DebugContext {
  requestId?: string;
  userId?: number;
  username?: string;
  path?: string;
  method?: string;
  timestamp: string;
  duration?: number;
  sessionID?: string;
  cookie?: any;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

// Debug entry
interface DebugEntry {
  level: DebugLevel;
  message: string;
  context: DebugContext;
  data?: any;
  error?: Error;
}

// Performance metrics
interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  requestsByPath: Map<string, { count: number; totalTime: number }>;
  errorsByPath: Map<string, number>;
  lastError?: {
    timestamp: string;
    path: string;
    error: string;
  };
}

// Debug store for request tracking
const requestDebugStore = new Map<string, DebugEntry[]>();
const performanceMetrics: PerformanceMetrics = {
  totalRequests: 0,
  averageResponseTime: 0,
  requestsByPath: new Map(),
  errorsByPath: new Map()
};

// Generate a unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format debug entry for logging
function formatDebugEntry(entry: DebugEntry): string {
  const { level, message, context, data, error } = entry;
  const timestamp = new Date().toISOString();
  
  // Create a structured log object
  const logObject = {
    timestamp,
    level,
    requestId: context.requestId,
    message,
    userId: context.userId,
    username: context.username,
    path: context.path,
    method: context.method,
    duration: context.duration,
    sessionID: context.sessionID,
    memory: context.memoryUsage ? {
      heapUsed: `${(context.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(context.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(context.memoryUsage.external / 1024 / 1024).toFixed(2)}MB`
    } : undefined,
    data,
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : undefined
  };

  // For cloud platforms, output JSON for better parsing
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logObject);
  }

  // For local development, use a more readable format
  let output = `[${timestamp}] [${level}] [${context.requestId}] ${message}`;
  
  if (context.userId) output += ` [User: ${context.userId}]`;
  if (context.username) output += ` [Username: ${context.username}]`;
  if (context.path) output += ` [Path: ${context.path}]`;
  if (context.method) output += ` [Method: ${context.method}]`;
  if (context.duration) output += ` [Duration: ${context.duration}ms]`;
  
  if (context.memoryUsage) {
    const { heapUsed, heapTotal, external } = context.memoryUsage;
    output += `\nMemory: Heap Used: ${(heapUsed / 1024 / 1024).toFixed(2)}MB, ` +
              `Heap Total: ${(heapTotal / 1024 / 1024).toFixed(2)}MB, ` +
              `External: ${(external / 1024 / 1024).toFixed(2)}MB`;
  }
  
  if (data) output += `\nData: ${JSON.stringify(data, null, 2)}`;
  if (error) output += `\nError: ${error.stack || error.message}`;
  
  return output;
}

// Update performance metrics
function updatePerformanceMetrics(path: string, duration: number, isError: boolean = false) {
  performanceMetrics.totalRequests++;
  
  // Update path-specific metrics
  const pathMetrics = performanceMetrics.requestsByPath.get(path) || { count: 0, totalTime: 0 };
  pathMetrics.count++;
  pathMetrics.totalTime += duration;
  performanceMetrics.requestsByPath.set(path, pathMetrics);
  
  // Update error metrics
  if (isError) {
    const errorCount = performanceMetrics.errorsByPath.get(path) || 0;
    performanceMetrics.errorsByPath.set(path, errorCount + 1);
  }
  
  // Update average response time
  performanceMetrics.averageResponseTime = 
    (performanceMetrics.averageResponseTime * (performanceMetrics.totalRequests - 1) + duration) / 
    performanceMetrics.totalRequests;
}

// Debug logger
export const debug = {
  // Log levels
  error: (message: string, context: Partial<DebugContext>, data?: any, error?: Error) => {
    const entry: DebugEntry = {
      level: DebugLevel.ERROR,
      message,
      context: { 
        ...context, 
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage()
      },
      data,
      error
    };
    
    console.error(formatDebugEntry(entry));
    if (context.requestId) {
      const entries = requestDebugStore.get(context.requestId) || [];
      entries.push(entry);
      requestDebugStore.set(context.requestId, entries);
    }
  },
  
  warn: (message: string, context: Partial<DebugContext>, data?: any) => {
    const entry: DebugEntry = {
      level: DebugLevel.WARN,
      message,
      context: { 
        ...context, 
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage()
      },
      data
    };
    
    console.warn(formatDebugEntry(entry));
    if (context.requestId) {
      const entries = requestDebugStore.get(context.requestId) || [];
      entries.push(entry);
      requestDebugStore.set(context.requestId, entries);
    }
  },
  
  info: (message: string, context: Partial<DebugContext>, data?: any) => {
    const entry: DebugEntry = {
      level: DebugLevel.INFO,
      message,
      context: { 
        ...context, 
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage()
      },
      data
    };
    
    console.info(formatDebugEntry(entry));
    if (context.requestId) {
      const entries = requestDebugStore.get(context.requestId) || [];
      entries.push(entry);
      requestDebugStore.set(context.requestId, entries);
    }
  },
  
  debug: (message: string, context: Partial<DebugContext>, data?: any) => {
    const entry: DebugEntry = {
      level: DebugLevel.DEBUG,
      message,
      context: { 
        ...context, 
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage()
      },
      data
    };
    
    console.debug(formatDebugEntry(entry));
    if (context.requestId) {
      const entries = requestDebugStore.get(context.requestId) || [];
      entries.push(entry);
      requestDebugStore.set(context.requestId, entries);
    }
  },
  
  trace: (message: string, context: Partial<DebugContext>, data?: any) => {
    const entry: DebugEntry = {
      level: DebugLevel.TRACE,
      message,
      context: { 
        ...context, 
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage()
      },
      data
    };
    
    console.trace(formatDebugEntry(entry));
    if (context.requestId) {
      const entries = requestDebugStore.get(context.requestId) || [];
      entries.push(entry);
      requestDebugStore.set(context.requestId, entries);
    }
  },
  
  // Request tracking
  getRequestLogs: (requestId: string): DebugEntry[] => {
    return requestDebugStore.get(requestId) || [];
  },
  
  clearRequestLogs: (requestId: string) => {
    requestDebugStore.delete(requestId);
  },
  
  // Performance metrics
  getPerformanceMetrics: () => {
    return {
      ...performanceMetrics,
      requestsByPath: Object.fromEntries(performanceMetrics.requestsByPath),
      errorsByPath: Object.fromEntries(performanceMetrics.errorsByPath)
    };
  },
  
  // Debug middleware
  middleware: (req: Request, res: Response, next: NextFunction) => {
    const requestId = generateRequestId();
    req.requestId = requestId;
    const startTime = Date.now();
    
    const context: DebugContext = {
      requestId,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage()
    };
    
    if (req.user) {
      context.userId = req.user.id;
      context.username = req.user.username;
    }
    
    debug.info('Request started', context, {
      headers: req.headers,
      query: req.query,
      body: req.body
    });
    
    // Track response
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      
      debug.info('Request completed', {
        ...context,
        duration,
        memoryUsage: process.memoryUsage()
      }, {
        statusCode: res.statusCode,
        responseBody: body
      });
      
      updatePerformanceMetrics(req.path, duration, isError);
      
      if (isError) {
        performanceMetrics.lastError = {
          timestamp: new Date().toISOString(),
          path: req.path,
          error: typeof body === 'string' ? body : JSON.stringify(body)
        };
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  },
  
  // Health check endpoint
  healthCheck: (req: Request, res: Response) => {
    const metrics = debug.getPerformanceMetrics();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`
      },
      performance: {
        totalRequests: metrics.totalRequests,
        averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
        requestsByPath: metrics.requestsByPath,
        errorsByPath: metrics.errorsByPath,
        lastError: metrics.lastError
      }
    });
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
} 
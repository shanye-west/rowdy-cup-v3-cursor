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
}

// Debug entry
interface DebugEntry {
  level: DebugLevel;
  message: string;
  context: DebugContext;
  data?: any;
  error?: Error;
}

// Debug store for request tracking
const requestDebugStore = new Map<string, DebugEntry[]>();

// Generate a unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format debug entry for logging
function formatDebugEntry(entry: DebugEntry): string {
  const { level, message, context, data, error } = entry;
  const timestamp = new Date().toISOString();
  let output = `[${timestamp}] [${level}] [${context.requestId}] ${message}`;
  
  if (context.userId) output += ` [User: ${context.userId}]`;
  if (context.username) output += ` [Username: ${context.username}]`;
  if (context.path) output += ` [Path: ${context.path}]`;
  if (context.method) output += ` [Method: ${context.method}]`;
  
  if (data) output += `\nData: ${JSON.stringify(data, null, 2)}`;
  if (error) output += `\nError: ${error.stack || error.message}`;
  
  return output;
}

// Debug logger
export const debug = {
  // Log levels
  error: (message: string, context: Partial<DebugContext>, data?: any, error?: Error) => {
    const entry: DebugEntry = {
      level: DebugLevel.ERROR,
      message,
      context: { ...context, timestamp: new Date().toISOString() },
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
      context: { ...context, timestamp: new Date().toISOString() },
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
      context: { ...context, timestamp: new Date().toISOString() },
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
      context: { ...context, timestamp: new Date().toISOString() },
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
      context: { ...context, timestamp: new Date().toISOString() },
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
  
  // Debug middleware
  middleware: (req: Request, res: Response, next: NextFunction) => {
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    const context: DebugContext = {
      requestId,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
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
      debug.info('Request completed', context, {
        statusCode: res.statusCode,
        responseBody: body
      });
      return originalSend.call(this, body);
    };
    
    next();
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
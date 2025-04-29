
import pino from 'pino';
import debug from 'debug';

// Create a debug namespace for your app
export const dbg = debug('rowdy-cup:');

// Configure pino logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});

// Export a function to capture error details
export const captureError = (error: unknown) => {
  const errorObject = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    details: error
  };
  
  logger.error(errorObject);
  return errorObject;
};

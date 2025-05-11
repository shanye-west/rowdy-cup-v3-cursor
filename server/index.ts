// server/index.ts

// 1) Load .env so process.env.DATABASE_URL is defined
import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";
import { setupAuth } from "./auth";            // ← add this
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
// 2) Import both your Drizzle ORM client and Neon Pool
import { db, pool } from "./db";
import { registerRoutes } from "./routes";
import { debug } from './debug';

const log = console.log.bind(console);

const app = express();

// Add debug middleware first
app.use(debug.middleware);

// CORS middleware - MUST be first
app.use((req: Request, res: Response, next: NextFunction) => {
  // Always allow the Vercel domain
  res.header('Access-Control-Allow-Origin', 'https://rowdy-cup-v3-cursor.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// Parse JSON and URL-encoded bodies BEFORE auth setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup auth AFTER body parsing but BEFORE routes
setupAuth(app);

// Logging middleware for all /api routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

const server = createServer(app);

// WebSocket server setup
const wss = new WebSocketServer({ 
  server,
  verifyClient: (info, callback) => {
    const origin = info.origin;
    const allowedOrigins = [
      'https://rowdy-cup-v3-cursor.vercel.app',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(true);
    } else {
      callback(false, 403, 'Forbidden');
    }
  }
});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  
  ws.on('error', console.error);
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Initialize the app
async function initializeApp() {
  // 3) Smoke-test Neon on startup
  try {
    const result = await pool.query<{ now: Date }>("SELECT NOW() AS now");
    console.log("🗓️  Connected to Neon, server time is", result.rows[0].now);
  } catch (e) {
    console.error("❌  Failed to connect to Neon:", e);
    process.exit(1);
  }

  // 4) Register your routes
  await registerRoutes(app);

  // 5) Health-check endpoints
  app.get("/_health", (_req: Request, res: Response) => res.status(200).send("OK"));
  app.get("/_debug/health", debug.healthCheck);
  app.get("/", (req: Request, res: Response) => {
    if (req.method === "HEAD" || !req.accepts("html")) {
      return res.status(200).send("OK");
    }
    res.status(200).json({ status: "API server is running" });
  });

  return app;
}

// Initialize the app
const appPromise = initializeApp();

// Export the app for both development and production
export default appPromise;

// Start the server
const port = Number(process.env.PORT) || 5000;
appPromise.then(app => {
  server.listen(port, () => {
    log(`Server running on port ${port}`);
  });
});

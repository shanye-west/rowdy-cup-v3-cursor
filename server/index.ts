// server/index.ts

// 1) Load .env so process.env.DATABASE_URL is defined
import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";
// 2) Import both your Drizzle ORM client and Neon Pool
import { db, pool } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Error capture utility
function captureError(err: any) {
  return {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    ...(err.code && { code: err.code }),
  };
}

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for Vercel frontend
app.use((req, res, next) => {
  const allowedOrigin = process.env.NODE_ENV === 'production' 
    ? 'https://rowdy-cup-v3-cursor.vercel.app'
    : 'http://localhost:3000';
    
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Logging middleware for all /api routes
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
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

  // 5) Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const errorDetails = captureError(err);
    
    res.status(status).json({
      message,
      errorId: errorDetails.timestamp,
      path: _req.path,
      method: _req.method,
      ...(process.env.NODE_ENV !== "production" && { details: errorDetails }),
    });
  });

  // 6) Health-check endpoints
  app.get("/_health", (_req, res) => res.status(200).send("OK"));
  app.get("/", (req, res, next) => {
    if (req.method === "HEAD" || !req.accepts("html")) {
      return res.status(200).send("OK");
    }
    next();
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
  app.listen(port, () => {
    log(`Server running on port ${port}`);
  });
});

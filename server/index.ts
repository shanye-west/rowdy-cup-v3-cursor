// server/index.ts

// 1) Load your .env so process.env.DATABASE_URL is populated
import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";
// 2) Import both your Drizzle db and the Neon Pool
import { db, pool } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 3) Logging middleware for all /api routes
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

(async () => {
  // 4) Smoke-test your Neon connection on startup using the Pool directly
  try {
    const result = await pool.query<{ now: Date }>("SELECT NOW() as now");
    console.log("🗓️  Connected to Neon, server time is", result.rows[0].now);
  } catch (e) {
    console.error("❌  Failed to connect to Neon:", e);
    process.exit(1);
  }

  // 5) Register your API routes
  const server = await registerRoutes(app);

  // 6) Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server error:", err);

    res.status(status).json({
      message,
      timestamp: new Date().toISOString(),
      path: _req.path,
      method: _req.method,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  });

  // 7) Health checks
  app.get("/_health", (_req, res) => res.status(200).send("OK"));
  app.get("/", (req, res, next) => {
    if (req.method === "HEAD" || !req.accepts("html")) {
      return res.status(200).send("OK");
    }
    next();
  });

  // 8) Vite in dev, static in prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 9) Start listening
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

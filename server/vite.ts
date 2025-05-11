import { createServer as createViteServer } from 'vite';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export async function setupVite() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  return vite.middlewares;
}

export function serveStatic(app: express.Application) {
  const publicDir = join(__dirname, '..', 'dist', 'public');
  
  // Check if the public directory exists
  if (!fs.existsSync(publicDir)) {
    log(`Warning: Public directory not found at ${publicDir}`);
    return;
  }

  // Serve static files from the public directory
  app.use(express.static(publicDir));

  // Fallback to index.html for client-side routing
  app.use('*', (req, res) => {
    const indexPath = join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not found');
    }
  });
}

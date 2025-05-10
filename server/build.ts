import * as esbuild from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function buildServer() {
  try {
    // Create dist directory if it doesn't exist
    await fs.mkdir('dist', { recursive: true });

    // Build the server
    await esbuild.build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outdir: 'dist',
      external: [
        // Core dependencies
        'express',
        'express-session',
        'passport',
        'passport-local',
        'ws',
        'connect-pg-simple',
        'memorystore',
        'openid-client',
        'pino',
        'pino-pretty',
        '@neondatabase/serverless',
        'drizzle-orm',
        'drizzle-zod',
        'zod',
        'zod-validation-error',
        'debug',
        'dotenv',
        'fsevents',
        
        // Build tool dependencies
        '@babel/*',
        'lightningcss',
        'esbuild',
        'typescript',
        'tsx',
        
        // Node.js built-ins
        'path',
        'fs',
        'crypto',
        'stream',
        'util',
        'url',
        'http',
        'https',
        'net',
        'tls',
        'zlib',
        'events',
        'buffer',
        'process',
        'os',
        'child_process',
        'cluster',
        'dgram',
        'dns',
        'module',
        'readline',
        'repl',
        'string_decoder',
        'timers',
        'tty',
        'vm',
        'worker_threads'
      ],
      sourcemap: true,
      minify: true,
      banner: {
        js: `
          import { createRequire } from 'module';
          import { fileURLToPath } from 'url';
          import { dirname, join } from 'path';
          
          const require = createRequire(import.meta.url);
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = dirname(__filename);
          
          // Override process.cwd to always return the dist directory
          const originalCwd = process.cwd;
          process.cwd = () => __dirname;
        `,
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    // Copy package.json to dist
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const distPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      type: 'module',
      dependencies: packageJson.dependencies,
    };
    await fs.writeFile(
      path.join('dist', 'package.json'),
      JSON.stringify(distPackageJson, null, 2)
    );

    // Copy .env file if it exists
    try {
      await fs.copyFile('.env', path.join('dist', '.env'));
    } catch (error) {
      console.log('No .env file found, skipping...');
    }

    // Create a start script in dist
    const startScript = `#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables
process.env.NODE_ENV = 'production';

// Change to the dist directory
process.chdir(__dirname);

// Override process.cwd to always return the dist directory
const originalCwd = process.cwd;
process.cwd = () => __dirname;

// Ensure package.json is in the correct location
const fs = require('fs');
const path = require('path');
const packageJsonPath = path.join(__dirname, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('package.json not found in:', packageJsonPath);
  process.exit(1);
}

// Start the server
import('./index.js');
`;
    await fs.writeFile(path.join('dist', 'start.js'), startScript);
    await fs.chmod(path.join('dist', 'start.js'), 0o755);

    console.log('Server build completed successfully!');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

buildServer(); 
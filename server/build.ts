import * as esbuild from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';

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
        'dotenv'
      ],
      sourcemap: true,
      minify: true,
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
      'dist/package.json',
      JSON.stringify(distPackageJson, null, 2)
    );

    console.log('Server build completed successfully!');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

buildServer(); 
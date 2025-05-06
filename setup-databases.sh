#!/bin/bash

echo "Starting database setup..."

# Push the main schema to the main database
echo "Setting up main database..."
npx drizzle-kit push

# Push the SW schema to the SW database
echo "Setting up SW database..."
npx drizzle-kit push --config=drizzle.config.sw.ts

echo "Database setup complete!"
import "dotenv/config"; // loads .env file into process.env
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/sw_schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.SW_DATABASE_URL) {
  console.warn("SW_DATABASE_URL not set. SW Monthly Golf features will be disabled.");
}

export const swPool = process.env.SW_DATABASE_URL 
  ? new Pool({ connectionString: process.env.SW_DATABASE_URL }) 
  : null;

export const swDb = swPool 
  ? drizzle({ client: swPool, schema })
  : null;
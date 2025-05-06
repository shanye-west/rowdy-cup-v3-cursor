import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./shared/sw_schema.ts",
  out: "./migrations/sw",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.SW_DATABASE_URL!,
  },
});
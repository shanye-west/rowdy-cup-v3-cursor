-- Manual migration to create the new tables and columns

-- Create courses table
CREATE TABLE IF NOT EXISTS "courses" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "location" TEXT,
  "description" TEXT
);

-- Add course_id to holes table
ALTER TABLE "holes" 
ADD COLUMN IF NOT EXISTS "course_id" INTEGER NOT NULL DEFAULT 1;

-- Add foreign key constraint to holes table
ALTER TABLE "holes" 
ADD CONSTRAINT "holes_course_id_fk" 
FOREIGN KEY ("course_id") REFERENCES "courses"("id");

-- Add course_id to rounds table
ALTER TABLE "rounds" 
ADD COLUMN IF NOT EXISTS "course_id" INTEGER;

-- Add foreign key constraint to rounds table
ALTER TABLE "rounds" 
ADD CONSTRAINT "rounds_course_id_fk" 
FOREIGN KEY ("course_id") REFERENCES "courses"("id");

-- Add pending score columns to tournament table
ALTER TABLE "tournament" 
ADD COLUMN IF NOT EXISTS "pending_aviator_score" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "pending_producer_score" NUMERIC DEFAULT 0;
-- Insert default course data before adding foreign key constraints
INSERT INTO "courses" (name, location, description)
VALUES 
  ('TPC Sawgrass', 'Ponte Vedra Beach, FL', 'Home of THE PLAYERS Championship'),
  ('Pebble Beach Golf Links', 'Pebble Beach, CA', 'Iconic coastal course')
ON CONFLICT DO NOTHING;

-- Update existing holes to use the default course id
UPDATE "holes" SET "course_id" = 1;

-- Update existing rounds to use the default course id where needed
UPDATE "rounds" SET "course_id" = 1 WHERE "course_id" IS NULL;
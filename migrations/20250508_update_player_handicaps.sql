-- Update the player_course_handicaps table
ALTER TABLE player_course_handicaps 
ADD COLUMN round_id INTEGER NOT NULL REFERENCES rounds(id),
RENAME COLUMN course_id TO temp_course_id,
RENAME COLUMN handicap_value TO course_handicap;

-- Create index on player_id and round_id for faster lookups
CREATE INDEX idx_player_course_handicaps_player_round
ON player_course_handicaps(player_id, round_id);

-- Drop temporary column after data migration (if needed)
-- ALTER TABLE player_course_handicaps DROP COLUMN temp_course_id;
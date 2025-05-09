-- Add isActive, startDate, and endDate to tournament table 
ALTER TABLE tournament 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN start_date TIMESTAMP,
ADD COLUMN end_date TIMESTAMP;

-- Add tournamentId to rounds table
ALTER TABLE rounds 
ADD COLUMN tournament_id INTEGER REFERENCES tournament(id);

-- Update existing rounds to associate with first tournament
UPDATE rounds SET tournament_id = 1 WHERE tournament_id IS NULL;

-- Make tournament_id NOT NULL for future rounds
ALTER TABLE rounds ALTER COLUMN tournament_id SET NOT NULL;

-- Create tournament_player_stats table
CREATE TABLE tournament_player_stats (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournament(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points NUMERIC DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  UNIQUE(tournament_id, player_id)
);

-- Create tournament_history table
CREATE TABLE tournament_history (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  tournament_name TEXT NOT NULL,
  winning_team TEXT,
  aviator_score NUMERIC,
  producer_score NUMERIC,
  tournament_id INTEGER NOT NULL REFERENCES tournament(id),
  location TEXT,
  UNIQUE(tournament_id)
);

-- Create player_career_stats table
CREATE TABLE player_career_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_ties INTEGER DEFAULT 0,
  total_points NUMERIC DEFAULT 0,
  tournaments_played INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id)
);

-- Initialize player_career_stats with existing players
INSERT INTO player_career_stats (player_id, total_wins, total_losses, total_ties)
SELECT id, wins, losses, ties FROM players WHERE id > 0;

-- Make course_id nullable in player_course_handicaps
ALTER TABLE player_course_handicaps ALTER COLUMN course_id DROP NOT NULL;

-- Add initial tournament player stats records for each player
INSERT INTO tournament_player_stats (tournament_id, player_id, wins, losses, ties)
SELECT 1, id, wins, losses, ties FROM players WHERE id > 0;

-- Add indexes for performance
CREATE INDEX idx_tournament_player_stats_tournament ON tournament_player_stats(tournament_id);
CREATE INDEX idx_tournament_player_stats_player ON tournament_player_stats(player_id);
CREATE INDEX idx_player_career_stats_player ON player_career_stats(player_id);
CREATE INDEX idx_tournament_history_year ON tournament_history(year);
CREATE INDEX idx_tournament_history_tournament ON tournament_history(tournament_id);
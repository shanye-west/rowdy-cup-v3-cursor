
CREATE TABLE IF NOT EXISTS "holes" (
    "id" serial PRIMARY KEY NOT NULL,
    "number" integer NOT NULL,
    "par" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "match_participants" (
    "id" serial PRIMARY KEY NOT NULL,
    "match_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "team" text NOT NULL,
    "result" text
);

CREATE TABLE IF NOT EXISTS "matches" (
    "id" serial PRIMARY KEY NOT NULL,
    "round_id" integer NOT NULL,
    "name" text NOT NULL,
    "status" text NOT NULL,
    "current_hole" integer DEFAULT 1,
    "leading_team" text,
    "lead_amount" integer DEFAULT 0,
    "result" text,
    "locked" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "players" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "team_id" integer NOT NULL,
    "user_id" integer,
    "wins" integer DEFAULT 0,
    "losses" integer DEFAULT 0,
    "ties" integer DEFAULT 0,
    "status" text
);

CREATE TABLE IF NOT EXISTS "rounds" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "match_type" text NOT NULL,
    "date" text NOT NULL,
    "course_name" text NOT NULL,
    "start_time" text NOT NULL,
    "is_complete" boolean DEFAULT false,
    "status" text,
    "aviator_score" numeric(5,1),
    "producer_score" numeric(5,1)
);

CREATE TABLE IF NOT EXISTS "scores" (
    "id" serial PRIMARY KEY NOT NULL,
    "match_id" integer NOT NULL,
    "hole_number" integer NOT NULL,
    "aviator_score" numeric(5,1),
    "producer_score" numeric(5,1),
    "winning_team" text,
    "match_status" text
);

CREATE TABLE IF NOT EXISTS "teams" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "short_name" text NOT NULL,
    "color_code" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "tournament" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "aviator_score" numeric(5,1),
    "producer_score" numeric(5,1),
    "pending_aviator_score" numeric(5,1),
    "pending_producer_score" numeric(5,1),
    "year" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "username" text NOT NULL,
    "passcode" text NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "player_id" integer,
    "needs_password_change" boolean DEFAULT true NOT NULL,
    CONSTRAINT "users_username_unique" UNIQUE("username")
);

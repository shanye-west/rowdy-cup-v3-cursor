CREATE TABLE "holes" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"par" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_participants" (
	"match_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"team" text NOT NULL,
	"result" text
);
--> statement-breakpoint
CREATE TABLE "matches" (
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
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_id" integer NOT NULL,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"ties" integer DEFAULT 0,
	"status" text
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"match_type" text NOT NULL,
	"date" text NOT NULL,
	"course_name" text NOT NULL,
	"start_time" text NOT NULL,
	"is_complete" boolean DEFAULT false,
	"status" text,
	"aviator_score" numeric(5, 1) DEFAULT 0,
	"producer_score" numeric(5, 1) DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"hole_number" integer NOT NULL,
	"aviator_score" text,
	"producer_score" text,
	"winning_team" text,
	"match_status" text
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"color_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"aviator_score" numeric(5, 1) DEFAULT 0,
	"producer_score" numeric(5, 1) DEFAULT 0,
	"pending_aviator_score" numeric(5, 1) DEFAULT 0,
	"pending_producer_score" numeric(5, 1) DEFAULT 0,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"passcode" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"player_id" integer,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE "player_career_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"total_wins" integer DEFAULT 0,
	"total_losses" integer DEFAULT 0,
	"total_ties" integer DEFAULT 0,
	"total_points" numeric DEFAULT 0,
	"tournaments_played" integer DEFAULT 0,
	"matches_played" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"tournament_name" text NOT NULL,
	"winning_team" text,
	"aviator_score" numeric,
	"producer_score" numeric,
	"tournament_id" integer NOT NULL,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "tournament_player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"ties" integer DEFAULT 0,
	"points" numeric DEFAULT 0,
	"matches_played" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "tournament_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "tournament" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "player_career_stats" ADD CONSTRAINT "player_career_stats_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_history" ADD CONSTRAINT "tournament_history_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_player_stats" ADD CONSTRAINT "tournament_player_stats_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_player_stats" ADD CONSTRAINT "tournament_player_stats_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_course_handicaps" ADD CONSTRAINT "player_course_handicaps_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournament"("id") ON DELETE no action ON UPDATE no action;
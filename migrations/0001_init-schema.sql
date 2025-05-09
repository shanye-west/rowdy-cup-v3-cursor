CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"description" text,
	"course_rating" numeric,
	"slope_rating" integer,
	"par" integer,
	CONSTRAINT "courses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "player_course_handicaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"round_id" integer,
	"course_id" integer,
	"course_handicap" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rounds" ALTER COLUMN "aviator_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "rounds" ALTER COLUMN "aviator_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "rounds" ALTER COLUMN "producer_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "rounds" ALTER COLUMN "producer_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "aviator_score" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "scores" ALTER COLUMN "producer_score" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "aviator_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "aviator_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "producer_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "producer_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "pending_aviator_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "pending_aviator_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "pending_producer_score" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "tournament" ALTER COLUMN "pending_producer_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "holes" ADD COLUMN "course_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "holes" ADD COLUMN "handicap_rank" integer;--> statement-breakpoint
ALTER TABLE "match_participants" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "handicap_index" numeric;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "course_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "needs_password_change" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "player_course_handicaps" ADD CONSTRAINT "player_course_handicaps_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_course_handicaps" ADD CONSTRAINT "player_course_handicaps_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holes" ADD CONSTRAINT "holes_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_player_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
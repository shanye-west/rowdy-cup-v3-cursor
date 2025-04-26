import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table maintained for reference/compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  colorCode: text("color_code").notNull(),
});

export const insertTeamSchema = createInsertSchema(teams);
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Players table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: integer("team_id").notNull(),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  ties: integer("ties").default(0),
});

export const insertPlayerSchema = createInsertSchema(players);
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Rounds table
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  matchType: text("match_type").notNull(), // Scramble, Shamble, Best Ball, etc.
  date: text("date").notNull(),
  courseName: text("course_name").notNull(),
  startTime: text("start_time").notNull(),
  isComplete: boolean("is_complete").default(false),
});

export const insertRoundSchema = createInsertSchema(rounds);
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(), // "completed", "in_progress", "upcoming"
  aviatorPlayers: text("aviator_players").notNull(), // Comma-separated list of player names 
  producerPlayers: text("producer_players").notNull(), // Comma-separated list of player names
  currentHole: integer("current_hole").default(1),
  leadingTeam: text("leading_team"), // "aviators", "producers", or null if tied
  leadAmount: integer("lead_amount").default(0),
  result: text("result"), // "3&2", "1UP", "AS" (for tied or incomplete)
});

export const insertMatchSchema = createInsertSchema(matches);
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Holes table
export const holes = pgTable("holes", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  par: integer("par").notNull(),
});

export const insertHoleSchema = createInsertSchema(holes);
export type InsertHole = z.infer<typeof insertHoleSchema>;
export type Hole = typeof holes.$inferSelect;

// Scores table
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  holeNumber: integer("hole_number").notNull(),
  aviatorScore: integer("aviator_score"),
  producerScore: integer("producer_score"),
  winningTeam: text("winning_team"), // "aviators", "producers", or null if tied
  matchStatus: text("match_status"), // e.g., "A1" for Aviators 1-up, "P2" for Producers 2-up, "AS" for all square
});

export const insertScoreSchema = createInsertSchema(scores);
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;

// Tournament table
export const tournament = pgTable("tournament", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  aviatorScore: integer("aviator_score").default(0),
  producerScore: integer("producer_score").default(0),
  year: integer("year").notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournament);
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournament.$inferSelect;

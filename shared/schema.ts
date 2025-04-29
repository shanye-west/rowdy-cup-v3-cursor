import { pgTable, text, serial, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (updated to New Schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passcode: text("passcode").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  playerId: integer("player_id"),
});
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  passcode: true,
  isAdmin: true,
  playerId: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Holes table
export const holes = pgTable("holes", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  par: integer("par").notNull(),
});
export const insertHoleSchema = createInsertSchema(holes);
export type InsertHole = z.infer<typeof insertHoleSchema>;
export type Hole = typeof holes.$inferSelect;

// Match Players table
export const match_players = pgTable("match_participants", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  playerId: integer("user_id").notNull(),
  team: text("team").notNull(),
  result: text("result"),
});
export const insertMatchPlayerSchema = createInsertSchema(match_players);
export type InsertMatchPlayer = z.infer<typeof insertMatchPlayerSchema>;
export type MatchPlayer = typeof match_players.$inferSelect;

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  currentHole: integer("current_hole").default(1),
  leadingTeam: text("leading_team"),
  leadAmount: integer("lead_amount").default(0),
  result: text("result"),
  locked: boolean("locked").default(false),
});
export const insertMatchSchema = createInsertSchema(matches);
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Players table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id"), // Reference to user in the users table
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  ties: integer("ties").default(0),
  status: text("status"),
});
export const insertPlayerSchema = createInsertSchema(players);
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Rounds table
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  matchType: text("match_type").notNull(),
  date: text("date").notNull(),
  courseName: text("course_name").notNull(),
  startTime: text("start_time").notNull(),
  isComplete: boolean("is_complete").default(false),
  status: text("status"),
  aviatorScore: integer("aviator_score"),
  producerScore: integer("producer_score"),
});
export const insertRoundSchema = createInsertSchema(rounds);
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;

// Scores table
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  holeNumber: integer("hole_number").notNull(),
  aviatorScore: text("aviator_score"),
  producerScore: text("producer_score"),
  winningTeam: text("winning_team"),
  matchStatus: text("match_status"),
});
export const insertScoreSchema = createInsertSchema(scores);
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;

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

// Tournament table
export const tournament = pgTable("tournament", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  aviatorScore: integer("aviator_score"),
  producerScore: integer("producer_score"),
  pendingAviatorScore: integer("pending_aviator_score"),
  pendingProducerScore: integer("pending_producer_score"),
  year: integer("year").notNull(),
});
export const insertTournamentSchema = createInsertSchema(tournament);
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournament.$inferSelect;

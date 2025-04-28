// server/storage.ts

import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users,
  type User,
  type InsertUser,
  teams,
  type Team,
  type InsertTeam,
  players,
  type Player,
  type InsertPlayer,
  rounds,
  type Round,
  type InsertRound,
  matches,
  type Match,
  type InsertMatch,
  holes,
  type Hole,
  type InsertHole,
  scores,
  type Score,
  type InsertScore,
  tournament,
  type Tournament,
  type InsertTournament,
} from "@shared/schema";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;

  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(data: InsertTeam): Promise<Team>;

  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(data: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, data: Partial<Player>): Promise<Player | undefined>;

  getRounds(): Promise<Round[]>;
  getRound(id: number): Promise<Round | undefined>;
  createRound(data: InsertRound): Promise<Round>;
  updateRound(id: number, data: Partial<Round>): Promise<Round | undefined>;

  getMatches(): Promise<Match[]>;
  getMatchesByRound(roundId: number): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  createMatch(data: InsertMatch): Promise<Match>;
  updateMatch(id: number, data: Partial<Match>): Promise<Match | undefined>;

  getHoles(): Promise<Hole[]>;
  createHole(data: InsertHole): Promise<Hole>;

  getScores(): Promise<Score[]>;
  getScore(matchId: number, holeNumber: number): Promise<Score | undefined>;
  createScore(data: InsertScore): Promise<Score>;
  updateScore(id: number, data: Partial<Score>): Promise<Score | undefined>;

  getTournament(): Promise<Tournament | undefined>;
  createTournament(data: InsertTournament): Promise<Tournament>;
  updateTournament(
    id: number,
    data: Partial<Tournament>,
  ): Promise<Tournament | undefined>;

  calculateRoundScores(roundId: number): Promise<{
    aviatorScore: number;
    producerScore: number;
    pendingAviatorScore: number;
    pendingProducerScore: number;
  }>;
  calculateTournamentScores(): Promise<{
    aviatorScore: number;
    producerScore: number;
    pendingAviatorScore: number;
    pendingProducerScore: number;
  }>;
 
  /**
   * Compute a single player’s W-L-D for one tournament.
   */
  calculatePlayerStats(
    tournamentId: number,
    playerId: number,
  ): Promise<{ wins: number; losses: number; draws: number }>;

  initializeData(): Promise<void>;
}

export class DBStorage implements IStorage {
  // —— Users ——
  async getUsers() {
    return db.select().from(users);
  }
  async getUser(id: number) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }
  async createUser(data: InsertUser) {
    const [row] = await db.insert(users).values(data).returning();
    return row;
  }

  // —— Teams ——
  async getTeams() {
    return db.select().from(teams);
  }
  async getTeam(id: number) {
    const [row] = await db.select().from(teams).where(eq(teams.id, id));
    return row;
  }
  async createTeam(data: InsertTeam) {
    const [row] = await db.insert(teams).values(data).returning();
    return row;
  }

  // —— Players ——
  async getPlayers() {
    return db.select().from(players);
  }
  async getPlayer(id: number) {
    const [row] = await db.select().from(players).where(eq(players.id, id));
    return row;
  }
  async createPlayer(data: InsertPlayer) {
    const [row] = await db.insert(players).values(data).returning();
    return row;
  }
  async updatePlayer(id: number, data: Partial<Player>) {
    const [row] = await db
      .update(players)
      .set(data)
      .where(eq(players.id, id))
      .returning();
    return row;
  }

  // —— Player Stats ——
  async calculatePlayerStats(
    tournamentId: number,
    playerId: number
  ): Promise<{ wins: number; losses: number; draws: number }> {
    // First, find all matches in this tournament that this player played.
    const rows = await db
      .select({
        result: matchPlayers.result,    // assuming you have a matchPlayers join table
        cnt: sql<number>`COUNT(*)`,
      })
      .from(matchPlayers)
      .where(
        eq(matchPlayers.playerId, playerId),
        inArray(
          matchPlayers.matchId,
          db
            .select({ mId: matches.id })
            .from(matches)
            .where(eq(matches.tournamentId, tournamentId))
        )
      )
      .groupBy(matchPlayers.result)
      .all();

    const stats = { wins: 0, losses: 0, draws: 0 };
    for (const r of rows) {
      if (r.result === "win") stats.wins = r.cnt;
      else if (r.result === "loss") stats.losses = r.cnt;
      else if (r.result === "draw") stats.draws = r.cnt;
    }
    return stats;
  }

  // —— Rounds ——
  async getRounds() {
    return db.select().from(rounds);
  }
  async getRound(id: number) {
    const [row] = await db.select().from(rounds).where(eq(rounds.id, id));
    return row;
  }
  async createRound(data: InsertRound) {
    const [row] = await db.insert(rounds).values(data).returning();
    return row;
  }
  async updateRound(id: number, data: Partial<Round>) {
    const [row] = await db
      .update(rounds)
      .set(data)
      .where(eq(rounds.id, id))
      .returning();
    return row;
  }

  // —— Matches ——
  async getMatches() {
    return db.select().from(matches);
  }
  async getMatch(id: number) {
    const [row] = await db.select().from(matches).where(eq(matches.id, id));
    return row;
  }
  async createMatch(data: InsertMatch) {
    const [row] = await db.insert(matches).values(data).returning();
    return row;
  }
  async updateMatch(id: number, data: Partial<Match>) {
    const [row] = await db
      .update(matches)
      .set(data)
      .where(eq(matches.id, id))
      .returning();
    return row;
  }

  // —— Matches by Round ——
  async getMatchesByRound(roundId: number): Promise<Match[]> {
    return db.select().from(matches).where(eq(matches.roundId, roundId));
  }

  // —— Holes ——
  async getHoles() {
    return db.select().from(holes);
  }
  async createHole(data: InsertHole) {
    const [row] = await db.insert(holes).values(data).returning();
    return row;
  }

  // —— Scores ——
  async getScores() {
    return db.select().from(scores);
  }
  async getScore(matchId: number, holeNumber: number) {
    const [row] = await db
      .select()
      .from(scores)
      .where(eq(scores.matchId, matchId), eq(scores.holeNumber, holeNumber));
    return row;
  }
  async createScore(data: InsertScore) {
    const [row] = await db.insert(scores).values(data).returning();
    return row;
  }
  async updateScore(id: number, data: Partial<Score>) {
    const [row] = await db
      .update(scores)
      .set(data)
      .where(eq(scores.id, id))
      .returning();
    return row;
  }

  // —— Tournament ——
  async getTournament() {
    const [row] = await db.select().from(tournament).limit(1);
    return row;
  }
  async createTournament(data: InsertTournament) {
    const [row] = await db.insert(tournament).values(data).returning();
    return row;
  }
  async updateTournament(id: number, data: Partial<Tournament>) {
    const [row] = await db
      .update(tournament)
      .set(data)
      .where(eq(tournament.id, id))
      .returning();
    return row;
  }

  // —— Aggregate scorers ——
  async calculateRoundScores(roundId: number): Promise<{
    aviatorScore: number;
    producerScore: number;
    pendingAviatorScore: number;
    pendingProducerScore: number;
  }> {
    const matchesByRound = await db
      .select()
      .from(matches)
      .where(eq(matches.roundId, roundId));
    let aviatorScore = 0;
    let producerScore = 0;
    let pendingAviatorScore = 0;
    let pendingProducerScore = 0;

    for (const match of matchesByRound) {
      if (match.status === "completed") {
        if (match.leadingTeam === "aviators") aviatorScore += 1;
        else if (match.leadingTeam === "producers") producerScore += 1;
        else {
          aviatorScore += 0.5;
          producerScore += 0.5;
        }
      } else if (match.status === "in_progress" && match.leadingTeam) {
        if (match.leadingTeam === "aviators") pendingAviatorScore += 1;
        if (match.leadingTeam === "producers") pendingProducerScore += 1;
      }
    }

    return {
      aviatorScore,
      producerScore,
      pendingAviatorScore,
      pendingProducerScore,
    };
  }

  async calculateTournamentScores(): Promise<{
    aviatorScore: number;
    producerScore: number;
    pendingAviatorScore: number;
    pendingProducerScore: number;
  }> {
    const allRounds = await this.getRounds();
    let totalAviatorScore = 0;
    let totalProducerScore = 0;
    let totalPendingAviatorScore = 0;
    let totalPendingProducerScore = 0;

    for (const round of allRounds) {
      const scores = await this.calculateRoundScores(round.id);
      totalAviatorScore += scores.aviatorScore;
      totalProducerScore += scores.producerScore;
      totalPendingAviatorScore += scores.pendingAviatorScore;
      totalPendingProducerScore += scores.pendingProducerScore;
    }

    const tour = await this.getTournament();
    if (tour) {
      await this.updateTournament(tour.id, {
        aviatorScore: totalAviatorScore,
        producerScore: totalProducerScore,
        pendingAviatorScore: totalPendingAviatorScore,
        pendingProducerScore: totalPendingProducerScore,
      });
    }

    return {
      aviatorScore: totalAviatorScore,
      producerScore: totalProducerScore,
      pendingAviatorScore: totalPendingAviatorScore,
      pendingProducerScore: totalPendingProducerScore,
    };
  }

  // —— Initialization ——
  async initializeData() {
    const existingTeams = await this.getTeams();
    if (existingTeams.length === 0) {
      await this.createTeam({
        name: "The Aviators",
        shortName: "Aviators",
        colorCode: "#0047AB",
      });
      await this.createTeam({
        name: "The Producers",
        shortName: "Producers",
        colorCode: "#FF8C00",
      });
    }

    const existingHoles = await this.getHoles();
    if (existingHoles.length === 0) {
      const pars = [4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4];
      for (let i = 0; i < pars.length; i++) {
        await this.createHole({ number: i + 1, par: pars[i] });
      }
    }

    const existingTourney = await this.getTournament();
    if (!existingTourney) {
      await this.createTournament({
        name: "Rowdy Cup 2025",
        year: new Date().getFullYear(),
      });
    }
  }
}

export const storage = new DBStorage();

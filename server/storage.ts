// server/storage.ts

import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
  
  /** Fetches all scores for a given match (one row per hole) */
  getScoresByMatch(matchId: number): Promise<Score[]>;

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
    // In the current implementation, we don't have a join table for matchPlayers
    // This is a placeholder implementation until we implement the full player stats functionality
    return { wins: 0, losses: 0, draws: 0 };
  }
  
  // Get players by team (implementation was missing)
  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return db.select().from(players).where(eq(players.teamId, teamId));
  }
  
  // Update team (implementation was missing)
  async updateTeam(id: number, data: Partial<Team>): Promise<Team | undefined> {
    const [row] = await db
      .update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();
    return row;
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
    // Query using separate where clauses to chain conditions
    const matchingScores = await db
      .select()
      .from(scores)
      .where(eq(scores.matchId, matchId))
      .where(eq(scores.holeNumber, holeNumber));
    
    return matchingScores[0];
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

  async getScoresByMatch(matchId: number): Promise<Score[]> {
    return db
      .select()
      .from(scores)
      .where(eq(scores.matchId, matchId))
      .orderBy(scores.holeNumber);  // optional: to get them in hole order
  }
  
  // Update score and trigger match state update
  async updateScoreAndMatch(id: number, data: Partial<Score>): Promise<Score> {
    const [updatedScore] = await db
      .update(scores)
      .set(data)
      .where(eq(scores.id, id))
      .returning();
      
    // After updating the score, update the match state
    await this.updateMatchState(updatedScore.matchId);
    
    return updatedScore;
  }
  
  // Create score and trigger match state update
  async createScoreAndMatch(data: InsertScore): Promise<Score> {
    const [newScore] = await db.insert(scores).values(data).returning();
    
    // After creating the score, update the match state
    await this.updateMatchState(newScore.matchId);
    
    return newScore;
  }
  
  // Update match status based on scores
  private async updateMatchState(matchId: number): Promise<void> {
    const match = await this.getMatch(matchId);
    if (!match) return;
    
    const matchScores = await this.getScoresByMatch(matchId);
    
    // Sort scores by hole number
    matchScores.sort((a, b) => a.holeNumber - b.holeNumber);
    
    let aviatorWins = 0;
    let producerWins = 0;
    let lastHoleScored = 0;
    
    for (const score of matchScores) {
      if (score.aviatorScore !== null && score.producerScore !== null) {
        if (score.aviatorScore < score.producerScore) {
          aviatorWins += 1;
        } else if (score.producerScore < score.aviatorScore) {
          producerWins += 1;
        }
        
        if (score.holeNumber > lastHoleScored) {
          lastHoleScored = score.holeNumber;
        }
      }
    }
    
    // Update match status
    let leadingTeam: string | null = null;
    let leadAmount = 0;
    
    if (aviatorWins > producerWins) {
      leadingTeam = "aviators";
      leadAmount = aviatorWins - producerWins;
    } else if (producerWins > aviatorWins) {
      leadingTeam = "producers";
      leadAmount = producerWins - aviatorWins;
    }
    
    // Check if match is completed
    let status = match.status;
    let result: string | null = null;
    
    // Count completed holes
    const completedHoles = matchScores.filter(s => s.aviatorScore !== null && s.producerScore !== null).length;
    
    // Determine if the match should be complete
    const remainingHoles = 18 - lastHoleScored;
    
    if (completedHoles === 18) {
      // All 18 holes completed
      status = "completed";
      if (leadingTeam) {
        result = `1UP`; // If someone won after 18 holes, it's "1 UP"
      } else {
        result = "AS"; // All square
      }
    } else if (leadAmount > remainingHoles) {
      // Match is decided if lead is greater than remaining holes
      status = "completed";
      result = `${leadAmount} UP`; // Format as "3 UP", "2 UP", etc.
    } else if (lastHoleScored > 0) {
      status = "in_progress";
      result = null;
    }
    
    // Update match
    await this.updateMatch(matchId, {
      leadingTeam,
      leadAmount,
      status,
      result,
      currentHole: lastHoleScored + 1,
    });
    
    // Always recalculate tournament scores when match state changes
    // This ensures both completed and pending scores are updated
    await this.calculateTournamentScores();
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

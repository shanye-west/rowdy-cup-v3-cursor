// server/storage.ts

import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users,
  players,
  teams,
  matches,
  scores,
  match_participants,
  rounds,
  tournament,
  holes,
} from "@shared/schema";

export interface IStorage {
  getHoles(): Promise<any[]>;
  getUsers(): Promise<any[]>;
  getUser(id: number): Promise<any | undefined>;
  createUser(data: any): Promise<any>;

  getPlayers(): Promise<any[]>;
  getPlayer(id: number): Promise<any | undefined>;
  createPlayer(data: any): Promise<any>;
  updatePlayer(id: number, data: Partial<any>): Promise<any | undefined>;

  getTeams(): Promise<any[]>;
  getTeam(id: number): Promise<any | undefined>;

  getRounds(): Promise<any[]>;
  getRound(id: number): Promise<any | undefined>;
  createRound(data: any): Promise<any>;
  updateRound(id: number, data: Partial<any>): Promise<any | undefined>;

  getMatches(): Promise<any[]>;
  getMatch(id: number): Promise<any | undefined>;
  getMatchWithParticipants(id: number): Promise<any | undefined>;
  getMatchesByRound(roundId: number): Promise<any[]>;
  createMatch(data: any): Promise<any>;
  updateMatch(id: number, data: Partial<any>): Promise<any | undefined>;
  deleteMatch(id: number): Promise<void>;

  getMatchParticipants(matchId: number): Promise<any[]>;
  createMatchParticipant(data: any): Promise<any>;

  getScores(): Promise<any[]>;
  getScore(matchId: number, holeNumber: number): Promise<any | undefined>;
  getScoresByMatch(matchId: number): Promise<any[]>;
  createScore(data: any): Promise<any>;
  updateScore(id: number, data: Partial<any>): Promise<any | undefined>;
  updateScoreAndMatch(id: number, data: Partial<any>): Promise<any>;
  createScoreAndMatch(data: any): Promise<any>;

  getTournament(): Promise<any | undefined>;
  createTournament(data: any): Promise<any>;
  updateTournament(id: number, data: Partial<any>): Promise<any | undefined>;

  calculateRoundScores(roundId: number): Promise<{
    aviatorScore: number;
    producerScore: number;
  }>;

  calculateTournamentScores(): Promise<{
    aviatorScore: number;
    producerScore: number;
  }>;

  calculatePlayerStats(
    tournamentId: number,
    playerId: number,
  ): Promise<{ wins: number; losses: number; draws: number }>;

  initializeData(): Promise<void>;
  createHole(data: any): Promise<any>;
}

export class DBStorage implements IStorage {
  // Holes
  async getHoles() {
    return db.select().from(holes);
  }

  // Users
  async getUsers() {
    return db.select().from(users);
  }

  async getUser(id: number) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }

  async createUser(data: any) {
    const [row] = await db.insert(users).values(data).returning();
    return row;
  }

  // Players
  async getPlayers() {
    return db.select().from(players);
  }

  async getPlayer(id: number) {
    const [row] = await db.select().from(players).where(eq(players.id, id));
    return row;
  }

  async createPlayer(data: any) {
    const [row] = await db.insert(players).values(data).returning();
    return row;
  }

  async updatePlayer(id: number, data: Partial<any>) {
    const [row] = await db
      .update(players)
      .set(data)
      .where(eq(players.id, id))
      .returning();
    return row;
  }

  // Teams
  async getTeams() {
    return db.select().from(teams);
  }

  async getTeam(id: number) {
    const [row] = await db.select().from(teams).where(eq(teams.id, id));
    return row;
  }

  // Rounds
  async getRounds() {
    return db.select().from(rounds);
  }

  async getRound(id: number) {
    const [row] = await db.select().from(rounds).where(eq(rounds.id, id));
    return row;
  }

  async createRound(data: any) {
    const [row] = await db.insert(rounds).values(data).returning();
    return row;
  }

  async updateRound(id: number, data: Partial<any>) {
    const [row] = await db
      .update(rounds)
      .set(data)
      .where(eq(rounds.id, id))
      .returning();
    return row;
  }

  // Matches
  async getMatches() {
    return db.select().from(matches);
  }

  async getMatch(id: number) {
    const [row] = await db.select().from(matches).where(eq(matches.id, id));
    return row;
  }

  async getMatchesByRound(roundId: number) {
    return db.select().from(matches).where(eq(matches.roundId, roundId));
  }

  async createMatch(data: any) {
    const [row] = await db.insert(matches).values(data).returning();
    return row;
  }

  async updateMatch(id: number, data: Partial<any>) {
    const [row] = await db
      .update(matches)
      .set(data)
      .where(eq(matches.id, id))
      .returning();
    return row;
  }

  async deleteMatch(id: number) {
    await db.delete(matches).where(eq(matches.id, id));
  }

  // Scores
  async getScores() {
    return db.select().from(scores);
  }

  async getScore(matchId: number, holeNumber: number) {
    const [row] = await db
      .select()
      .from(scores)
      .where(
        and(eq(scores.matchId, matchId), eq(scores.holeNumber, holeNumber)),
      );
    return row;
  }

  async getScoresByMatch(matchId: number) {
    return db.select().from(scores).where(eq(scores.matchId, matchId));
  }

  async createScore(data: any) {
    const [row] = await db.insert(scores).values(data).returning();
    return row;
  }

  async updateScore(id: number, data: Partial<any>) {
    const [row] = await db
      .update(scores)
      .set(data)
      .where(eq(scores.id, id))
      .returning();
    return row;
  }
  
  async updateScoreAndMatch(id: number, data: Partial<any>) {
    const [updatedScore] = await db
      .update(scores)
      .set(data)
      .where(eq(scores.id, id))
      .returning();
      
    // After updating the score, update the match state
    await this.updateMatchState(updatedScore.matchId);
    
    return updatedScore;
  }
  
  async createScoreAndMatch(data: any) {
    const [newScore] = await db.insert(scores).values(data).returning();
    
    // After creating the score, update the match state
    await this.updateMatchState(newScore.matchId);
    
    return newScore;
  }
  
  // Tournament
  async getTournament() {
    const [row] = await db.select().from(tournament);
    return row;
  }

  async createTournament(data: any) {
    const [row] = await db.insert(tournament).values(data).returning();
    return row;
  }

  async updateTournament(id: number, data: Partial<any>) {
    const [row] = await db
      .update(tournament)
      .set(data)
      .where(eq(tournament.id, id))
      .returning();
    return row;
  }

  // Match state update - Crucial for scoring
  private async updateMatchState(matchId: number) {
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
    
    // Update round scores
    await this.updateRoundScores(match.roundId);
    
    // Update tournament scores
    await this.updateTournamentScores();
  }
  
  // Update round scores based on matches
  private async updateRoundScores(roundId: number) {
    const roundScores = await this.calculateRoundScores(roundId);
    await this.updateRound(roundId, roundScores);
  }
  
  // Update tournament scores
  private async updateTournamentScores() {
    const tournamentScores = await this.calculateTournamentScores();
    const tournament = await this.getTournament();
    if (tournament) {
      await this.updateTournament(tournament.id, tournamentScores);
    }
  }

  // Calculate scores
  async calculateRoundScores(roundId: number) {
    const matchesByRound = await db
      .select()
      .from(matches)
      .where(eq(matches.roundId, roundId));

    let aviatorScore = 0;
    let producerScore = 0;

    for (const match of matchesByRound) {
      if (match.status === "completed") {
        if (match.leadingTeam === "aviators") {
          aviatorScore += 1;
        } else if (match.leadingTeam === "producers") {
          producerScore += 1;
        } else {
          // Tied match
          aviatorScore += 0.5;
          producerScore += 0.5;
        }
      }
    }

    return {
      aviatorScore,
      producerScore
    };
  }

  async calculateTournamentScores() {
    const allRounds = await db.select().from(rounds);

    let aviatorScore = 0;
    let producerScore = 0;

    for (const round of allRounds) {
      const roundScores = await this.calculateRoundScores(round.id);
      aviatorScore += roundScores.aviatorScore;
      producerScore += roundScores.producerScore;
    }

    return {
      aviatorScore,
      producerScore
    };
  }

  async calculatePlayerStats(tournamentId: number, playerId: number) {
    const player = await this.getPlayer(playerId);
    if (!player) throw new Error("Player not found");

    // This is a simplified method as we don't have a tournamentId field in matches
    // and the match_participants structure has changed
    return { wins: 0, losses: 0, draws: 0 };
  }

  async initializeData() {
    // Create default holes if they don't exist
    const existingHoles = await this.getHoles();
    if (existingHoles.length === 0) {
      const pars = [4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4];
      for (let i = 0; i < pars.length; i++) {
        await this.createHole({ number: i + 1, par: pars[i] });
      }
    }
    
    // Create tournament if it doesn't exist
    const existingTournament = await this.getTournament();
    if (!existingTournament) {
      await this.createTournament({
        name: "Rowdy Cup 2025",
        aviatorScore: 0,
        producerScore: 0,
        year: new Date().getFullYear()
      });
    }
  }
  
  // Helper method for holes
  async createHole(data: any) {
    const [row] = await db.insert(holes).values(data).returning();
    return row;
  }
}

// Final export
export const storage = new DBStorage();
// server/sw_storage.ts

import { swDb } from "./sw_db";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
  users,
  players,
  teams,
  matches,
  scores,
  match_players,
  rounds,
  tournament,
  holes,
  courses,
} from "@shared/sw_schema";
import { IStorage } from "./storage";

export class SWStorage implements IStorage {
  // Course methods
  async getCourses() {
    if (!swDb) return [];
    return swDb.select().from(courses);
  }

  async getCourse(id: number) {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(courses).where(eq(courses.id, id));
    return row;
  }

  async createCourse(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(courses).values(data).returning();
    return row;
  }

  // Hole methods
  async getHoles() {
    if (!swDb) return [];
    return swDb.select().from(holes);
  }
  
  async getHolesByCourse(courseId: number) {
    if (!swDb) return [];
    return swDb.select().from(holes).where(eq(holes.courseId, courseId));
  }

  // Users
  async getUsers() {
    if (!swDb) return [];
    return swDb.select().from(users);
  }

  async getUser(id: number) {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(users).where(eq(users.id, id));
    return row;
  }

  async getUserByUsername(username: string) {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(users).where(eq(users.username, username));
    return row;
  }

  async createUser(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(users).values(data).returning();
    return row;
  }
  
  async updateUser(id: number, data: Partial<any>) {
    if (!swDb) throw new Error("SW database not connected");
    const [updated] = await swDb
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  
  // Player methods
  async getPlayers() {
    if (!swDb) return [];
    return swDb.select().from(players);
  }
  
  async getPlayer(id: number) {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(players).where(eq(players.id, id));
    return row;
  }
  
  async createPlayer(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(players).values(data).returning();
    return row;
  }
  
  async updatePlayer(id: number, data: Partial<any>) {
    if (!swDb) throw new Error("SW database not connected");
    const [updated] = await swDb
      .update(players)
      .set(data)
      .where(eq(players.id, id))
      .returning();
    return updated;
  }
  
  async deletePlayer(id: number) {
    if (!swDb) throw new Error("SW database not connected");
    await swDb.delete(players).where(eq(players.id, id));
    return true;
  }
  
  async deleteAllPlayers() {
    if (!swDb) throw new Error("SW database not connected");
    await swDb.delete(players);
    return true;
  }
  
  // Team methods
  async getTeams() {
    if (!swDb) return [];
    return swDb.select().from(teams);
  }
  
  async getTeam(id: number) {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(teams).where(eq(teams.id, id));
    return row;
  }
  
  // Round methods
  async getRounds() {
    if (!swDb) return [];
    return swDb.select().from(rounds);
  }
  
  async getRound(id: number) {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(rounds).where(eq(rounds.id, id));
    return row;
  }
  
  async createRound(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(rounds).values(data).returning();
    return row;
  }
  
  async updateRound(id: number, data: Partial<any>) {
    if (!swDb) throw new Error("SW database not connected");
    // Update the round
    const [updated] = await swDb
      .update(rounds)
      .set(data)
      .where(eq(rounds.id, id))
      .returning();
      
    // If we're updating score or status, recalculate tournament scores
    if (data.aviatorScore !== undefined || data.producerScore !== undefined || data.isComplete !== undefined) {
      await this.updateTournamentScores();
    }
    
    return updated;
  }
  
  async deleteRound(id: number) {
    if (!swDb) throw new Error("SW database not connected");
    // First delete all matches associated with this round
    const matchesToDelete = await this.getMatchesByRound(id);
    for (const match of matchesToDelete) {
      await this.deleteMatch(match.id);
    }
    
    // Then delete the round itself
    await swDb.delete(rounds).where(eq(rounds.id, id));
  }
  
  async deleteAllRounds() {
    if (!swDb) throw new Error("SW database not connected");
    // First delete all matches, which will cascade to scores and participants
    const allMatches = await this.getMatches();
    for (const match of allMatches) {
      await this.deleteMatch(match.id);
    }
    
    // Then delete all rounds
    await swDb.delete(rounds);
  }
  
  // Match methods
  async getMatches() {
    if (!swDb) return [];
    return swDb.select().from(matches);
  }
  
  async getMatch(id: number) {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(matches).where(eq(matches.id, id));
    return row;
  }
  
  async getMatchesByRound(roundId: number) {
    if (!swDb) return [];
    return swDb.select().from(matches).where(eq(matches.roundId, roundId));
  }
  
  async createMatch(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(matches).values(data).returning();
    return row;
  }
  
  async updateMatch(id: number, data: Partial<any>) {
    if (!swDb) throw new Error("SW database not connected");
    const [updated] = await swDb
      .update(matches)
      .set(data)
      .where(eq(matches.id, id))
      .returning();
    
    // If this match is now complete, update the round and tournament scores
    if (data.status === 'complete' || data.result) {
      const match = await this.getMatch(id);
      if (match) {
        await this.updateRoundScores(match.roundId);
      }
    }
    
    return updated;
  }
  
  private async resetSequence(tableName: string) {
    if (!swDb) throw new Error("SW database not connected");
    // Skip for now as it's PostgreSQL-specific and might not be necessary
    return;
  }
  
  async deleteMatch(id: number) {
    if (!swDb) throw new Error("SW database not connected");
    // First delete all scores for this match
    await swDb.delete(scores).where(eq(scores.matchId, id));
    
    // Then delete all participants
    await swDb.delete(match_players).where(eq(match_players.matchId, id));
    
    // Finally delete the match itself
    await swDb.delete(matches).where(eq(matches.id, id));
    
    // No need to update scores since the match is deleted
  }
  
  async getMatchParticipants(matchId: number) {
    if (!swDb) return [];
    return swDb.select().from(match_players).where(eq(match_players.matchId, matchId));
  }
  
  async createMatchParticipant(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(match_players).values(data).returning();
    return row;
  }
  
  async getMatchWithParticipants(id: number) {
    if (!swDb) return undefined;
    const match = await this.getMatch(id);
    if (!match) return undefined;
    
    const participants = await this.getMatchParticipants(id);
    
    // Enrich participants with player data
    const enrichedParticipants = [];
    for (const participant of participants) {
      const player = await this.getPlayer(participant.playerId);
      enrichedParticipants.push({
        ...participant,
        player
      });
    }
    
    return {
      ...match,
      participants: enrichedParticipants
    };
  }
  
  // Score methods
  async getScores() {
    if (!swDb) return [];
    return swDb.select().from(scores);
  }
  
  async getScore(matchId: number, holeNumber: number) {
    if (!swDb) return undefined;
    const [row] = await swDb
      .select()
      .from(scores)
      .where(
        and(
          eq(scores.matchId, matchId),
          eq(scores.holeNumber, holeNumber)
        )
      );
    return row;
  }
  
  async getScoresByMatch(matchId: number) {
    if (!swDb) return [];
    return swDb
      .select()
      .from(scores)
      .where(eq(scores.matchId, matchId));
  }
  
  async createScore(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(scores).values(data).returning();
    
    // Update match state
    await this.updateMatchState(data.matchId);
    
    return row;
  }
  
  async updateScore(id: number, data: Partial<any>) {
    if (!swDb) throw new Error("SW database not connected");
    const [score] = await swDb
      .select()
      .from(scores)
      .where(eq(scores.id, id));
      
    if (!score) {
      throw new Error(`Score with ID ${id} not found`);
    }
    
    const [updated] = await swDb
      .update(scores)
      .set(data)
      .where(eq(scores.id, id))
      .returning();
    
    // Update match state
    await this.updateMatchState(updated.matchId);
    
    return updated;
  }
  
  async updateScoreAndMatch(id: number, data: Partial<any>) {
    if (!swDb) throw new Error("SW database not connected");
    // Update the score
    const updatedScore = await this.updateScore(id, data);
    
    // Return the updated score
    return updatedScore;
  }
  
  async createScoreAndMatch(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    // Create the score
    const newScore = await this.createScore(data);
    
    // Return the new score
    return newScore;
  }
  
  // Tournament methods
  async getTournament() {
    if (!swDb) return undefined;
    const [row] = await swDb.select().from(tournament);
    return row;
  }
  
  async createTournament(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    // First delete any existing tournament as there should only be one
    await swDb.delete(tournament);
    
    // Then create the new tournament
    const [row] = await swDb.insert(tournament).values({
      ...data,
      type: "sw-monthly",
    }).returning();
    
    return row;
  }
  
  async updateTournament(id: number, data: Partial<any>) {
    if (!swDb) throw new Error("SW database not connected");
    const [updated] = await swDb
      .update(tournament)
      .set(data)
      .where(eq(tournament.id, id))
      .returning();
    
    return updated;
  }
  
  // Private helper methods
  private async updateMatchState(matchId: number) {
    if (!swDb) throw new Error("SW database not connected");
    // Calculate match state based on scores
    const matchScores = await this.getScoresByMatch(matchId);
    const match = await this.getMatch(matchId);
    
    if (!match) {
      console.error(`Match with ID ${matchId} not found`);
      return;
    }
    
    // Calculate totals
    let aviatorTotal = 0;
    let producerTotal = 0;
    let leadingTeam = null;
    let leadAmount = 0;
    
    matchScores.forEach(score => {
      if (score.aviatorScore !== null && score.producerScore !== null) {
        if (score.aviatorScore < score.producerScore) {
          aviatorTotal++;
        } else if (score.producerScore < score.aviatorScore) {
          producerTotal++;
        }
        // Else it's a tie, no points
      }
    });
    
    // Determine leading team
    if (aviatorTotal > producerTotal) {
      leadingTeam = 'aviators';
      leadAmount = aviatorTotal - producerTotal;
    } else if (producerTotal > aviatorTotal) {
      leadingTeam = 'producers';
      leadAmount = producerTotal - aviatorTotal;
    }
    
    // Update match
    await swDb
      .update(matches)
      .set({
        leadingTeam,
        leadAmount
      })
      .where(eq(matches.id, matchId));
    
    // If this is round-based, update round scores
    await this.updateRoundScores(match.roundId);
  }
  
  private async updateRoundScores(roundId: number) {
    if (!swDb) throw new Error("SW database not connected");
    // Calculate scores for a round based on matches
    const roundMatches = await this.getMatchesByRound(roundId);
    
    let aviatorScore = 0;
    let producerScore = 0;
    let pendingMatches = 0;
    
    roundMatches.forEach(match => {
      if (match.result) {
        if (match.result === 'aviators') {
          aviatorScore++;
        } else if (match.result === 'producers') {
          producerScore++;
        } else if (match.result === 'tie') {
          aviatorScore += 0.5;
          producerScore += 0.5;
        }
      } else {
        pendingMatches++;
      }
    });
    
    // Update round
    await swDb
      .update(rounds)
      .set({
        aviatorScore: aviatorScore.toString(),
        producerScore: producerScore.toString()
      })
      .where(eq(rounds.id, roundId));
    
    // Update tournament scores
    await this.updateTournamentScores();
  }
  
  private async updateTournamentScores() {
    if (!swDb) throw new Error("SW database not connected");
    // Calculate tournament scores based on rounds
    const allRounds = await this.getRounds();
    
    let aviatorScore = 0;
    let producerScore = 0;
    let pendingAviatorScore = 0;
    let pendingProducerScore = 0;
    
    allRounds.forEach(round => {
      if (round.isComplete) {
        aviatorScore += Number(round.aviatorScore || 0);
        producerScore += Number(round.producerScore || 0);
      } else {
        pendingAviatorScore += Number(round.aviatorScore || 0);
        pendingProducerScore += Number(round.producerScore || 0);
      }
    });
    
    // Update tournament
    const tournamentData = await this.getTournament();
    if (tournamentData) {
      await swDb
        .update(tournament)
        .set({
          aviatorScore: aviatorScore.toString(),
          producerScore: producerScore.toString(),
          pendingAviatorScore: pendingAviatorScore.toString(),
          pendingProducerScore: pendingProducerScore.toString()
        })
        .where(eq(tournament.id, tournamentData.id));
    }
  }
  
  // Calculation methods
  async calculateRoundScores(roundId: number) {
    if (!swDb) throw new Error("SW database not connected");
    // Calculate scores for a round
    const roundMatches = await this.getMatchesByRound(roundId);
    
    let aviatorScore = 0;
    let producerScore = 0;
    let pendingAviatorScore = 0;
    let pendingProducerScore = 0;
    
    roundMatches.forEach(match => {
      if (match.status === 'complete') {
        if (match.result === 'aviators') {
          aviatorScore++;
        } else if (match.result === 'producers') {
          producerScore++;
        } else if (match.result === 'tie') {
          aviatorScore += 0.5;
          producerScore += 0.5;
        }
      } else {
        // For incomplete matches, calculate based on current lead
        if (match.leadingTeam === 'aviators') {
          pendingAviatorScore++;
        } else if (match.leadingTeam === 'producers') {
          pendingProducerScore++;
        }
        // If no leading team, it's currently a tie
      }
    });
    
    return {
      aviatorScore,
      producerScore,
      pendingAviatorScore,
      pendingProducerScore
    };
  }
  
  async calculateTournamentScores() {
    if (!swDb) throw new Error("SW database not connected");
    // Calculate tournament scores
    const allRounds = await this.getRounds();
    
    let aviatorScore = 0;
    let producerScore = 0;
    let pendingAviatorScore = 0;
    let pendingProducerScore = 0;
    
    for (const round of allRounds) {
      const roundScores = await this.calculateRoundScores(round.id);
      
      if (round.isComplete) {
        aviatorScore += roundScores.aviatorScore;
        producerScore += roundScores.producerScore;
      } else {
        pendingAviatorScore += roundScores.aviatorScore;
        pendingProducerScore += roundScores.producerScore;
      }
    }
    
    return {
      aviatorScore,
      producerScore,
      pendingAviatorScore,
      pendingProducerScore
    };
  }
  
  async calculatePlayerStats(
    tournamentId: number,
    playerId: number,
  ) {
    if (!swDb) throw new Error("SW database not connected");
    // Calculate statistics for a player
    const playerMatches = await swDb
      .select()
      .from(match_players)
      .where(eq(match_players.playerId, playerId));
    
    let wins = 0;
    let losses = 0;
    let draws = 0;
    
    for (const participation of playerMatches) {
      if (participation.result === 'win') {
        wins++;
      } else if (participation.result === 'loss') {
        losses++;
      } else if (participation.result === 'draw') {
        draws++;
      }
    }
    
    return { wins, losses, draws };
  }
  
  async initializeData() {
    if (!swDb) {
      console.warn("SW_DATABASE_URL not set. SW Monthly Golf features will be disabled.");
      return;
    }

    try {
      // Create courses table if it doesn't exist
      await swDb.select().from(courses).limit(1);
    } catch (error) {
      console.error("Error initializing SW database:", error);
      console.warn("SW database tables need to be created. Run migrations first.");
      return;
    }
    
    // Ensure there's a tournament
    await this.ensureTournamentExists();
    
    // Ensure there are teams
    await this.ensureTeamsExist();
    
    // Ensure admin user exists
    await this.ensureAdminUserExists();
  }
  
  // Helper methods for initialization
  async ensureTournamentExists() {
    if (!swDb) throw new Error("SW database not connected");
    // Create tournament if it doesn't exist
    const existingTournament = await this.getTournament();
    if (!existingTournament) {
      await this.createTournament({
        name: "SW Monthly Golf 2025",
        aviatorScore: 0,
        producerScore: 0,
        pendingAviatorScore: 0,
        pendingProducerScore: 0,
        year: new Date().getFullYear(),
        type: "sw-monthly",
      });
    }
  }
  
  async ensureTeamsExist() {
    if (!swDb) throw new Error("SW database not connected");
    // Create teams if they don't exist
    const existingTeams = await this.getTeams();
    if (existingTeams.length === 0) {
      await swDb.insert(teams).values({
        name: "The Aviators",
        shortName: "aviators",
        colorCode: "#004A7F", // Dark blue
      });
      
      await swDb.insert(teams).values({
        name: "The Producers",
        shortName: "producers",
        colorCode: "#800000", // Maroon
      });
    }
  }
  
  // Ensures an admin user exists in the system
  async ensureAdminUserExists() {
    if (!swDb) throw new Error("SW database not connected");
    const adminUsername = "superadmin";
    const existingAdmin = await this.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      // Create a new admin user
      await this.createUser({
        username: adminUsername,
        passcode: "$2b$10$LLNIo.a42c8YTxffFVi0wezkcKquF.JPizZQ9XnZ.JMYgg4PH/XOy", // "1111" hashed
        isAdmin: true,
        needsPasswordChange: true
      });
      console.log("Created new admin user in SW database");
    }
  }
  
  async createHole(data: any) {
    if (!swDb) throw new Error("SW database not connected");
    const [row] = await swDb.insert(holes).values(data).returning();
    return row;
  }
}

export const swStorage = new SWStorage();
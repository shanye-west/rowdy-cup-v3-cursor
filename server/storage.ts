// server/storage.ts

import { db } from "./db";
import { eq, and, isNull } from "drizzle-orm";
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
} from "@shared/schema";

export interface IStorage {
  // Course methods
  getCourses(): Promise<any[]>;
  getCourse(id: number): Promise<any | undefined>;
  createCourse(data: any): Promise<any>;
  
  // Hole methods
  getHoles(): Promise<any[]>;
  getHolesByCourse(courseId: number): Promise<any[]>;
  createHole(data: any): Promise<any>;
  
  // User methods
  getUsers(): Promise<any[]>;
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(data: any): Promise<any>;
  updateUser(id: number, data: Partial<any>): Promise<any | undefined>;

  // Player methods
  getPlayers(): Promise<any[]>;
  getPlayer(id: number): Promise<any | undefined>;
  createPlayer(data: any): Promise<any>;
  updatePlayer(id: number, data: Partial<any>): Promise<any | undefined>;
  deletePlayer(id: number): Promise<boolean>;
  deleteAllPlayers(): Promise<boolean>;

  // Team methods
  getTeams(): Promise<any[]>;
  getTeam(id: number): Promise<any | undefined>;

  // Round methods
  getRounds(): Promise<any[]>;
  getRound(id: number): Promise<any | undefined>;
  createRound(data: any): Promise<any>;
  updateRound(id: number, data: Partial<any>): Promise<any | undefined>;
  deleteRound(id: number): Promise<void>;
  deleteAllRounds(): Promise<void>;

  // Match methods
  getMatches(): Promise<any[]>;
  getMatch(id: number): Promise<any | undefined>;
  getMatchWithParticipants(id: number): Promise<any | undefined>;
  getMatchesByRound(roundId: number): Promise<any[]>;
  createMatch(data: any): Promise<any>;
  updateMatch(id: number, data: Partial<any>): Promise<any | undefined>;
  deleteMatch(id: number): Promise<void>;

  // Match participant methods
  getMatchParticipants(matchId: number): Promise<any[]>;
  createMatchParticipant(data: any): Promise<any>;

  // Score methods
  getScores(): Promise<any[]>;
  getScore(matchId: number, holeNumber: number): Promise<any | undefined>;
  getScoresByMatch(matchId: number): Promise<any[]>;
  createScore(data: any): Promise<any>;
  updateScore(id: number, data: Partial<any>): Promise<any | undefined>;
  updateScoreAndMatch(id: number, data: Partial<any>): Promise<any>;
  createScoreAndMatch(data: any): Promise<any>;

  // Tournament methods
  getTournament(): Promise<any | undefined>;
  createTournament(data: any): Promise<any>;
  updateTournament(id: number, data: Partial<any>): Promise<any | undefined>;

  // Calculation methods
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

  calculatePlayerStats(
    tournamentId: number,
    playerId: number,
  ): Promise<{ wins: number; losses: number; draws: number }>;

  initializeData(): Promise<void>;
}

export class DBStorage implements IStorage {
  // Course methods
  async getCourses() {
    return db.select().from(courses);
  }

  async getCourse(id: number) {
    const [row] = await db.select().from(courses).where(eq(courses.id, id));
    return row;
  }

  async createCourse(data: any) {
    const [row] = await db.insert(courses).values(data).returning();
    return row;
  }

  // Hole methods
  async getHoles() {
    return db.select().from(holes);
  }
  
  async getHolesByCourse(courseId: number) {
    return db.select().from(holes).where(eq(holes.courseId, courseId));
  }

  // Users
  async getUsers() {
    return db.select().from(users);
  }

  async getUser(id: number) {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }

  async getUserByUsername(username: string) {
    const [row] = await db.select().from(users).where(eq(users.username, username));
    return row;
  }

  async createUser(data: any) {
    const [row] = await db.insert(users).values(data).returning();
    return row;
  }
  
  async updateUser(id: number, data: Partial<any>) {
    const [row] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return row;
  }

  // Players
  async getPlayers() {
    return db.select().from(players);
  }

  async getPlayer(id: number) {
    // Add validation to ensure id is a valid number before querying
    if (typeof id !== 'number' || isNaN(id)) {
      console.error(`Invalid player ID: ${id}`);
      return undefined;
    }

    try {
      const [row] = await db.select().from(players).where(eq(players.id, id));
      return row;
    } catch (error) {
      console.error(`Error getting player ${id}:`, error);
      return undefined;
    }
  }

  async createPlayer(data: any) {
    // Start a transaction to ensure both player and user are created together
    const result = await db.transaction(async (tx) => {
      // Format username as firstnamelastname (all lowercase, no spaces)
      const name = data.name || '';
      const username = name.toLowerCase().replace(/\s+/g, '');

      // First create a user for this player
      const [user] = await tx.insert(users).values({
        username: username, // Username as firstnamelastname
        passcode: "1111", // Default 4-digit PIN
        isAdmin: false,
        needsPasswordChange: true, // Require password change on first login
      }).returning();

      // Then create the player with reference to the user
      const [player] = await tx.insert(players).values({
        ...data,
        userId: user.id // Link player to user
      }).returning();

      // Update the user with the player reference to create bi-directional link
      await tx.update(users)
        .set({ playerId: player.id })
        .where(eq(users.id, user.id));

      return { ...player, user };
    });

    return result;
  }

  async updatePlayer(id: number, data: Partial<any>) {
    const [updatedPlayer] = await db
      .update(players)
      .set(data)
      .where(eq(players.id, id))
      .returning();

    // If player name has changed, update the associated user's name too
    if (data.name && updatedPlayer.userId) {
      const username = data.name.toLowerCase().replace(/\s+/g, '');
      await db
        .update(users)
        .set({ username: username })
        .where(eq(users.id, updatedPlayer.userId));
    }

    return updatedPlayer;
  }

  async deletePlayer(id: number) {
    // Find player to get userId
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.id, id));

    if (player && player.userId) {
      // Delete associated match participants first
      await db
        .delete(match_players)
        .where(eq(match_players.playerId, id));

      // Then delete the player
      await db
        .delete(players)
        .where(eq(players.id, id));

      // Finally delete the user
      await db
        .delete(users)
        .where(eq(users.id, player.userId));

      // Reset sequences
      await this.resetSequence('players');
      await this.resetSequence('users');

      return true;
    }

    return false;
  }

  async deleteAllPlayers() {
    try {
      // Start a transaction for deletion operations
      await db.transaction(async (tx) => {
        // First get all player IDs with their userIds for deletion
        const allPlayers = await tx.select({
          id: players.id,
          userId: players.userId
        }).from(players);

        // Delete all match participants first (foreign key constraint)
        await tx.delete(match_players);

        // Then delete all players
        await tx.delete(players);

        // Finally delete all associated users
        for (const player of allPlayers) {
          if (player.userId) {
            await tx.delete(users).where(eq(users.id, player.userId));
          }
        }
      });

      return true;
    } catch (error) {
      console.error("Error deleting all players:", error);
      return false;
    }
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
    // First get the basic rounds data
    const roundsData = await db
      .select()
      .from(rounds)
      .where(isNull(rounds.status));
      
    // For each round, calculate and add pending scores
    const enhancedRounds = await Promise.all(
      roundsData.map(async (round) => {
        const scores = await this.calculateRoundScores(round.id);
        return {
          ...round,
          pendingAviatorScore: scores.pendingAviatorScore || 0,
          pendingProducerScore: scores.pendingProducerScore || 0
        };
      })
    );
    
    return enhancedRounds;
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
  
  async deleteRound(id: number) {
    try {
      // Start transaction for deletion operations
      await db.transaction(async (tx) => {
        // Get all matches in this round
        const roundMatches = await tx
          .select()
          .from(matches)
          .where(eq(matches.roundId, id));
        
        // For each match, delete scores and participants
        for (const match of roundMatches) {
          // Delete scores first
          await tx
            .delete(scores)
            .where(eq(scores.matchId, match.id));
          
          // Delete match participants
          await tx
            .delete(match_players)
            .where(eq(match_players.matchId, match.id));
        }
        
        // Delete all matches in the round
        await tx
          .delete(matches)
          .where(eq(matches.roundId, id));
        
        // Finally delete the round itself
        await tx
          .delete(rounds)
          .where(eq(rounds.id, id));
      });
      
      // Reset sequences using direct SQL
      await db.execute(`SELECT SETVAL('matches_id_seq', COALESCE((SELECT MAX(id) FROM matches), 0) + 1, false)`);
      await db.execute(`SELECT SETVAL('scores_id_seq', COALESCE((SELECT MAX(id) FROM scores), 0) + 1, false)`);
      await db.execute(`SELECT SETVAL('match_participants_id_seq', COALESCE((SELECT MAX(id) FROM match_participants), 0) + 1, false)`);
      await db.execute(`SELECT SETVAL('rounds_id_seq', COALESCE((SELECT MAX(id) FROM rounds), 0) + 1, false)`);
      
      console.log(`Successfully deleted round ID: ${id} from database`);
    } catch (error) {
      console.error(`Error deleting round ID: ${id}:`, error);
      throw error;
    }
  }
  
  async deleteAllRounds() {
    // Start transaction for deletion operations
    await db.transaction(async (tx) => {
      // Delete all scores first (foreign key constraint)
      await tx.delete(scores);
      
      // Delete all match participants
      await tx.delete(match_players);
      
      // Delete all matches
      await tx.delete(matches);
      
      // Delete all rounds
      await tx.delete(rounds);
    });
    
    // Reset sequences
    await this.resetSequence('matches');
    await this.resetSequence('scores');
    await this.resetSequence('match_participants');
    await this.resetSequence('rounds');
    
    // Update tournament scores to zero
    const tournament = await this.getTournament();
    if (tournament) {
      await this.updateTournament(tournament.id, {
        aviatorScore: 0,
        producerScore: 0
      });
    }
  }

  // Matches
  async getMatches() {
    return db
      .select({
        id: matches.id,
        roundId: matches.roundId,
        name: matches.name,
        status: matches.status,
        currentHole: matches.currentHole,
        leadingTeam: matches.leadingTeam,
        leadAmount: matches.leadAmount,
        result: matches.result,
        locked: matches.locked,
      })
      .from(matches);
  }

  async getMatch(id: number) {
    const [row] = await db
      .select({
        id: matches.id,
        roundId: matches.roundId,
        name: matches.name,
        status: matches.status,
        currentHole: matches.currentHole,
        leadingTeam: matches.leadingTeam,
        leadAmount: matches.leadAmount,
        result: matches.result,
        locked: matches.locked,
      })
      .from(matches)
      .where(eq(matches.id, id));
    return row;
  }

  async getMatchesByRound(roundId: number) {
    // First get the basic match data
    const matchesData = await db
      .select({
        id: matches.id,
        roundId: matches.roundId,
        name: matches.name,
        status: matches.status,
        currentHole: matches.currentHole,
        leadingTeam: matches.leadingTeam,
        leadAmount: matches.leadAmount,
        result: matches.result,
        locked: matches.locked,
      })
      .from(matches)
      .where(eq(matches.roundId, roundId));
      
    // For each match, get the participants and enhance with player names
    const enhancedMatches = await Promise.all(
      matchesData.map(async (match) => {
        const participants = await this.getMatchParticipants(match.id);
        
        // Get player details for each participant
        const detailedPlayers = await Promise.all(
          participants.map(async (mp) => {
            const player = await this.getPlayer(mp.playerId);
            return {
              ...mp,
              playerName: player?.name || 'Unknown',
            };
          })
        );
        
        // Group players by team
        const aviatorPlayers = detailedPlayers
          .filter(mp => mp.team === 'aviators')
          .map(mp => mp.playerName)
          .join(', ');
          
        const producerPlayers = detailedPlayers
          .filter(mp => mp.team === 'producers')
          .map(mp => mp.playerName)
          .join(', ');
          
        // Return enhanced match with player names
        return {
          ...match,
          aviatorPlayers,
          producerPlayers
        };
      })
    );
    
    return enhancedMatches;
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

  private async resetSequence(tableName: string) {
    // Get the max ID from the table
    const result = await db.execute(
      `SELECT COALESCE(MAX(id), 0) + 1 AS max_id FROM "${tableName}"`
    );
    const maxId = result.rows[0].max_id;
    
    // Reset the sequence to the next available ID
    await db.execute(
      `ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH ${maxId}`
    );
  }

  async deleteMatch(id: number) {
    try {
      await db.transaction(async (tx) => {
        // Delete all scores for this match
        await tx.delete(scores)
          .where(eq(scores.matchId, id));

        // Delete all match participants
        await tx.delete(match_players)
          .where(eq(match_players.matchId, id));

        // Delete the match itself
        await tx.delete(matches)
          .where(eq(matches.id, id));
      });

      // Reset sequences
      await db.execute(`SELECT SETVAL('scores_id_seq', COALESCE((SELECT MAX(id) FROM scores), 0) + 1, false)`);
      await db.execute(`SELECT SETVAL('match_participants_id_seq', COALESCE((SELECT MAX(id) FROM match_participants), 0) + 1, false)`);
      await db.execute(`SELECT SETVAL('matches_id_seq', COALESCE((SELECT MAX(id) FROM matches), 0) + 1, false)`);

      console.log(`Successfully deleted match ID: ${id} from database`);
    } catch (error) {
      console.error(`Error deleting match ID: ${id}:`, error);
      throw error;
    }
  }

  // Match Players
  async getMatchParticipants(matchId: number) {
    return db
      .select({
        matchId: match_players.matchId,
        playerId: match_players.playerId,
        team: match_players.team,
        result: match_players.result,
      })
      .from(match_players)
      .where(eq(match_players.matchId, matchId));
  }

  async createMatchParticipant(data: any) {
    // Check if player is already participating in a match in this round
    const match = await this.getMatch(data.matchId);
    if (!match) {
      throw new Error("Match not found");
    }
    
    const roundId = match.roundId;
    
    // Get all matches in this round
    const matchesInRound = await this.getMatchesByRound(roundId);
    
    // Get all match participants for matches in this round
    let playerAlreadyInRound = false;
    for (const roundMatch of matchesInRound) {
      const participants = await this.getMatchParticipants(roundMatch.id);
      
      // Check if player is already participating in any match in this round
      const existingParticipant = participants.find(p => p.playerId === data.playerId);
      if (existingParticipant) {
        playerAlreadyInRound = true;
        break;
      }
    }
    
    if (playerAlreadyInRound) {
      throw new Error("Player is already participating in a match in this round");
    }
    
    // If not already participating, add the player to the match
    const [row] = await db.insert(match_players).values(data).returning();
    return row;
  }

  // Get match with players info
  async getMatchWithParticipants(id: number) {
    const match = await this.getMatch(id);
    if (!match) return undefined;

    // Query to get match participants with player details
    const matchParticipants = await db
      .select({
        matchId: match_players.matchId,
        playerId: match_players.playerId,
        team: match_players.team,
      })
      .from(match_players)
      .where(eq(match_players.matchId, id));

    // Get full player details
    const detailedPlayers = await Promise.all(
      matchParticipants.map(async (mp) => {
        const player = await this.getPlayer(mp.playerId);
        return {
          ...mp,
          playerName: player?.name || 'Unknown',
        };
      })
    );

    // Group players by team for backward compatibility
    const aviatorPlayers = detailedPlayers
      .filter(mp => mp.team === 'aviators')
      .map(mp => mp.playerName)
      .join(', ');

    const producerPlayers = detailedPlayers
      .filter(mp => mp.team === 'producers')
      .map(mp => mp.playerName)
      .join(', ');

    // Return enhanced match with player info
    return {
      ...match,
      aviatorPlayers,
      producerPlayers,
      participants: detailedPlayers
    };
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
        // Use Number() to convert to numeric without type errors
        const aviatorNum = Number(score.aviatorScore);
        const producerNum = Number(score.producerScore);
        if (aviatorNum < producerNum) {
          aviatorWins += 1;
        } else if (producerNum < aviatorNum) {
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
    const completedHoles = matchScores.filter(
      (s) => s.aviatorScore !== null && s.producerScore !== null,
    ).length;

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

    // If the match was just completed, update player stats
    if (status === "completed" && match.status !== "completed") {
      // Get all participants in this match
      const participants = await this.getMatchParticipants(matchId);
      
      // Update each player's stats
      for (const participant of participants) {
        const player = await this.getPlayer(participant.playerId);
        if (player) {
          let wins = player.wins || 0;
          let losses = player.losses || 0;
          let ties = player.ties || 0;
          
          if (leadingTeam === participant.team) {
            // Player's team won
            wins++;
          } else if (leadingTeam === null) {
            // Match was tied
            ties++;
          } else {
            // Player's team lost
            losses++;
          }
          
          // Update player stats
          await this.updatePlayer(player.id, { wins, losses, ties });
        }
      }
    }

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
    // Only select the specific columns we need to avoid issues with missing columns
    const matchesByRound = await db
      .select({
        id: matches.id,
        status: matches.status,
        leadingTeam: matches.leadingTeam,
      })
      .from(matches)
      .where(eq(matches.roundId, roundId));

    let aviatorScore = 0;
    let producerScore = 0;
    let pendingAviatorScore = 0;
    let pendingProducerScore = 0;

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
      } else if (match.status === "in_progress") {
        if (match.leadingTeam === "aviators") {
          pendingAviatorScore += 1;
        } else if (match.leadingTeam === "producers") {
          pendingProducerScore += 1;
        } else {
          // In progress but currently tied
          pendingAviatorScore += 0.5;
          pendingProducerScore += 0.5;
        }
      }
    }

    return {
      aviatorScore,
      producerScore,
      pendingAviatorScore,
      pendingProducerScore,
    };
  }

  async calculateTournamentScores() {
    const allRounds = await db.select().from(rounds);

    let aviatorScore = 0;
    let producerScore = 0;
    let pendingAviatorScore = 0;
    let pendingProducerScore = 0;

    for (const round of allRounds) {
      const roundScores = await this.calculateRoundScores(round.id);
      aviatorScore += roundScores.aviatorScore;
      producerScore += roundScores.producerScore;
      pendingAviatorScore += roundScores.pendingAviatorScore;
      pendingProducerScore += roundScores.pendingProducerScore;
    }

    return {
      aviatorScore,
      producerScore,
      pendingAviatorScore,
      pendingProducerScore,
    };
  }

  async calculatePlayerStats(tournamentId: number, playerId: number) {
    const player = await this.getPlayer(playerId);
    if (!player) throw new Error("Player not found");

    // Find all matches the player participated in
    const playerMatches = await db
      .select({
        matchId: match_players.matchId,
        team: match_players.team,
      })
      .from(match_players)
      .where(eq(match_players.playerId, playerId));
      
    let wins = 0;
    let losses = 0;
    let ties = 0;
    
    // Go through each match and check the result
    for (const participation of playerMatches) {
      const match = await this.getMatch(participation.matchId);
      
      // Only count completed matches
      if (match && match.status === "completed") {
        if (match.leadingTeam === participation.team) {
          // Player's team won
          wins++;
        } else if (match.leadingTeam === null) {
          // Match was tied
          ties++;
        } else {
          // Player's team lost
          losses++;
        }
      }
    }
    
    return { wins, losses, draws: ties };
  }

  async initializeData() {
    // Create default course if it doesn't exist
    const existingCourses = await this.getCourses();
    let defaultCourseId = 1;
    
    if (existingCourses.length === 0) {
      const newCourse = await this.createCourse({
        name: "TPC Sawgrass",
        location: "Ponte Vedra Beach, FL",
        description: "Home of THE PLAYERS Championship"
      });
      defaultCourseId = newCourse.id;
      
      // Add a second course
      await this.createCourse({
        name: "Pebble Beach Golf Links",
        location: "Pebble Beach, CA",
        description: "Iconic coastal course"
      });
    } else {
      defaultCourseId = existingCourses[0].id;
    }

    // Create default holes if they don't exist
    const existingHoles = await this.getHoles();
    if (existingHoles.length === 0) {
      const pars = [4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4];
      for (let i = 0; i < pars.length; i++) {
        await this.createHole({ 
          number: i + 1, 
          par: pars[i],
          courseId: defaultCourseId
        });
      }
    }

    // Create tournament if it doesn't exist
    const existingTournament = await this.getTournament();
    if (!existingTournament) {
      await this.createTournament({
        name: "Rowdy Cup 2025",
        aviatorScore: 0,
        producerScore: 0,
        pendingAviatorScore: 0,
        pendingProducerScore: 0,
        year: new Date().getFullYear(),
      });
    }
    
    // Create teams if they don't exist
    const existingTeams = await this.getTeams();
    if (existingTeams.length === 0) {
      await db.insert(teams).values({
        name: "The Aviators",
        shortName: "aviators",
        colorCode: "#004A7F", // Dark blue
      });
      
      await db.insert(teams).values({
        name: "The Producers",
        shortName: "producers",
        colorCode: "#800000", // Maroon
      });
    }
    
    // Ensure admin user exists
    await this.ensureAdminUserExists();
  }
  
  // Ensures an admin user exists in the system
  async ensureAdminUserExists() {
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
      console.log("Created new admin user");
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
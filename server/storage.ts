// server/storage.ts

import { db } from "./db";
import { eq, and, isNull, not, sql } from "drizzle-orm";
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
  player_course_handicaps,
  tournament_player_stats,
  tournament_history,
  player_career_stats,
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

  // Tournament history methods
  getTournamentHistory(): Promise<any[]>;
  getTournamentHistoryEntry(id: number): Promise<any | undefined>;
  createTournamentHistoryEntry(data: any): Promise<any>;
  
  // Tournament player stats methods
  getTournamentPlayerStats(tournamentId: number): Promise<any[]>;
  getPlayerTournamentStats(playerId: number, tournamentId: number): Promise<any | undefined>;
  updatePlayerTournamentStats(playerId: number, tournamentId: number, stats: any): Promise<any>;
  
  // Player career stats methods
  getPlayerCareerStats(playerId: number): Promise<any | undefined>;
  updatePlayerCareerStats(playerId: number, stats: any): Promise<any>;
  
  // Stats calculations methods
  calculateAndUpdatePlayerStats(playerId: number, tournamentId: number): Promise<any>;
  calculateAndUpdateAllPlayerStats(tournamentId: number): Promise<any[]>;
  updateTournamentHistory(tournamentId: number): Promise<any>;

  // Handicap system methods
  updateCourseRatings(courseId: number, data: { courseRating: number, slopeRating: number, par: number }): Promise<any>;
  updateHoleHandicapRank(holeId: number, handicapRank: number): Promise<any>;
  calculateCourseHandicap(playerId: number, roundId: number): Promise<number>;
  getPlayerCourseHandicap(playerId: number, roundId: number): Promise<any>;
  getHoleHandicapStrokes(playerId: number, roundId: number, holeNumber: number): Promise<number>;
  storePlayerCourseHandicap(playerId: number, roundId: number, courseHandicap: number): Promise<any>;
  getAllPlayerCourseHandicaps(roundId: number): Promise<any[]>;
  
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

      // Process the player data - convert handicapIndex if needed
      const playerData = { ...data };
      
      // Ensure handicapIndex is properly typed for database
      if (playerData.handicapIndex !== undefined && playerData.handicapIndex !== null) {
        // Make sure it's saved as a number in the database
        playerData.handicapIndex = typeof playerData.handicapIndex === 'string' 
          ? parseFloat(playerData.handicapIndex) 
          : Number(playerData.handicapIndex);
      }

      // Then create the player with reference to the user
      const [player] = await tx.insert(players).values({
        ...playerData,
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
    // Process the player data - convert handicapIndex if needed
    const playerData = { ...data };
    
    // Ensure handicapIndex is properly typed for database
    if (playerData.handicapIndex !== undefined && playerData.handicapIndex !== null) {
      // Make sure it's saved as a number in the database
      playerData.handicapIndex = typeof playerData.handicapIndex === 'string' 
        ? parseFloat(playerData.handicapIndex) 
        : Number(playerData.handicapIndex);
    }
    
    const [updatedPlayer] = await db
      .update(players)
      .set(playerData)
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
    try {
      // Find player to get userId
      const [player] = await db
        .select()
        .from(players)
        .where(eq(players.id, id));

      if (player && player.userId) {
        // First, update user to remove playerId reference (resolves FK constraint)
        await db
          .update(users)
          .set({ playerId: null })
          .where(eq(users.id, player.userId));

        // Delete associated match participants
        await db
          .delete(match_players)
          .where(eq(match_players.playerId, id));

        // Delete the player
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
    } catch (error) {
      console.error("Error in deletePlayer:", error);
      throw error;
    }
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

        // First, remove references from user table to avoid FK constraint violations
        await tx
          .update(users)
          .set({ playerId: null })
          .where(not(isNull(users.playerId)));

        // Delete all match participants (foreign key constraint)
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

      // Reset sequences
      await this.resetSequence('players');
      await this.resetSequence('users');
      await this.resetSequence('match_participants');

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
        
        // Delete all player course handicaps for this round (this was causing foreign key constraint errors)
        await tx
          .delete(player_course_handicaps)
          .where(eq(player_course_handicaps.roundId, id));
        
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
      await db.execute(`SELECT SETVAL('player_course_handicaps_id_seq', COALESCE((SELECT MAX(id) FROM player_course_handicaps), 0) + 1, false)`);
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
      
      // Delete all player course handicaps
      await tx.delete(player_course_handicaps);
      
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
    await this.resetSequence('player_course_handicaps');
    
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
  
  // Tournament history methods
  async getTournamentHistory() {
    return db.select().from(tournament_history);
  }
  
  async getTournamentHistoryEntry(id: number) {
    const [row] = await db
      .select()
      .from(tournament_history)
      .where(eq(tournament_history.id, id));
    return row;
  }
  
  async createTournamentHistoryEntry(data: any) {
    const [row] = await db
      .insert(tournament_history)
      .values(data)
      .returning();
    return row;
  }
  
  // Tournament player stats methods
  async getTournamentPlayerStats(tournamentId: number) {
    return db
      .select()
      .from(tournament_player_stats)
      .where(eq(tournament_player_stats.tournamentId, tournamentId));
  }
  
  async getPlayerTournamentStats(playerId: number, tournamentId: number) {
    const [row] = await db
      .select()
      .from(tournament_player_stats)
      .where(
        and(
          eq(tournament_player_stats.playerId, playerId),
          eq(tournament_player_stats.tournamentId, tournamentId)
        )
      );
    return row;
  }
  
  async updatePlayerTournamentStats(playerId: number, tournamentId: number, stats: any) {
    // Check if stats already exist for this player/tournament
    const existingStats = await this.getPlayerTournamentStats(playerId, tournamentId);
    
    if (existingStats) {
      // Update existing stats
      const [row] = await db
        .update(tournament_player_stats)
        .set(stats)
        .where(
          and(
            eq(tournament_player_stats.playerId, playerId),
            eq(tournament_player_stats.tournamentId, tournamentId)
          )
        )
        .returning();
      return row;
    } else {
      // Create new stats
      const [row] = await db
        .insert(tournament_player_stats)
        .values({
          playerId,
          tournamentId,
          ...stats
        })
        .returning();
      return row;
    }
  }
  
  // Player career stats methods
  async getPlayerCareerStats(playerId: number) {
    const [row] = await db
      .select()
      .from(player_career_stats)
      .where(eq(player_career_stats.playerId, playerId));
    return row;
  }
  
  async updatePlayerCareerStats(playerId: number, stats: any) {
    // Check if career stats already exist for this player
    const existingStats = await this.getPlayerCareerStats(playerId);
    
    if (existingStats) {
      // Update existing stats
      const [row] = await db
        .update(player_career_stats)
        .set({
          ...stats,
          lastUpdated: new Date() // Update the lastUpdated timestamp
        })
        .where(eq(player_career_stats.playerId, playerId))
        .returning();
      return row;
    } else {
      // Create new career stats
      const [row] = await db
        .insert(player_career_stats)
        .values({
          playerId,
          ...stats,
          lastUpdated: new Date()
        })
        .returning();
      return row;
    }
  }
  
  // Stats calculations methods
  async calculateAndUpdatePlayerStats(playerId: number, tournamentId: number) {
    // Get basic stats (wins, losses, ties)
    const basicStats = await this.calculatePlayerStats(tournamentId, playerId);
    
    // Calculate points (1 point for win, 0.5 for tie, 0 for loss)
    const points = basicStats.wins + (basicStats.draws * 0.5);
    
    // Get completed match count
    const matchCount = basicStats.wins + basicStats.losses + basicStats.draws;
    
    // Update tournament stats for this player
    const tournamentStats = await this.updatePlayerTournamentStats(playerId, tournamentId, {
      wins: basicStats.wins,
      losses: basicStats.losses,
      ties: basicStats.draws,
      points: points.toString(), // Convert to string for numeric type
      matchesPlayed: matchCount
    });
    
    // Update career stats
    // First, get all tournament stats for this player
    const allTournamentStats = await db
      .select()
      .from(tournament_player_stats)
      .where(eq(tournament_player_stats.playerId, playerId));
    
    // Calculate career totals
    const careerTotals = allTournamentStats.reduce((totals, tournStat) => {
      return {
        totalWins: totals.totalWins + Number(tournStat.wins || 0),
        totalLosses: totals.totalLosses + Number(tournStat.losses || 0),
        totalTies: totals.totalTies + Number(tournStat.ties || 0),
        totalPoints: totals.totalPoints + Number(tournStat.points || 0),
        matchesPlayed: totals.matchesPlayed + Number(tournStat.matchesPlayed || 0),
        tournamentsPlayed: totals.tournamentsPlayed
      };
    }, {
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      totalPoints: 0,
      matchesPlayed: 0,
      tournamentsPlayed: 0
    });
    
    // Add tournament count
    careerTotals.tournamentsPlayed = allTournamentStats.length;
    
    // Convert total points to a number (not a string)
    const careerTotalsForDb = {
      ...careerTotals,
      totalPoints: Number(careerTotals.totalPoints)
    };
    
    // Update player career stats
    const careerStats = await this.updatePlayerCareerStats(playerId, careerTotalsForDb);
    
    return {
      tournamentStats,
      careerStats
    };
  }
  
  async calculateAndUpdateAllPlayerStats(tournamentId: number) {
    // Get all players
    const allPlayers = await this.getPlayers();
    
    // Calculate and update stats for each player
    const results = [];
    for (const player of allPlayers) {
      const result = await this.calculateAndUpdatePlayerStats(player.id, tournamentId);
      results.push({
        playerId: player.id,
        playerName: player.name,
        ...result
      });
    }
    
    return results;
  }
  
  async updateTournamentHistory(tournamentId: number) {
    // Get tournament data
    const tournamentData = await this.getTournament();
    if (!tournamentData) {
      throw new Error("Tournament not found");
    }
    
    // Check if history entry already exists
    const [existingEntry] = await db
      .select()
      .from(tournament_history)
      .where(eq(tournament_history.tournamentId, tournamentId));
    
    const currentYear = new Date().getFullYear();
    
    // Determine winning team
    let winningTeam = null;
    // Convert scores to numbers for safe comparison
    const aviatorScore = Number(tournamentData.aviatorScore || 0);
    const producerScore = Number(tournamentData.producerScore || 0);
    
    if (aviatorScore > producerScore) {
      winningTeam = "aviators";
    } else if (producerScore > aviatorScore) {
      winningTeam = "producers";
    }
    
    const historyData = {
      year: currentYear,
      tournamentName: tournamentData.name,
      winningTeam,
      aviatorScore: aviatorScore.toString(),
      producerScore: producerScore.toString(),
      tournamentId
      // location field removed as it's not part of Tournament schema
    };
    
    if (existingEntry) {
      // Update existing entry
      const [updatedEntry] = await db
        .update(tournament_history)
        .set(historyData)
        .where(eq(tournament_history.id, existingEntry.id))
        .returning();
      return updatedEntry;
    } else {
      // Create new entry
      const [newEntry] = await db
        .insert(tournament_history)
        .values(historyData)
        .returning();
      return newEntry;
    }
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
    const adminUsername = "admin";
    const existingAdmin = await this.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      // Create a new admin user
      await this.createUser({
        username: adminUsername,
        passcode: "$2b$10$LLNIo.a42c8YTxffFVi0wezkcKquF.JPizZQ9XnZ.JMYgg4PH/XOy", // "1111" hashed
        isAdmin: true,
        needsPasswordChange: false
      });
      console.log("Created new admin user with username: admin and PIN: 1111");
    }
  }

  // Helper method for holes
  async createHole(data: any) {
    const [row] = await db.insert(holes).values(data).returning();
    return row;
  }

  // Handicap system methods
  // Method removed: updatePlayerHandicapIndex 
  // We no longer store handicap index in the players table
  // Instead, we directly store course handicaps in the player_course_handicaps table

  async updateCourseRatings(courseId: number, data: { courseRating: number, slopeRating: number, par: number }) {
    try {
      const [row] = await db
        .update(courses)
        .set({
          courseRating: data.courseRating.toString(), // Keep as string since schema expects string
          slopeRating: data.slopeRating,
          par: data.par
        })
        .where(eq(courses.id, courseId))
        .returning();
      return row;
    } catch (error) {
      console.error("Error updating course ratings:", error);
      throw error;
    }
  }

  async updateHoleHandicapRank(holeId: number, handicapRank: number) {
    const [row] = await db
      .update(holes)
      .set({ handicapRank })
      .where(eq(holes.id, holeId))
      .returning();
    return row;
  }

  async calculateCourseHandicap(playerId: number, roundId: number): Promise<number> {
    // This method is now simplified since handicaps are manually entered
    // and stored directly in player_course_handicaps table
    
    // Check if we already have a stored handicap with the roundId
    const [storedHandicap] = await db
      .select()
      .from(player_course_handicaps)
      .where(
        and(
          eq(player_course_handicaps.playerId, playerId),
          eq(player_course_handicaps.roundId, roundId)
        )
      );
      
    if (storedHandicap) {
      return storedHandicap.courseHandicap;
    }
    
    // If no handicap is found, return 0 (no handicap)
    // The admin will need to manually enter course handicaps
    return 0;
  }

  async getPlayerCourseHandicap(playerId: number, roundId: number) {
    try {
      // Check if we have a stored handicap with the roundId
      const [storedHandicap] = await db
        .select()
        .from(player_course_handicaps)
        .where(
          and(
            eq(player_course_handicaps.playerId, playerId),
            eq(player_course_handicaps.roundId, roundId)
          )
        );
      
      if (storedHandicap) {
        return storedHandicap;
      }
      
      // If not found with roundId, check if exists with courseId
      // This is for backward compatibility during migration
      const round = await this.getRound(roundId);
      if (round && round.courseId) {
        const [legacyHandicap] = await db
          .select()
          .from(player_course_handicaps)
          .where(
            and(
              eq(player_course_handicaps.playerId, playerId),
              eq(player_course_handicaps.courseId, round.courseId)
            )
          );
          
        if (legacyHandicap) {
          // Update this record to include roundId
          await db
            .update(player_course_handicaps)
            .set({ roundId: roundId })
            .where(eq(player_course_handicaps.id, legacyHandicap.id));
            
          return {
            ...legacyHandicap,
            roundId: roundId
          };
        }
      }
  
      // If no handicap is stored, calculate it
      const calculatedHandicap = await this.calculateCourseHandicap(playerId, roundId);
      return { 
        playerId, 
        roundId, 
        courseHandicap: calculatedHandicap 
      };
    } catch (error) {
      console.error("Error in getPlayerCourseHandicap:", error);
      return { 
        playerId, 
        roundId, 
        courseHandicap: 0 
      };
    }
  }

  async getHoleHandicapStrokes(playerId: number, roundId: number, holeNumber: number): Promise<number> {
    // Get the player's course handicap
    const handicapData = await this.getPlayerCourseHandicap(playerId, roundId);
    const courseHandicap = handicapData.courseHandicap || 0;
    
    if (courseHandicap <= 0) {
      return 0; // No strokes given if handicap is 0 or negative
    }
    
    // Get the round to find the course
    const courseRound = await this.getRound(roundId);
    if (!courseRound || !courseRound.courseId) {
      return 0;
    }
    
    // Get the hole details including its handicap rank
    const courseHoles = await this.getHolesByCourse(courseRound.courseId);
    const hole = courseHoles.find(h => h.number === holeNumber);
    
    if (!hole || hole.handicapRank === null) {
      return 0; // No strokes if hole has no handicap ranking
    }
    
    // Determine if player gets a stroke on this hole
    // If course handicap is 9, player gets strokes on holes ranked 1-9
    return hole.handicapRank <= courseHandicap ? 1 : 0;
  }

  async storePlayerCourseHandicap(playerId: number, roundId: number, courseHandicap: number) {
    // Check if a record already exists
    const [existingRecord] = await db
      .select()
      .from(player_course_handicaps)
      .where(
        and(
          eq(player_course_handicaps.playerId, playerId),
          eq(player_course_handicaps.roundId, roundId)
        )
      );
    
    if (existingRecord) {
      // Update existing record
      const [updated] = await db
        .update(player_course_handicaps)
        .set({ courseHandicap })
        .where(
          and(
            eq(player_course_handicaps.playerId, playerId),
            eq(player_course_handicaps.roundId, roundId)
          )
        )
        .returning();
      return updated;
    } else {
      // Insert new record
      const [inserted] = await db
        .insert(player_course_handicaps)
        .values({
          playerId,
          roundId,
          courseHandicap
        })
        .returning();
      return inserted;
    }
  }

  async getAllPlayerCourseHandicaps(roundId: number) {
    try {
      // Get all handicaps for this round
      const handicaps = await db
        .select()
        .from(player_course_handicaps)
        .where(eq(player_course_handicaps.roundId, roundId));
      
      // With the new approach, handicaps are manually entered
      // So we simply return what's in the database
      return handicaps;
    } catch (error) {
      console.error("Error getting all player course handicaps:", error);
      return [];
    }
  }
}

export const storage = new DBStorage();
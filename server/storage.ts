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
} from "@shared/schema";

export interface IStorage {
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

  getMatches(): Promise<any[]>;
  getMatch(id: number): Promise<any | undefined>;
  getMatchesByRound(roundId: number): Promise<any[]>;

  getScores(): Promise<any[]>;
  getScore(matchId: number, holeNumber: number): Promise<any | undefined>;

  getTournament(): Promise<any | undefined>;

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

  async getTeams() {
    return db.select().from(teams);
  }

  async getTeam(id: number) {
    const [row] = await db.select().from(teams).where(eq(teams.id, id));
    return row;
  }

  async getRounds() {
    return db.select().from(rounds);
  }

  async getRound(id: number) {
    const [row] = await db.select().from(rounds).where(eq(rounds.id, id));
    return row;
  }

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

  async getTournament() {
    const [row] = await db.select().from(tournament);
    return row;
  }

  async calculateRoundScores(roundId: number) {
    const matchesInRound = await db
      .select()
      .from(matches)
      .where(eq(matches.roundId, roundId));

    let aviatorScore = 0;
    let producerScore = 0;

    for (const match of matchesInRound) {
      const scoresForMatch = await db
        .select()
        .from(scores)
        .where(eq(scores.matchId, match.id));

      for (const score of scoresForMatch) {
        if (score.winningTeam === "aviators") {
          aviatorScore++;
        } else if (score.winningTeam === "producers") {
          producerScore++;
        }
      }

        if (participant.teamId === 1) aviatorScore += score.value;
        else if (participant.teamId === 2) producerScore += score.value;
      }
    }

    return {
      aviatorScore,
      producerScore,
      pendingAviatorScore: 0,
      pendingProducerScore: 0,
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
      producerScore,
      pendingAviatorScore: 0,
      pendingProducerScore: 0,
    };
  }

  async calculatePlayerStats(tournamentId: number, playerId: number) {
    const player = await this.getPlayer(playerId);
    if (!player) throw new Error("Player not found");

    const allMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId));

    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const match of allMatches) {
      const participants = await db
        .select({
          userId: match_participants.userId,
          playerId: users.playerId,
          teamId: players.teamId,
        })
        .from(match_participants)
        .leftJoin(users, eq(users.id, match_participants.userId))
        .leftJoin(players, eq(players.id, users.playerId))
        .where(eq(match_participants.matchId, match.id));

      const playerIsInMatch = participants.some((p) => p.playerId === playerId);
      if (!playerIsInMatch) continue;

      const scoresForMatch = await db
        .select()
        .from(scores)
        .where(eq(scores.matchId, match.id));

      let aviatorScore = 0;
      let producerScore = 0;

      for (const score of scoresForMatch) {
        const participant = participants.find((p) => p.userId === score.userId);
        if (!participant) continue;

        if (participant.teamId === 1) aviatorScore += score.value;
        else if (participant.teamId === 2) producerScore += score.value;
      }

      if (aviatorScore === producerScore) draws++;
      else {
        const playerTeamId = player.teamId;
        const winner = aviatorScore < producerScore ? 1 : 2;
        if (playerTeamId === winner) wins++;
        else losses++;
      }
    }

    return { wins, losses, draws };
  }

  async initializeData() {
    // No initialization needed for now.
  }
}

// Final export
export const storage = new DBStorage();

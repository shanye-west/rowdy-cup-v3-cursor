import {
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
  users,
  type User,
  type InsertUser,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Team methods
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<Team>): Promise<Team | undefined>;

  // Player methods
  getPlayers(): Promise<Player[]>;
  getPlayersByTeam(teamId: number): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<Player>): Promise<Player | undefined>;

  // Round methods
  getRounds(): Promise<Round[]>;
  getRound(id: number): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: number, round: Partial<Round>): Promise<Round | undefined>;

  // Match methods
  getMatches(): Promise<Match[]>;
  getMatchesByRound(roundId: number): Promise<Match[]>;
  getMatch(id: number): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<Match>): Promise<Match | undefined>;

  // Hole methods
  getHoles(): Promise<Hole[]>;
  createHole(hole: InsertHole): Promise<Hole>;

  // Score methods
  getScores(): Promise<Score[]>;
  getScoresByMatch(matchId: number): Promise<Score[]>;
  getScore(matchId: number, holeNumber: number): Promise<Score | undefined>;
  createScore(score: InsertScore): Promise<Score>;
  updateScore(id: number, score: Partial<Score>): Promise<Score | undefined>;

  // Tournament methods
  getTournament(): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(
    id: number,
    tournament: Partial<Tournament>,
  ): Promise<Tournament | undefined>;

  // Aggregate methods
  calculateRoundScores(
    roundId: number,
  ): Promise<{ aviatorScore: number; producerScore: number }>;
  calculateTournamentScores(): Promise<{
    aviatorScore: number;
    producerScore: number;
  }>;

  // Initialization
  initializeData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private players: Map<number, Player>;
  private rounds: Map<number, Round>;
  private matches: Map<number, Match>;
  private holes: Map<number, Hole>;
  private scores: Map<number, Score>;
  private tournamentData: Map<number, Tournament>;

  private currentId: {
    user: number;
    team: number;
    player: number;
    round: number;
    match: number;
    hole: number;
    score: number;
    tournament: number;
  };

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.players = new Map();
    this.rounds = new Map();
    this.matches = new Map();
    this.holes = new Map();
    this.scores = new Map();
    this.tournamentData = new Map();

    this.currentId = {
      user: 1,
      team: 1,
      player: 1,
      round: 1,
      match: 1,
      hole: 1,
      score: 1,
      tournament: 1,
    };
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.user++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin || false 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Team methods
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.currentId.team++;
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    return newTeam;
  }
  
  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;

    const updatedTeam: Team = { ...team, ...teamData };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Player methods
  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(
      (player) => player.teamId === teamId,
    );
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.currentId.player++;
    // Ensure we have values for nullable fields
    const newPlayer: Player = { 
      ...player, 
      id,
      status: player.status ?? null,
      wins: player.wins ?? null,
      losses: player.losses ?? null,
      ties: player.ties ?? null
    };
    this.players.set(id, newPlayer);
    return newPlayer;
  }
  
  async updatePlayer(id: number, playerData: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;

    const updatedPlayer: Player = { ...player, ...playerData };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  // Round methods
  async getRounds(): Promise<Round[]> {
    return Array.from(this.rounds.values());
  }

  async getRound(id: number): Promise<Round | undefined> {
    return this.rounds.get(id);
  }

  async createRound(round: InsertRound): Promise<Round> {
    const id = this.currentId.round++;
    const newRound: Round = { 
      ...round, 
      id,
      status: round.status ?? null,
      aviatorScore: round.aviatorScore ?? null,
      producerScore: round.producerScore ?? null,
      isComplete: round.isComplete ?? null
    };
    this.rounds.set(id, newRound);
    return newRound;
  }

  async updateRound(
    id: number,
    roundData: Partial<Round>,
  ): Promise<Round | undefined> {
    const round = this.rounds.get(id);
    if (!round) return undefined;

    const updatedRound: Round = { ...round, ...roundData };
    this.rounds.set(id, updatedRound);
    return updatedRound;
  }

  // Match methods
  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.status !== 'deleted'
    );
  }

  async getMatchesByRound(roundId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.roundId === roundId && match.status !== 'deleted'
    );
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const match = this.matches.get(id);
    // Return undefined if match is deleted or doesn't exist
    return match && match.status !== 'deleted' ? match : undefined;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const id = this.currentId.match++;
    const newMatch: Match = { 
      ...match, 
      id,
      currentHole: match.currentHole ?? null,
      leadingTeam: match.leadingTeam ?? null,
      leadAmount: match.leadAmount ?? null,
      result: match.result ?? null
    };
    this.matches.set(id, newMatch);
    return newMatch;
  }

  async updateMatch(
    id: number,
    matchData: Partial<Match>,
  ): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;

    const updatedMatch: Match = { ...match, ...matchData };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  // Hole methods
  async getHoles(): Promise<Hole[]> {
    return Array.from(this.holes.values());
  }

  async createHole(hole: InsertHole): Promise<Hole> {
    const id = this.currentId.hole++;
    const newHole: Hole = { ...hole, id };
    this.holes.set(id, newHole);
    return newHole;
  }

  // Score methods
  async getScores(): Promise<Score[]> {
    return Array.from(this.scores.values());
  }

  async getScoresByMatch(matchId: number): Promise<Score[]> {
    return Array.from(this.scores.values()).filter(
      (score) => score.matchId === matchId,
    );
  }

  async getScore(
    matchId: number,
    holeNumber: number,
  ): Promise<Score | undefined> {
    return Array.from(this.scores.values()).find(
      (score) => score.matchId === matchId && score.holeNumber === holeNumber,
    );
  }

  async createScore(score: InsertScore): Promise<Score> {
    const id = this.currentId.score++;
    const newScore: Score = { 
      ...score, 
      id,
      aviatorScore: score.aviatorScore ?? null,
      producerScore: score.producerScore ?? null,
      winningTeam: score.winningTeam ?? null,
      matchStatus: score.matchStatus ?? null
    };
    this.scores.set(id, newScore);
    return newScore;
  }

  async updateScore(
    id: number,
    scoreData: Partial<Score>,
  ): Promise<Score | undefined> {
    const score = this.scores.get(id);
    if (!score) return undefined;

    const updatedScore: Score = { ...score, ...scoreData };
    this.scores.set(id, updatedScore);

    // Update match state based on scores
    await this.updateMatchState(score.matchId);

    return updatedScore;
  }

  // Tournament methods
  async getTournament(): Promise<Tournament | undefined> {
    if (this.tournamentData.size === 0) return undefined;
    return Array.from(this.tournamentData.values())[0];
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const id = this.currentId.tournament++;
    const newTournament: Tournament = { 
      ...tournament, 
      id,
      aviatorScore: tournament.aviatorScore ?? null,
      producerScore: tournament.producerScore ?? null,
      pendingAviatorScore: tournament.pendingAviatorScore ?? null,
      pendingProducerScore: tournament.pendingProducerScore ?? null
    };
    this.tournamentData.set(id, newTournament);
    return newTournament;
  }

  async updateTournament(
    id: number,
    tournamentData: Partial<Tournament>,
  ): Promise<Tournament | undefined> {
    const tournament = this.tournamentData.get(id);
    if (!tournament) return undefined;

    // Ensure null values are correctly handled for pending scores
    const updatedData = {
      ...tournamentData,
      pendingAviatorScore: tournamentData.pendingAviatorScore ?? tournament.pendingAviatorScore,
      pendingProducerScore: tournamentData.pendingProducerScore ?? tournament.pendingProducerScore
    };

    const updatedTournament: Tournament = { ...tournament, ...updatedData };
    this.tournamentData.set(id, updatedTournament);
    return updatedTournament;
  }

  // Aggregate methods
  async calculateRoundScores(
    roundId: number,
  ): Promise<{ aviatorScore: number; producerScore: number; pendingAviatorScore: number; pendingProducerScore: number }> {
    const matches = await this.getMatchesByRound(roundId);
    let aviatorScore = 0;
    let producerScore = 0;
    let pendingAviatorScore = 0;
    let pendingProducerScore = 0;

    for (const match of matches) {
      if (match.status === "completed") {
        if (match.leadingTeam === "aviators") {
          aviatorScore += 1;
        } else if (match.leadingTeam === "producers") {
          producerScore += 1;
        } else {
          // Tied match - half point to each team
          aviatorScore += 0.5;
          producerScore += 0.5;
        }
      } else if (match.status === "in_progress" && match.leadingTeam) {
        // Count in-progress matches as pending scores
        if (match.leadingTeam === "aviators") {
          pendingAviatorScore += 1;
        } else if (match.leadingTeam === "producers") {
          pendingProducerScore += 1;
        }
      }
    }

    return { 
      aviatorScore, 
      producerScore, 
      pendingAviatorScore, 
      pendingProducerScore 
    };
  }

  async calculateTournamentScores(): Promise<{
    aviatorScore: number;
    producerScore: number;
    pendingAviatorScore: number;
    pendingProducerScore: number;
  }> {
    const rounds = await this.getRounds();
    let totalAviatorScore = 0;
    let totalProducerScore = 0;
    let totalPendingAviatorScore = 0;
    let totalPendingProducerScore = 0;

    for (const round of rounds) {
      const { 
        aviatorScore, 
        producerScore, 
        pendingAviatorScore, 
        pendingProducerScore 
      } = await this.calculateRoundScores(round.id);
      
      totalAviatorScore += aviatorScore;
      totalProducerScore += producerScore;
      totalPendingAviatorScore += pendingAviatorScore;
      totalPendingProducerScore += pendingProducerScore;
    }

    // Update tournament record
    const tournament = await this.getTournament();
    if (tournament) {
      await this.updateTournament(tournament.id, {
        aviatorScore: totalAviatorScore,
        producerScore: totalProducerScore,
        // Type cast to ensure TypeScript understands these properties are valid
        pendingAviatorScore: totalPendingAviatorScore as number,
        pendingProducerScore: totalPendingProducerScore as number
      });
    }

    return {
      aviatorScore: totalAviatorScore,
      producerScore: totalProducerScore,
      pendingAviatorScore: totalPendingAviatorScore,
      pendingProducerScore: totalPendingProducerScore
    };
  }

  private async updateMatchState(matchId: number): Promise<void> {
    const match = await this.getMatch(matchId);
    if (!match) return;

    const scores = await this.getScoresByMatch(matchId);

    // Sort scores by hole number
    scores.sort((a, b) => a.holeNumber - b.holeNumber);

    let aviatorWins = 0;
    let producerWins = 0;
    let lastHoleScored = 0;

    for (const score of scores) {
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
    const completedHoles = scores.filter(s => s.aviatorScore !== null && s.producerScore !== null).length;
    
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

  async initializeData(): Promise<void> {
    // Create teams
    const aviators = await this.createTeam({
      name: "The Aviators",
      shortName: "AVT",
      colorCode: "#003366",
    });

    const producers = await this.createTeam({
      name: "The Producers",
      shortName: "PRD",
      colorCode: "#7D0D23",
    });

    // Create tournament
    await this.createTournament({
      name: "Rowdy Cup 2023",
      year: 2023,
      aviatorScore: 0,
      producerScore: 0,
      pendingAviatorScore: 0,
      pendingProducerScore: 0,
    });

    // Create players for Aviators team
    await this.createPlayer({
      name: "S. Peterson",
      teamId: aviators.id,
      wins: 2,
      losses: 1,
      ties: 0,
    });

    await this.createPlayer({
      name: "R. Benko",
      teamId: aviators.id,
      wins: 1,
      losses: 2,
      ties: 0,
    });

    await this.createPlayer({
      name: "J. Fabozzi",
      teamId: aviators.id,
      wins: 1,
      losses: 1,
      ties: 1,
    });

    await this.createPlayer({
      name: "T. Euckert",
      teamId: aviators.id,
      wins: 1,
      losses: 2,
      ties: 0,
    });

    await this.createPlayer({
      name: "J. Dugan",
      teamId: aviators.id,
      wins: 1,
      losses: 2,
      ties: 0,
    });

    await this.createPlayer({
      name: "J.P. Saar",
      teamId: aviators.id,
      wins: 0,
      losses: 3,
      ties: 0,
    });

    // Create players for Producers team
    await this.createPlayer({
      name: "A. Macksoud",
      teamId: producers.id,
      wins: 2,
      losses: 1,
      ties: 0,
    });

    await this.createPlayer({
      name: "J. Kushner",
      teamId: producers.id,
      wins: 2,
      losses: 1,
      ties: 0,
    });

    await this.createPlayer({
      name: "P. Salazar",
      teamId: producers.id,
      wins: 1,
      losses: 1,
      ties: 1,
    });

    await this.createPlayer({
      name: "D. Cassady",
      teamId: producers.id,
      wins: 2,
      losses: 1,
      ties: 0,
    });

    await this.createPlayer({
      name: "S. Sloan",
      teamId: producers.id,
      wins: 3,
      losses: 0,
      ties: 0,
    });

    await this.createPlayer({
      name: "S. Bodmer",
      teamId: producers.id,
      wins: 3,
      losses: 0,
      ties: 0,
    });

    // Create standard holes
    const holePars = [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4];
    for (let i = 0; i < holePars.length; i++) {
      await this.createHole({
        number: i + 1,
        par: holePars[i],
      });
    }

    // Create rounds
    const round1 = await this.createRound({
      name: "Round 1",
      matchType: "2-man Team Scramble",
      date: "August 7, 2023",
      courseName: "The Idaho Club",
      startTime: "12:00 PM",
      isComplete: true,
    });

    const round2 = await this.createRound({
      name: "Round 2",
      matchType: "2-man Team Shamble",
      date: "August 7, 2023",
      courseName: "The Idaho Club",
      startTime: "4:00 PM",
      isComplete: true,
    });

    const round3 = await this.createRound({
      name: "Round 3",
      matchType: "2-man Team Best Ball",
      date: "August 8, 2023",
      courseName: "Circling Raven Golf Club",
      startTime: "9:00 AM",
      isComplete: true,
    });

    const round4 = await this.createRound({
      name: "Round 4",
      matchType: "4-man Team Scramble",
      date: "August 8, 2023",
      courseName: "Circling Raven Golf Club",
      startTime: "2:00 PM",
      isComplete: false,
    });

    // Create sample matches for Round 1
    await this.createMatch({
      roundId: round1.id,
      name: "Match 1",
      status: "completed",
      aviatorPlayers: "J. Smith, T. Wilson",
      producerPlayers: "M. Johnson, R. Davis",
      leadingTeam: "producers",
      leadAmount: 3,
      result: "3&2",
      currentHole: 18,
    });

    await this.createMatch({
      roundId: round1.id,
      name: "Match 2",
      status: "completed",
      aviatorPlayers: "B. Miller, A. Taylor",
      producerPlayers: "C. Brown, J. Anderson",
      leadingTeam: "producers",
      leadAmount: 2,
      result: "2&1",
      currentHole: 18,
    });

    await this.createMatch({
      roundId: round1.id,
      name: "Match 3",
      status: "completed",
      aviatorPlayers: "D. White, E. Martin",
      producerPlayers: "G. Thompson, F. Moore",
      leadingTeam: "aviators",
      leadAmount: 1,
      result: "1UP",
      currentHole: 18,
    });

    // Create sample matches for Round 2
    await this.createMatch({
      roundId: round2.id,
      name: "Match 1",
      status: "completed",
      aviatorPlayers: "J. Smith, T. Wilson",
      producerPlayers: "G. Thompson, F. Moore",
      leadingTeam: "producers",
      leadAmount: 3,
      result: "3&2",
      currentHole: 18,
    });

    await this.createMatch({
      roundId: round2.id,
      name: "Match 2",
      status: "completed",
      aviatorPlayers: "B. Miller, A. Taylor",
      producerPlayers: "C. Brown, J. Anderson",
      leadingTeam: "aviators",
      leadAmount: 1,
      result: "1UP",
      currentHole: 18,
    });

    await this.createMatch({
      roundId: round2.id,
      name: "Match 3",
      status: "in_progress",
      aviatorPlayers: "D. White, E. Martin",
      producerPlayers: "M. Johnson, R. Davis",
      leadingTeam: "producers",
      leadAmount: 2,
      currentHole: 12,
    });

    // Create sample matches for Round 3
    await this.createMatch({
      roundId: round3.id,
      name: "Match 1",
      status: "completed",
      aviatorPlayers: "J. Smith, B. Miller",
      producerPlayers: "M. Johnson, C. Brown",
      leadingTeam: "aviators",
      leadAmount: 2,
      result: "2&1",
      currentHole: 18,
    });

    await this.createMatch({
      roundId: round3.id,
      name: "Match 2",
      status: "completed",
      aviatorPlayers: "T. Wilson, A. Taylor",
      producerPlayers: "R. Davis, J. Anderson",
      leadingTeam: "producers",
      leadAmount: 1,
      result: "1UP",
      currentHole: 18,
    });

    await this.createMatch({
      roundId: round3.id,
      name: "Match 3",
      status: "completed",
      aviatorPlayers: "D. White, E. Martin",
      producerPlayers: "G. Thompson, F. Moore",
      leadingTeam: "producers",
      leadAmount: 1,
      result: "1UP",
      currentHole: 18,
    });

    // Create sample matches for Round 4
    await this.createMatch({
      roundId: round4.id,
      name: "Match 1",
      status: "completed",
      aviatorPlayers: "J. Smith, T. Wilson, B. Miller, A. Taylor",
      producerPlayers: "M. Johnson, R. Davis, C. Brown, J. Anderson",
      leadingTeam: "aviators",
      leadAmount: 1,
      result: "1UP",
      currentHole: 18,
    });

    await this.createMatch({
      roundId: round4.id,
      name: "Match 2",
      status: "in_progress",
      aviatorPlayers: "D. White, E. Martin, F. Jones, H. Lewis",
      producerPlayers: "G. Thompson, F. Moore, K. Allen, L. Young",
      leadingTeam: null,
      leadAmount: 0,
      currentHole: 10,
    });

    await this.createMatch({
      roundId: round4.id,
      name: "Match 3",
      status: "in_progress",
      aviatorPlayers: "M. Scott, N. Baker, P. Adams, Q. Hall",
      producerPlayers: "S. Clark, T. Wright, V. Hill, W. Green",
      leadingTeam: "producers",
      leadAmount: 1,
      currentHole: 9,
    });

    // Calculate tournament scores
    await this.calculateTournamentScores();
  }
}

export const storage = new MemStorage();

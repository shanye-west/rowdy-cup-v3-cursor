import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertScoreSchema, insertUserSchema, insertRoundSchema, insertMatchSchema, insertPlayerSchema, User } from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin, hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Health check endpoint for Autoscale Deployments
  app.get('/_health', (req, res) => {
    res.status(200).send('OK');
  });

  // Setup authentication
  setupAuth(app);

  // Setup WebSocket server for real-time updates with a specific path
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    
    // Send an initial connection success message
    ws.send(JSON.stringify({ 
      type: 'connection', 
      data: { status: 'connected', timestamp: new Date().toISOString() } 
    }));
    
    ws.on("message", (message) => {
      try {
        // Parse the message (will be used in future for client-to-server communication)
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });
    
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
    
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
  
  // Initialize the data
  await storage.initializeData();

  // Broadcasting function for real-time updates
  const broadcast = (type: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({ type, data }));
      }
    });
  };
  
  // Tournament API
  app.get("/api/tournament", async (req, res) => {
    const tournament = await storage.getTournament();
    res.json(tournament);
  });
  
  app.put("/api/tournament/:id", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const tournament = await storage.getTournament();
      
      if (!tournament || tournament.id !== tournamentId) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      
      // For security, don't allow direct updates to scores - they should be calculated
      const { aviatorScore, producerScore, ...safeData } = req.body;
      
      const updatedTournament = await storage.updateTournament(tournamentId, safeData);
      broadcast("tournament-updated", updatedTournament);
      return res.json(updatedTournament);
    } catch (error) {
      console.error("Tournament update error:", error);
      return res.status(500).json({ message: "Failed to update tournament" });
    }
  });

  // Rounds API
  app.get("/api/rounds", async (req, res) => {
    const rounds = await storage.getRounds();
    res.json(rounds);
  });

  app.get("/api/rounds/:id", async (req, res) => {
    const roundId = parseInt(req.params.id);
    const round = await storage.getRound(roundId);
    
    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }
    
    const scores = await storage.calculateRoundScores(roundId);
    res.json({ ...round, ...scores });
  });
  
  app.post("/api/rounds", async (req, res) => {
    try {
      const roundData = insertRoundSchema.parse(req.body);
      const round = await storage.createRound(roundData);
      broadcast("round-created", round);
      res.json(round);
    } catch (error) {
      console.error("Round creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid round data", details: error.errors });
      }
      return res.status(500).json({ message: "Failed to create round" });
    }
  });
  
  app.put("/api/rounds/:id", async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const round = await storage.getRound(roundId);
      
      if (!round) {
        return res.status(404).json({ message: "Round not found" });
      }
      
      const updatedRound = await storage.updateRound(roundId, req.body);
      broadcast("round-updated", updatedRound);
      res.json(updatedRound);
    } catch (error) {
      console.error("Round update error:", error);
      return res.status(500).json({ message: "Failed to update round" });
    }
  });

  // Matches API
  app.get("/api/matches", async (req, res) => {
    const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
    
    if (roundId) {
      const matches = await storage.getMatchesByRound(roundId);
      res.json(matches);
    } else {
      const matches = await storage.getMatches();
      res.json(matches);
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    const matchId = parseInt(req.params.id);
    const match = await storage.getMatch(matchId);
    
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    
    res.json(match);
  });
  
  app.put("/api/matches/:id", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      const updatedMatch = await storage.updateMatch(matchId, req.body);
      broadcast("match-updated", updatedMatch);
      res.json(updatedMatch);
    } catch (error) {
      console.error("Match update error:", error);
      return res.status(500).json({ message: "Failed to update match" });
    }
  });

  // Scores API
  app.get("/api/scores", async (req, res) => {
    const matchId = req.query.matchId ? parseInt(req.query.matchId as string) : undefined;
    
    if (matchId) {
      const scores = await storage.getScoresByMatch(matchId);
      res.json(scores);
    } else {
      const scores = await storage.getScores();
      res.json(scores);
    }
  });

  app.post("/api/scores", async (req, res) => {
    try {
      // Use a more flexible validation approach
      const schema = z.object({
        matchId: z.number(),
        holeNumber: z.number(),
        aviatorScore: z.number().nullable(),
        producerScore: z.number().nullable(),
      });
      
      const scoreData = schema.parse(req.body);
      
      // Check if score already exists
      const existingScore = await storage.getScore(scoreData.matchId, scoreData.holeNumber);
      
      if (existingScore) {
        // Update existing score
        const updatedScore = await storage.updateScore(existingScore.id, scoreData);
        broadcast("score-updated", updatedScore);
        res.json(updatedScore);
      } else {
        // Create new score
        const newScore = await storage.createScore(scoreData);
        broadcast("score-created", newScore);
        res.json(newScore);
      }
    } catch (error) {
      console.error("Error processing score update:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid score data", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/scores/:id", async (req, res) => {
    try {
      const scoreId = parseInt(req.params.id);
      
      // Use the same flexible validation approach
      const schema = z.object({
        matchId: z.number().optional(),
        holeNumber: z.number().optional(),
        aviatorScore: z.number().nullable().optional(),
        producerScore: z.number().nullable().optional(),
      });
      
      const scoreData = schema.parse(req.body);
      
      const updatedScore = await storage.updateScore(scoreId, scoreData);
      
      if (!updatedScore) {
        return res.status(404).json({ message: "Score not found" });
      }
      
      // Get updated match to broadcast
      const match = await storage.getMatch(updatedScore.matchId);
      
      // Broadcast updates
      broadcast("score-updated", updatedScore);
      if (match) broadcast("match-updated", match);
      
      // Get updated tournament score
      const tournament = await storage.getTournament();
      if (tournament) broadcast("tournament-updated", tournament);
      
      res.json(updatedScore);
    } catch (error) {
      console.error("Error processing score update:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid score data", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Holes API
  app.get("/api/holes", async (req, res) => {
    const holes = await storage.getHoles();
    res.json(holes);
  });

  // Teams API
  app.get("/api/teams", async (req, res) => {
    const teams = await storage.getTeams();
    res.json(teams);
  });

  app.get("/api/teams/:id", async (req, res) => {
    const teamId = parseInt(req.params.id);
    const team = await storage.getTeam(teamId);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    
    res.json(team);
  });
  
  app.put("/api/teams/:id", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const updatedTeam = await storage.updateTeam(teamId, req.body);
      broadcast("team-updated", updatedTeam);
      return res.json(updatedTeam);
    } catch (error) {
      console.error("Team update error:", error);
      return res.status(500).json({ message: "Failed to update team" });
    }
  });

  // Players API
  app.get("/api/players", async (req, res) => {
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    
    if (teamId) {
      const players = await storage.getPlayersByTeam(teamId);
      res.json(players);
    } else {
      const players = await storage.getPlayers();
      res.json(players);
    }
  });
  
  app.post("/api/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      broadcast("player-created", player);
      res.status(201).json(player);
    } catch (error) {
      console.error("Player creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", details: error.errors });
      }
      return res.status(500).json({ message: "Failed to create player" });
    }
  });
  
  app.put("/api/players/:id", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getPlayer(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      const updatedPlayer = await storage.updatePlayer(playerId, req.body);
      broadcast("player-updated", updatedPlayer);
      return res.json(updatedPlayer);
    } catch (error) {
      console.error("Player update error:", error);
      return res.status(500).json({ message: "Failed to update player" });
    }
  });

  // ADMIN ROUTES - Protected by isAdmin middleware

  // Create a new admin user (special endpoint - only for initial admin setup)
  app.post("/api/admin/setup", async (req, res) => {
    try {
      // Check if any admin users already exist
      const users = await storage.getUsers();
      const admins = users.filter((user: User) => user.isAdmin);
      
      if (admins.length > 0) {
        return res.status(403).json({ 
          error: "Admin already exists, use the regular registration process" 
        });
      }

      // Create the first admin user
      const userData = insertUserSchema.parse({
        ...req.body,
        isAdmin: true
      });
      
      // Hash the password before storing it
      const hashedPassword = await hashPassword(userData.password);
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };

      const user = await storage.createUser(userDataWithHashedPassword);
      
      // Return sanitized user (without password)
      res.status(201).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("Admin setup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // USER MANAGEMENT (Admin only)
  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash the password before storing it
      const hashedPassword = await hashPassword(userData.password);
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userDataWithHashedPassword);
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error("User creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Sanitize user data (remove passwords)
      const sanitizedUsers = users.map((user: User) => ({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // TOURNAMENT MANAGEMENT (Admin only)
  app.post("/api/admin/tournament", isAdmin, async (req, res) => {
    try {
      const tournament = await storage.getTournament();
      
      if (tournament) {
        // Update existing tournament
        const updatedData = await storage.updateTournament(tournament.id, req.body);
        broadcast("tournament-updated", updatedData);
        return res.json(updatedData);
      } else {
        // Create new tournament
        const tournamentData = req.body;
        const newTournament = await storage.createTournament(tournamentData);
        broadcast("tournament-created", newTournament);
        return res.status(201).json(newTournament);
      }
    } catch (error) {
      console.error("Tournament management error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tournament data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ROUND MANAGEMENT (Admin only)
  app.post("/api/admin/rounds", isAdmin, async (req, res) => {
    try {
      const roundData = insertRoundSchema.parse(req.body);
      const round = await storage.createRound(roundData);
      broadcast("round-created", round);
      res.status(201).json(round);
    } catch (error) {
      console.error("Round creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid round data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/rounds/:id", isAdmin, async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const round = await storage.getRound(roundId);
      
      if (!round) {
        return res.status(404).json({ error: "Round not found" });
      }

      const updatedRound = await storage.updateRound(roundId, req.body);
      broadcast("round-updated", updatedRound);
      res.json(updatedRound);
    } catch (error) {
      console.error("Round update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // MATCH MANAGEMENT (Admin only)
  app.post("/api/admin/matches", isAdmin, async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      broadcast("match-created", match);
      res.status(201).json(match);
    } catch (error) {
      console.error("Match creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid match data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/matches/:id", isAdmin, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      const updatedMatch = await storage.updateMatch(matchId, req.body);
      broadcast("match-updated", updatedMatch);
      res.json(updatedMatch);
    } catch (error) {
      console.error("Match update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PLAYER MANAGEMENT (Admin only)
  app.post("/api/admin/players", isAdmin, async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      broadcast("player-created", player);
      res.status(201).json(player);
    } catch (error) {
      console.error("Player creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid player data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // RESET AND DELETE OPERATIONS (Admin only)
  
  // Delete all rounds
  app.delete("/api/admin/rounds/all", isAdmin, async (req, res) => {
    try {
      // In a real database implementation, this would use a transaction
      // Delete all scores first (cascade delete)
      const scores = await storage.getScores();
      for (const score of scores) {
        await storage.updateScore(score.id, { matchId: score.matchId, aviatorScore: null, producerScore: null, winningTeam: null });
      }
      
      // Delete all matches (cascade delete)
      const matches = await storage.getMatches();
      for (const match of matches) {
        await storage.updateMatch(match.id, { status: 'deleted', currentHole: 1, leadingTeam: null, leadAmount: 0, result: null });
      }
      
      // Delete all rounds
      const rounds = await storage.getRounds();
      for (const round of rounds) {
        await storage.updateRound(round.id, { isComplete: false, status: 'deleted' });
      }
      
      // Recalculate tournament scores
      const tournamentScores = await storage.calculateTournamentScores();
      const tournament = await storage.getTournament();
      if (tournament) {
        await storage.updateTournament(tournament.id, tournamentScores);
      }
      
      broadcast("data-reset", { type: "rounds-deleted" });
      res.status(200).json({ message: "All rounds have been deleted" });
    } catch (error) {
      console.error("Delete all rounds error:", error);
      return res.status(500).json({ error: "Failed to delete all rounds" });
    }
  });
  
  // Delete all matches
  app.delete("/api/admin/matches/all", isAdmin, async (req, res) => {
    try {
      // Delete all scores first (cascade delete)
      const scores = await storage.getScores();
      for (const score of scores) {
        await storage.updateScore(score.id, { matchId: score.matchId, aviatorScore: null, producerScore: null, winningTeam: null });
      }
      
      // Delete all matches
      const matches = await storage.getMatches();
      for (const match of matches) {
        await storage.updateMatch(match.id, { status: 'deleted', currentHole: 1, leadingTeam: null, leadAmount: 0, result: null });
      }
      
      // Recalculate round scores
      const rounds = await storage.getRounds();
      for (const round of rounds) {
        const scores = await storage.calculateRoundScores(round.id);
        await storage.updateRound(round.id, { ...scores, isComplete: false });
      }
      
      // Recalculate tournament scores
      const tournamentScores = await storage.calculateTournamentScores();
      const tournament = await storage.getTournament();
      if (tournament) {
        await storage.updateTournament(tournament.id, tournamentScores);
      }
      
      broadcast("data-reset", { type: "matches-deleted" });
      res.status(200).json({ message: "All matches have been deleted" });
    } catch (error) {
      console.error("Delete all matches error:", error);
      return res.status(500).json({ error: "Failed to delete all matches" });
    }
  });
  
  // Delete all players
  app.delete("/api/admin/players/all", isAdmin, async (req, res) => {
    try {
      const players = await storage.getPlayers();
      for (const player of players) {
        await storage.updatePlayer(player.id, { status: 'deleted' });
      }
      
      broadcast("data-reset", { type: "players-deleted" });
      res.status(200).json({ message: "All players have been deleted" });
    } catch (error) {
      console.error("Delete all players error:", error);
      return res.status(500).json({ error: "Failed to delete all players" });
    }
  });
  
  // Delete all scores
  app.delete("/api/admin/scores/all", isAdmin, async (req, res) => {
    try {
      const scores = await storage.getScores();
      for (const score of scores) {
        await storage.updateScore(score.id, { matchId: score.matchId, aviatorScore: null, producerScore: null, winningTeam: null });
      }
      
      // Reset match stats
      const matches = await storage.getMatches();
      for (const match of matches) {
        await storage.updateMatch(match.id, { currentHole: 1, leadingTeam: null, leadAmount: 0, result: null });
      }
      
      // Recalculate round scores
      const rounds = await storage.getRounds();
      for (const round of rounds) {
        const { aviatorScore, producerScore } = await storage.calculateRoundScores(round.id);
        await storage.updateRound(round.id, { 
          aviatorScore, 
          producerScore 
        });
      }
      
      // Recalculate tournament scores
      const tournamentScores = await storage.calculateTournamentScores();
      const tournament = await storage.getTournament();
      if (tournament) {
        await storage.updateTournament(tournament.id, tournamentScores);
      }
      
      broadcast("data-reset", { type: "scores-deleted" });
      res.status(200).json({ message: "All scores have been deleted" });
    } catch (error) {
      console.error("Delete all scores error:", error);
      return res.status(500).json({ error: "Failed to delete all scores" });
    }
  });
  
  // Reset all rounds
  app.put("/api/admin/rounds/reset-all", isAdmin, async (req, res) => {
    try {
      const rounds = await storage.getRounds();
      for (const round of rounds) {
        await storage.updateRound(round.id, { isComplete: false });
      }
      
      broadcast("data-reset", { type: "rounds-reset" });
      res.status(200).json({ message: "All rounds have been reset" });
    } catch (error) {
      console.error("Reset all rounds error:", error);
      return res.status(500).json({ error: "Failed to reset all rounds" });
    }
  });
  
  // Reset all matches
  app.put("/api/admin/matches/reset-all", isAdmin, async (req, res) => {
    try {
      const matches = await storage.getMatches();
      for (const match of matches) {
        await storage.updateMatch(match.id, { status: 'in_progress', currentHole: 1, leadingTeam: null, leadAmount: 0, result: null });
      }
      
      // Also reset scores
      const scores = await storage.getScores();
      for (const score of scores) {
        await storage.updateScore(score.id, { matchId: score.matchId, aviatorScore: null, producerScore: null, winningTeam: null, matchStatus: null });
      }
      
      // Recalculate round scores
      const rounds = await storage.getRounds();
      for (const round of rounds) {
        const scores = await storage.calculateRoundScores(round.id);
        await storage.updateRound(round.id, { ...scores, isComplete: false });
      }
      
      // Recalculate tournament scores
      const tournamentScores = await storage.calculateTournamentScores();
      const tournament = await storage.getTournament();
      if (tournament) {
        await storage.updateTournament(tournament.id, tournamentScores);
      }
      
      broadcast("data-reset", { type: "matches-reset" });
      res.status(200).json({ message: "All matches have been reset" });
    } catch (error) {
      console.error("Reset all matches error:", error);
      return res.status(500).json({ error: "Failed to reset all matches" });
    }
  });
  
  // Reset all player stats
  app.put("/api/admin/players/reset-all", isAdmin, async (req, res) => {
    try {
      const players = await storage.getPlayers();
      for (const player of players) {
        await storage.updatePlayer(player.id, { wins: 0, losses: 0, ties: 0 });
      }
      
      broadcast("data-reset", { type: "players-reset" });
      res.status(200).json({ message: "All player statistics have been reset" });
    } catch (error) {
      console.error("Reset all player stats error:", error);
      return res.status(500).json({ error: "Failed to reset all player statistics" });
    }
  });

  return httpServer;
}

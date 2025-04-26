import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertScoreSchema, insertUserSchema, insertRoundSchema, insertMatchSchema, insertPlayerSchema, User } from "@shared/schema";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
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

      const user = await storage.createUser(userData);
      
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
      const user = await storage.createUser(userData);
      
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

  return httpServer;
}

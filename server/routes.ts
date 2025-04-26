import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertScoreSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
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
      const scoreData = insertScoreSchema.parse(req.body);
      
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid score data", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/scores/:id", async (req, res) => {
    try {
      const scoreId = parseInt(req.params.id);
      const scoreData = req.body;
      
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
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Holes API
  app.get("/api/holes", async (req, res) => {
    const holes = await storage.getHoles();
    res.json(holes);
  });

  return httpServer;
}

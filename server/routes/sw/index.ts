import { Router, Request, Response, NextFunction } from "express";
import { swStorage } from "../../sw_storage";
import { z } from "zod";
import { insertTournamentSchema, insertRoundSchema, insertPlayerSchema, insertMatchSchema, insertScoreSchema } from "@shared/sw_schema";
import { isAdmin, isAuthenticated } from "../../auth";
import { WebSocketServer } from "ws";

export function registerSWRoutes(app: Router, wss: WebSocketServer) {
  const router = Router();
  
  // Function to broadcast WebSocket updates
  function broadcast(type: string, data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({ type, data }));
      }
    });
  }

  // Initialize data when routes are loaded
  swStorage.initializeData().catch(err => {
    console.error("Failed to initialize SW data:", err);
  });

  // TOURNAMENT ENDPOINTS
  
  // Get tournament data
  router.get("/tournament", async (req, res) => {
    try {
      const tournament = await swStorage.getTournament();
      res.json(tournament || { error: "No tournament found" });
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ error: "Failed to fetch tournament data" });
    }
  });

  // Create or update tournament (admin only)
  router.post("/tournament", isAdmin, async (req, res) => {
    try {
      const tournamentData = insertTournamentSchema.parse({
        ...req.body,
        type: "sw-monthly" // Ensure type is always set correctly
      });
      
      const existingTournament = await swStorage.getTournament();
      let tournament;
      
      if (existingTournament) {
        tournament = await swStorage.updateTournament(existingTournament.id, tournamentData);
      } else {
        tournament = await swStorage.createTournament(tournamentData);
      }
      
      broadcast("tournament-updated", tournament);
      res.status(200).json(tournament);
    } catch (error) {
      console.error("Tournament update error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid tournament data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ROUND MANAGEMENT (Admin only)
  router.post("/rounds", isAdmin, async (req, res) => {
    try {
      const roundData = insertRoundSchema.parse(req.body);
      const round = await swStorage.createRound(roundData);
      broadcast("round-created", round);
      res.status(201).json(round);
    } catch (error) {
      console.error("Round creation error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid round data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/rounds/:id", isAdmin, async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const round = await swStorage.getRound(roundId);

      if (!round) {
        return res.status(404).json({ error: "Round not found" });
      }

      const updatedRound = await swStorage.updateRound(roundId, req.body);
      broadcast("round-updated", updatedRound);
      res.json(updatedRound);
    } catch (error) {
      console.error("Round update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/rounds/:id", isAdmin, async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      await swStorage.deleteRound(roundId);
      broadcast("round-deleted", { id: roundId });
      res.json({ success: true });
    } catch (error) {
      console.error("Round deletion error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/rounds", async (req, res) => {
    try {
      const rounds = await swStorage.getRounds();
      res.json(rounds);
    } catch (error) {
      console.error("Rounds fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/rounds/:id", async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const round = await swStorage.getRound(roundId);
      
      if (!round) {
        return res.status(404).json({ error: "Round not found" });
      }
      
      res.json(round);
    } catch (error) {
      console.error("Round fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PLAYER MANAGEMENT (Admin only)
  router.post("/players", isAdmin, async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await swStorage.createPlayer(playerData);
      broadcast("player-created", player);
      res.status(201).json(player);
    } catch (error) {
      console.error("Player creation error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid player data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/players/:id", isAdmin, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await swStorage.getPlayer(playerId);

      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const updatedPlayer = await swStorage.updatePlayer(playerId, req.body);
      broadcast("player-updated", updatedPlayer);
      res.json(updatedPlayer);
    } catch (error) {
      console.error("Player update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/players/:id", isAdmin, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      await swStorage.deletePlayer(playerId);
      broadcast("player-deleted", { id: playerId });
      res.json({ success: true });
    } catch (error) {
      console.error("Player deletion error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/players", async (req, res) => {
    try {
      const players = await swStorage.getPlayers();
      res.json(players);
    } catch (error) {
      console.error("Players fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // MATCH MANAGEMENT
  router.post("/matches", isAdmin, async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await swStorage.createMatch(matchData);
      broadcast("match-created", match);
      res.status(201).json(match);
    } catch (error) {
      console.error("Match creation error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid match data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/matches/:id", isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await swStorage.getMatch(matchId);

      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      const updatedMatch = await swStorage.updateMatch(matchId, req.body);
      broadcast("match-updated", updatedMatch);
      res.json(updatedMatch);
    } catch (error) {
      console.error("Match update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/matches/:id", isAdmin, async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      await swStorage.deleteMatch(matchId);
      broadcast("match-deleted", { id: matchId });
      res.json({ success: true });
    } catch (error) {
      console.error("Match deletion error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/matches", async (req, res) => {
    try {
      const roundId = req.query.roundId ? parseInt(req.query.roundId as string) : undefined;
      
      let matches;
      if (roundId) {
        matches = await swStorage.getMatchesByRound(roundId);
      } else {
        matches = await swStorage.getMatches();
      }
      
      res.json(matches);
    } catch (error) {
      console.error("Matches fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/matches/:id", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const includeParticipants = req.query.includeParticipants === 'true';
      
      let match;
      if (includeParticipants) {
        match = await swStorage.getMatchWithParticipants(matchId);
      } else {
        match = await swStorage.getMatch(matchId);
      }
      
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      console.error("Match fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // MATCH PARTICIPANTS
  router.post("/match-participants", isAdmin, async (req, res) => {
    try {
      const participant = await swStorage.createMatchParticipant(req.body);
      broadcast("match-participant-created", participant);
      res.status(201).json(participant);
    } catch (error) {
      console.error("Match participant creation error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/match-participants/:matchId", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const participants = await swStorage.getMatchParticipants(matchId);
      res.json(participants);
    } catch (error) {
      console.error("Match participants fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // SCORE MANAGEMENT
  router.post("/scores", isAuthenticated, async (req, res) => {
    try {
      const scoreData = insertScoreSchema.parse(req.body);
      const score = await swStorage.createScore(scoreData);
      broadcast("score-created", score);
      res.status(201).json(score);
    } catch (error) {
      console.error("Score creation error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid score data", details: error.errors });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/scores/:id", isAuthenticated, async (req, res) => {
    try {
      const scoreId = parseInt(req.params.id);
      const updatedScore = await swStorage.updateScore(scoreId, req.body);
      broadcast("score-updated", updatedScore);
      res.json(updatedScore);
    } catch (error) {
      console.error("Score update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/scores/match/:matchId", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const scores = await swStorage.getScoresByMatch(matchId);
      res.json(scores);
    } catch (error) {
      console.error("Scores fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // TEAM ENDPOINTS
  router.get("/teams", async (req, res) => {
    try {
      const teams = await swStorage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Teams fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/teams/:id", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await swStorage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Team fetch error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.use("/api/sw", router);
  
  return router;
}
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// DEFINE INTERFACES
interface Hole {
  id: number;
  number: number;
  par: number;
}

interface Score {
  id: number;
  matchId: number;
  holeNumber: number;
  aviatorScore: number | null;
  producerScore: number | null;
  winningTeam: string | null;
  matchStatus: string | null;
}

interface Player {
  id: number;
  name: string;
  teamId: number;
}

interface MatchParticipant {
  userId: number;
  team: string;
  player: Player;
}

interface BestBallPlayerScore {
  player: string;
  score: number | null;
  teamId: string; // "aviator" or "producer"
  playerId: number;
}

interface MatchScorecardProps {
  matchId: number;
  holes: Hole[];
  scores: Score[];
  matchStatus?: string;
  matchType: string;
  locked: boolean;
  onScoreUpdate: (
    holeNumber: number,
    aviatorScore: number | null,
    producerScore: number | null,
  ) => void;
  onBestBallScoreUpdate?: (
    holeNumber: number,
    playerScores: BestBallPlayerScore[],
  ) => void;
}

const EnhancedMatchScorecard = ({
  matchId,
  holes,
  scores,
  matchStatus = "in_progress",
  matchType,
  locked = false,
  onScoreUpdate,
  onBestBallScoreUpdate,
}: MatchScorecardProps) => {
  const isBestBall = matchType.includes("Best Ball");

  // Fetch match participants
  const { data: participants = [] } = useQuery<any[]>({
    queryKey: [`/api/match-players?matchId=${matchId}`],
  });

  // Fetch all players for reference
  const { data: allPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  // Split participants into teams
  const aviatorPlayersList = useMemo(() => {
    if (!Array.isArray(participants)) return [];

    return participants
      .filter((p: any) => p.team === "aviators")
      .map((p: any) => {
        if (!Array.isArray(allPlayers)) return { id: p.playerId, name: `Player ${p.playerId}`, teamId: 1 };

        // Find the player details from allPlayers
        const playerDetails = allPlayers.find((player: any) => player.id === p.playerId);
        return playerDetails || { id: p.playerId, name: `Player ${p.playerId}`, teamId: 1 };
      });
  }, [participants, allPlayers]);

  const producerPlayersList = useMemo(() => {
    if (!Array.isArray(participants)) return [];

    return participants
      .filter((p: any) => p.team === "producers")
      .map((p: any) => {
        if (!Array.isArray(allPlayers)) return { id: p.playerId, name: `Player ${p.playerId}`, teamId: 2 };

        // Find the player details from allPlayers
        const playerDetails = allPlayers.find((player: any) => player.id === p.playerId);
        return playerDetails || { id: p.playerId, name: `Player ${p.playerId}`, teamId: 2 };
      });
  }, [participants, allPlayers]);


  // For Best Ball, we need to track individual player scores
  const [playerScores, setPlayerScores] = useState<
    Map<string, BestBallPlayerScore[]>
  >(new Map());

  const allHoles = [...holes].sort((a, b) => a.number - b.number);
  const frontNine = [...holes].filter((h) => h.number <= 9).sort((a, b) => a.number - b.number);
  const backNine = [...holes].filter((h) => h.number > 9).sort((a, b) => a.number - b.number);

  // Compute player score totals
  const playerTotals = useMemo(() => {
    const totals = new Map<string, number>();

    // Process all players
    [...aviatorPlayersList, ...producerPlayersList].forEach((player) => {
      let playerTotal = 0;

      // Calculate this player's total across all holes
      for (let i = 1; i <= 18; i++) {
        const key = `${i}-${player.name}`;
        const playerScoreObj = playerScores.get(key);

        if (
          playerScoreObj &&
          playerScoreObj.length > 0 &&
          playerScoreObj[0].score !== null
        ) {
          playerTotal += playerScoreObj[0].score!;
        }
      }

      // Store the player's total
      totals.set(player.name, playerTotal);
    });

    return totals;
  }, [playerScores, aviatorPlayersList, producerPlayersList]);

  // Calculate front nine totals for each player
  const playerFrontNineTotals = useMemo(() => {
    const totals = new Map<string, number>();

    // Process all players
    [...aviatorPlayersList, ...producerPlayersList].forEach((player) => {
      let playerTotal = 0;

      // Calculate this player's front nine total
      for (let i = 1; i <= 9; i++) {
        const key = `${i}-${player.name}`;
        const playerScoreObj = playerScores.get(key);

        if (
          playerScoreObj &&
          playerScoreObj.length > 0 &&
          playerScoreObj[0].score !== null
        ) {
          playerTotal += playerScoreObj[0].score!;
        }
      }

      // Store the player's front nine total
      totals.set(player.name, playerTotal);
    });

    return totals;
  }, [playerScores, aviatorPlayersList, producerPlayersList]);

  // Calculate back nine totals for each player
  const playerBackNineTotals = useMemo(() => {
    const totals = new Map<string, number>();

    // Process all players
    [...aviatorPlayersList, ...producerPlayersList].forEach((player) => {
      let playerTotal = 0;

      // Calculate this player's back nine total
      for (let i = 10; i <= 18; i++) {
        const key = `${i}-${player.name}`;
        const playerScoreObj = playerScores.get(key);

        if (
          playerScoreObj &&
          playerScoreObj.length > 0 &&
          playerScoreObj[0].score !== null
        ) {
          playerTotal += playerScoreObj[0].score!;
        }
      }

      // Store the player's back nine total
      totals.set(player.name, playerTotal);
    });

    return totals;
  }, [playerScores, aviatorPlayersList, producerPlayersList]);

  // Get a score for a specific hole number
  const getScore = (holeNumber: number): Score | undefined => {
    // Sort scores by ID to get the latest score for a hole
    const sortedScores = [...scores].sort((a, b) => b.id - a.id);
    return sortedScores.find((s) => s.holeNumber === holeNumber);
  };

  // Determine the last completed hole based on scores
  const lastCompletedHole = useMemo(() => {
    const completedHoles = scores
      .filter((s) => s.aviatorScore !== null && s.producerScore !== null)
      .map((s) => s.holeNumber);

    return completedHoles.length > 0 ? Math.max(...completedHoles) : 0;
  }, [scores]);

  // Check if a hole is or should be greyed out (e.g., match is over)
  const isHoleGreyedOut = (holeNumber: number): boolean => {
    if (locked) return true;

    if (matchStatus !== "completed") return false;

    // Find the match-deciding hole
    const completedScores = scores.filter(
      (s) => s.aviatorScore !== null && s.producerScore !== null,
    );
    if (completedScores.length === 0) return false;

    // Count aviator wins vs producer wins
    let aviatorWins = 0;
    let producerWins = 0;

    // Sort scores by hole number
    const sortedScores = [...completedScores].sort(
      (a, b) => a.holeNumber - b.holeNumber,
    );

    // Calculate the running score and find the deciding hole
    let decidingHole = 18; // Default to 18 if match goes all the way

    for (const score of sortedScores) {
      if (score.aviatorScore! < score.producerScore!) {
        aviatorWins++;
      } else if (score.producerScore! < score.aviatorScore!) {
        producerWins++;
      }

      const lead = Math.abs(aviatorWins - producerWins);
      const holesRemaining = 18 - score.holeNumber;

      // If lead is greater than remaining holes, match is decided
      if (lead > holesRemaining) {
        decidingHole = score.holeNumber;
        break;
      }
    }

    // Grey out holes after the deciding hole
    return holeNumber > decidingHole;
  };

  // Get background class for a hole based on scores
  const getHoleClass = (holeNumber: number): string => {
    const score = getScore(holeNumber);
    let classes = "";

    // Grey out if hole is after the match was decided
    if (isHoleGreyedOut(holeNumber)) {
      return "bg-gray-200 opacity-50"; // Greyed out and disabled
    }

    if (!score || !score.aviatorScore || !score.producerScore) return classes;

    if (score.aviatorScore < score.producerScore) {
      classes += "bg-green-100"; // Aviators win
    } else if (score.producerScore < score.aviatorScore) {
      classes += "bg-green-100"; // Producers win
    }

    return classes;
  };

  // Get the score value for a specific hole and team
  const getScoreInputValue = (
    holeNumber: number,
    team: "aviator" | "producer",
  ): string => {
    const score = getScore(holeNumber);
    if (!score) return "";

    const value = team === "aviator" ? score.aviatorScore : score.producerScore;
    return value !== null ? value.toString() : "";
  };

  // For Best Ball format, get an individual player's score
  const getPlayerScoreValue = (
    holeNumber: number,
    playerName: string,
    teamId: string,
  ): string => {
    // For individual player scores, check for player-specific key first
    const playerKey = `${holeNumber}-${playerName}`;
    const playerSpecificScores = playerScores.get(playerKey);

    if (playerSpecificScores && playerSpecificScores.length > 0) {
      const score = playerSpecificScores[0].score;
      if (score !== null && score !== undefined) {
        return score.toString();
      }
    }

    // Then check team scores
    const teamKey = `${holeNumber}-${teamId}`;
    const holeScores = playerScores.get(teamKey) || [];
    const playerScore = holeScores.find((ps) => ps.player === playerName);

    if (playerScore?.score !== null && playerScore?.score !== undefined) {
      return playerScore.score.toString();
    }

    return "";
  };

  // Handle score input change for regular match types
  const handleScoreChange = (
    holeNumber: number,
    team: "aviator" | "producer",
    value: string,
    target: HTMLInputElement,
  ) => {
    let numValue: number | null = null;

    // Only parse if the value is not empty
    if (value !== "") {
      // Ensure we're parsing a valid number
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        numValue = parsed;
      }
    }

    if (team === "aviator") {
      const producerScore = getScore(holeNumber)?.producerScore || null;
      onScoreUpdate(holeNumber, numValue, producerScore);
    } else {
      const aviatorScore = getScore(holeNumber)?.aviatorScore || null;
      onScoreUpdate(holeNumber, aviatorScore, numValue);
    }
    //Added Keyboard Closing Logic
    setTimeout(() => {
      if (value !== "1" && value !== "") {
          target.blur();
      }
    }, 100);
  };

  // Handle individual player score changes for Best Ball
  const handlePlayerScoreChange = (
    holeNumber: number,
    playerName: string,
    teamId: string,
    value: string,
    target: HTMLInputElement,
  ) => {
    let numValue = null;

    // Only parse if the value is not empty
    if (value !== "") {
      // Ensure we're parsing a valid number
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        numValue = parsed;
      }
    }

    // Store the player score using both keys for redundancy
    // First key is for the team calculations
    const teamKey = `${holeNumber}-${teamId}`;
    // Second key is for looking up individual player scores
    const playerKey = `${holeNumber}-${playerName}`;

    let holeScores = playerScores.get(teamKey) || [];

    // Find the player in the current hole scores
    const playerIndex = holeScores.findIndex((ps) => ps.player === playerName);

    // Create a player score object
    const playerScoreObj = {
      player: playerName,
      score: numValue,
      teamId,
      playerId:
        teamId === "aviator"
          ? aviatorPlayersList.find((p: any) => p.name === playerName)?.id || 0
          : producerPlayersList.find((p: any) => p.name === playerName)?.id || 0,
    };

    if (playerIndex >= 0) {
      // Update existing player score
      holeScores[playerIndex].score = numValue;
    } else {
      // Add new player score
      holeScores.push(playerScoreObj);
    }

    // Update state with both keys
    const newPlayerScores = new Map(playerScores);
    newPlayerScores.set(teamKey, holeScores);
    // Also set the player-specific key for direct lookup
    newPlayerScores.set(playerKey, [playerScoreObj]);

    setPlayerScores(newPlayerScores);

    // Calculate the best score for each team and update the match
    updateBestBallScores(holeNumber, newPlayerScores);

    //Added Keyboard Closing Logic
    setTimeout(() => {
      if (value !== "1" && value !== "") {
        target.blur();
      }
    }, 100);
  };

  // Calculate Best Ball scores and update the match
  const updateBestBallScores = (
    holeNumber: number,
    scoreMap: Map<string, BestBallPlayerScore[]>,
  ) => {
    // Get scores for this hole
    const key = `${holeNumber}-aviator`;
    const key2 = `${holeNumber}-producer`;
    const aviatorHoleScores = scoreMap.get(key) || [];
    const producerHoleScores = scoreMap.get(key2) || [];

    // Calculate team scores (lowest score from each team)
    let aviatorScore = null;
    let producerScore = null;

    // Find the lowest score for each team (ignoring null/undefined)
    if (aviatorHoleScores.length > 0) {
      const validScores = aviatorHoleScores.filter((s) => s.score !== null);
      if (validScores.length > 0) {
        aviatorScore = Math.min(...validScores.map((s) => s.score || Infinity));
        if (aviatorScore === Infinity) aviatorScore = null;
      }
    }

    if (producerHoleScores.length > 0) {
      const validScores = producerHoleScores.filter((s) => s.score !== null);
      if (validScores.length > 0) {
        producerScore = Math.min(
          ...validScores.map((s) => s.score || Infinity),
        );
        if (producerScore === Infinity) producerScore = null;
      }
    }

    // Update match score
    onScoreUpdate(holeNumber, aviatorScore, producerScore);

    // If we have the callback for individual scores, call it
    if (onBestBallScoreUpdate) {
      const allPlayerScores = [
        ...(aviatorHoleScores || []),
        ...(producerHoleScores || []),
      ];
      onBestBallScoreUpdate(holeNumber, allPlayerScores);
    }
  };

  // Calculate which player is the best score for a hole
  const isLowestScore = (
    holeNumber: number,
    playerName: string,
    teamId: string,
  ): boolean => {
    if (!isBestBall) return true; // Not applicable for non-Best Ball matches

    const key = `${holeNumber}-${teamId}`;
    const holeScores = playerScores.get(key) || [];

    if (holeScores.length < 2) return true; // If only one player, they are the best

    // Find current player's score
    const currentPlayerScoreObj = holeScores.find(
      (ps) => ps.player === playerName,
    );
    const currentPlayerScore = currentPlayerScoreObj?.score;

    if (currentPlayerScore === null || currentPlayerScore === undefined)
      return false;

    // Find the minimum score in this team for this hole (excluding nulls)
    const validScores = holeScores
      .filter((s) => s.score !== null && s.score !== undefined)
      .map((s) => s.score || Infinity);

    if (validScores.length === 0) return false;

    const lowestScore = Math.min(...validScores);

    // Check if this player has the lowest score
    return currentPlayerScore === lowestScore;
  };

  // Generate hole-by-hole match status (e.g., "1↑", "2↑", "AS") for the match status row
  const generateMatchStatus = (
    holeNumber: number,
  ): { text: string; color: string } => {
    // Check if this hole has been played
    const thisHoleScore = scores.find((s) => s.holeNumber === holeNumber);
    if (
      !thisHoleScore ||
      thisHoleScore.aviatorScore === null ||
      thisHoleScore.producerScore === null
    ) {
      return { text: "-", color: "text-gray-400" }; // Hole not completed yet
    }

    const completedScores = scores
      .filter(
        (s) =>
          s.holeNumber <= holeNumber &&
          s.aviatorScore !== null &&
          s.producerScore !== null,
      )
      .sort((a, b) => a.holeNumber - b.holeNumber);

    if (completedScores.length === 0)
      return { text: "-", color: "text-gray-400" };

    let aviatorWins = 0;
    let producerWins = 0;

    // Calculate running score
    for (const score of completedScores) {
      if (score.aviatorScore! < score.producerScore!) {
        aviatorWins++;
      } else if (score.producerScore! < score.aviatorScore!) {
        producerWins++;
      }
    }

    const lead = Math.abs(aviatorWins - producerWins);

    if (lead === 0) {
      return { text: "AS", color: "text-gray-400" }; // All Square in light grey
    } else if (aviatorWins > producerWins) {
      return { text: `${lead}↑`, color: "text-aviator font-bold" }; // Aviators up, bold text
    } else {
      return { text: `${lead}↑`, color: "text-producer font-bold" }; // Producers up, bold text
    }
  };

  // Calculate totals for front nine (1-9)
  const frontNineTotals = useMemo(() => {
    let aviatorTotal = 0;
    let producerTotal = 0;
    let parTotal = 0;

    for (let i = 1; i <= 9; i++) {
      const hole = holes.find((h) => h.number === i);
      const score = getScore(i);

      if (hole) {
        parTotal += hole.par;
      }

      if (score?.aviatorScore) {
        aviatorTotal += score.aviatorScore;
      }

      if (score?.producerScore) {
        producerTotal += score.producerScore;
      }
    }

    return {
      aviatorTotal,
      producerTotal,
      parTotal,
    };
  }, [holes, scores]);

  // Calculate totals for back nine (10-18)
  const backNineTotals = useMemo(() => {
    let aviatorTotal = 0;
    let producerTotal = 0;
    let parTotal = 0;

    for (let i = 10; i <= 18; i++) {
      const hole = holes.find((h) => h.number === i);
      const score = getScore(i);

      if (hole) {
        parTotal += hole.par;
      }

      if (score?.aviatorScore) {
        aviatorTotal += score.aviatorScore;
      }

      if (score?.producerScore) {
        producerTotal += score.producerScore;
      }
    }

    return {
      aviatorTotal,
      producerTotal,
      parTotal,
    };
  }, [holes, scores]);

  return (
    <div className="scorecard-container">
      <div>
        {/* All 18 Holes in a single table with horizontal scrolling */}
        <table className="w-full text-sm scorecard-table">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 text-left font-semibold sticky-column bg-gray-100">
                Hole
              </th>
              {/* Front Nine Holes */}
              {frontNine.map((hole) => (
                <th
                  key={hole.number}
                  className="py-2 px-2 text-center font-semibold"
                >
                  {hole.number}
                </th>
              ))}
              <th className="py-2 px-2 text-center font-semibold bg-gray-200">
                OUT
              </th>
              {/* Back Nine Holes */}
              {backNine.map((hole) => (
                <th
                  key={hole.number}
                  className="py-2 px-2 text-center font-semibold"
                >
                  {hole.number}
                </th>
              ))}
              <th className="py-2 px-2 text-center font-semibold bg-gray-200">
                IN
              </th>
              <th className="py-2 px-2 text-center font-semibold bg-gray-300">
                TOTAL
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="py-2 px-2 text-left font-semibold sticky-column bg-gray-50">
                Par
              </th>
              {/* Front Nine Pars */}
              {frontNine.map((hole) => (
                <td key={hole.number} className="py-2 px-2 text-center">
                  {hole.par}
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {frontNineTotals.parTotal}
              </td>
              {/* Back Nine Pars */}
              {backNine.map((hole) => (
                <td key={hole.number} className="py-2 px-2 text-center">
                  {hole.par}
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {backNineTotals.parTotal}
              </td>
              <td className="py-2 px-2 text-center font-semibold bg-gray-200">
                {frontNineTotals.parTotal + backNineTotals.parTotal}
              </td>
            </tr>
          </thead>
          <tbody>
            {/* Aviator Players Rows for Best Ball - displayed above team row */}
            {isBestBall && (
              <>
                {aviatorPlayersList.map((player: any) => (
                  <tr key={player.id} className="border-b border-gray-200">
                    <td className="py-2 px-2 sticky-column bg-white border-l-4 border-aviator">
                      <div className="text-xs font-medium text-black">
                        {player.name}
                      </div>
                    </td>
                    {/* Front Nine Aviator Player Scores */}
                    {frontNine.map((hole) => {
                      const isLowest = isLowestScore(
                        hole.number,
                        player.name,
                        "aviator",
                      );
                      return (
                        <td key={hole.number} className="py-2 px-2 text-center">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                              ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed" : ""} 
                              ${!isLowest ? "non-counting-score" : ""}`}
                            value={getPlayerScoreValue(
                              hole.number,
                              player.name,
                              "aviator",
                            )}
                            onChange={(e) =>
                              handlePlayerScoreChange(
                                hole.number,
                                player.name,
                                "aviator",
                                e.target.value,
                                e.target
                              )
                            }
                            min="1"
                            max="12"
                            disabled={isHoleGreyedOut(hole.number) || locked}
                          />
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                                {playerFrontNineTotals.get(player.name) || ""}
                              </td>
                              {/* Back Nine Aviator Player Scores */}
                              {backNine.map((hole) => {
                                const isLowest = isLowestScore(
                                  hole.number,
                                  player.name,
                                  "aviator",
                                );
                                return (
                                  <td key={hole.number} className="py-2 px-2 text-center">
                                    <input
                                      type="tel"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                                        ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed" : ""} 
                                        ${!isLowest ? "non-counting-score" : ""}`}
                                      value={getPlayerScoreValue(
                                        hole.number,
                                        player.name,
                                        "aviator",
                                      )}
                                      onChange={(e) =>
                                        handlePlayerScoreChange(
                                          hole.number,
                                          player.name,
                                          "aviator",
                                          e.target.value,
                                          e.target
                                        )
                                      }
                                      min="1"
                                      max="12"
                                      disabled={isHoleGreyedOut(hole.number) || locked}
                                    />
                                  </td>
                                );
                              })}
                              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                                {playerBackNineTotals.get(player.name) || ""}
                              </td>
                              <td className="py-2 px-2 text-center font-semibold bg-gray-200">
                                {playerTotals.get(player.name) || ""}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Team Aviators Row */}
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-2 font-semibold sticky-column bg-aviator text-white">
                          <div>The Aviators</div>
                        </td>

                        {/* Front Nine Aviator Scores */}
                        {frontNine.map((hole) => (
                          <td key={hole.number} className="py-2 px-2 text-center">
                            {isBestBall ? (
                              <div className={`score-display w-16 h-8 inline-flex items-center justify-center border border-gray-300 rounded ${
                                getScoreInputValue(hole.number, "aviator") ? "bg-aviator text-white" : "bg-white text-black"
                              }`}>
                                {getScoreInputValue(hole.number, "aviator") || ""}
                              </div>
                            ) : (
                              <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={`score-input w-16 h-8 text-center border border-gray-300 rounded 
                                  ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed text-black" : 
                                    getScoreInputValue(hole.number, "aviator") ? "bg-aviator text-white" : "bg-white text-black"}`}
                                value={getScoreInputValue(hole.number, "aviator")}
                                onChange={(e) =>
                                  handleScoreChange(
                                    hole.number,
                                    "aviator",
                                    e.target.value,
                                    e.target
                                  )
                                }
                                min="1"
                                max="12"
                                disabled={isHoleGreyedOut(hole.number) || locked}
                              />
                            )}
                          </td>
                        ))}
                        <td className="py-2 px-2 text-center font-semibold bg-gray-100 text-aviator">
                          {frontNineTotals.aviatorTotal > 0
                            ? frontNineTotals.aviatorTotal
                            : ""}
                        </td>

                        {/* Back Nine Aviator Scores */}
                        {backNine.map((hole) => (
                          <td key={hole.number} className="py-2 px-2 text-center">
                            {isBestBall ? (
                              <div className={`score-display w-16 h-8 inline-flex items-center justify-center border border-gray-300 rounded ${
                                getScoreInputValue(hole.number, "aviator") ? "bg-aviator text-white" : "bg-white text-black"
                              }`}>
                                {getScoreInputValue(hole.number, "aviator") || ""}
                              </div>
                            ) : (
                              <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={`score-input w-16 h-8 text-center border border-gray-300 rounded 
                                  ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed text-black" : 
                                    getScoreInputValue(hole.number, "aviator") ? "bg-aviator text-white" : "bg-white text-black"}`}
                                value={getScoreInputValue(hole.number, "aviator")}
                                onChange={(e) =>
                                  handleScoreChange(
                                    hole.number,
                                    "aviator",
                                    e.target.value,
                                    e.target
                                  )
                                }
                                min="1"
                                max="12"
                                disabled={isHoleGreyedOut(hole.number) || locked}
                              />
                            )}
                          </td>
                        ))}
                        <td className="py-2 px-2 text-center font-semibold bg-gray-100 text-aviator">
                          {backNineTotals.aviatorTotal > 0
                            ? backNineTotals.aviatorTotal
                            : ""}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold bg-gray-200 text-aviator">
                          {frontNineTotals.aviatorTotal + backNineTotals.aviatorTotal > 0
                            ? frontNineTotals.aviatorTotal + backNineTotals.aviatorTotal
                            : ""}
                        </td>
                      </tr>

                      {/* Match Status Row - Moved between teams */}
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-2 sticky-column bg-gray-100">
                          <div className="text-sm font-bold">Match Status</div>
                        </td>
                        {/* Front Nine Match Status */}
                        {frontNine.map((hole) => {
                          const status = generateMatchStatus(hole.number);
                          return (
                            <td key={hole.number} className="py-2 px-2 text-center">
                              <div className={`text-sm font-bold ${status.color}`}>
                                {status.text}
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center bg-gray-100"></td>
                        {/* Back Nine Match Status */}
                        {backNine.map((hole) => {
                          const status = generateMatchStatus(hole.number);
                          return (
                            <td key={hole.number} className="py-2 px-2 text-center">
                              <div className={`text-sm font-bold ${status.color}`}>
                                {status.text}
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center bg-gray-100"></td>
                        <td className="py-2 px-2 text-center bg-gray-200"></td>
                      </tr>

                      {/* Team Producers Row */}
                      <tr className="border-b border-gray-200">
                        <td className="py-2 px-2 font-semibold sticky-column bg-producer text-white">
                          <div>The Producers</div>
                        </td>

                        {/* Front Nine Producer Scores */}
                        {frontNine.map((hole) => (
                          <td key={hole.number} className="py-2 px-2 text-center">
                            {isBestBall ? (
                              <div className={`score-display w-16 h-8 inline-flex items-center justify-center border border-gray-300 rounded ${
                                getScoreInputValue(hole.number, "producer") ? "bg-producer text-white" : "bg-white text-black"
                              }`}>
                                {getScoreInputValue(hole.number, "producer") || ""}
                              </div>
                            ) : (
                              <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={`score-input w-16 h-8 text-center border border-gray-300 rounded 
                                  ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed text-black" : 
                                    getScoreInputValue(hole.number, "producer") ? "bg-producer text-white" : "bg-white text-black"}`}
                                value={getScoreInputValue(hole.number, "producer")}
                                onChange={(e) =>
                                  handleScoreChange(
                                    hole.number,
                                    "producer",
                                    e.target.value,
                                    e.target
                                  )
                                }
                                min="1"
                                max="12"
                                disabled={isHoleGreyedOut(hole.number) || locked}
                              />
                            )}
                          </td>
                        ))}
                        <td className="py-2 px-2 text-center font-semibold bg-gray-100 text-producer">
                          {frontNineTotals.producerTotal > 0
                            ? frontNineTotals.producerTotal
                            : ""}
                        </td>

                        {/* Back Nine Producer Scores */}
                        {backNine.map((hole) => (
                          <td key={hole.number} className="py-2 px-2 text-center">
                            {isBestBall ? (
                              <div className={`score-display w-16 h-8 inline-flex items-center justify-center border border-gray-300 rounded ${
                                getScoreInputValue(hole.number, "producer") ? "bg-producer text-white" : "bg-white text-black"
                              }`}>
                                {getScoreInputValue(hole.number, "producer") || ""}
                              </div>
                            ) : (
                              <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className={`score-input w-16 h-8 text-center border border-gray-300 rounded 
                                  ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed text-black" : 
                                    getScoreInputValue(hole.number, "producer") ? "bg-producer text-white" : "bg-white text-black"}`}
                                value={getScoreInputValue(hole.number, "producer")}
                                onChange={(e) =>
                                  handleScoreChange(
                                    hole.number,
                                    "producer",
                                    e.target.value,
                                    e.target
                                  )
                                }
                                min="1"
                                max="12"
                                disabled={isHoleGreyedOut(hole.number) || locked}
                              />
                            )}
                          </td>
                        ))}
                        <td className="py-2 px-2 text-center font-semibold bg-gray-100 text-producer">
                          {backNineTotals.producerTotal > 0
                            ? backNineTotals.producerTotal
                            : ""}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold bg-gray-200 text-producer">
                          {frontNineTotals.producerTotal + backNineTotals.producerTotal > 0
                            ? frontNineTotals.producerTotal + backNineTotals.producerTotal
                            : ""}
                        </td>
                      </tr>

                      {/* Producer Players Rows for Best Ball - displayed below team row */}
                      {isBestBall && (
                        <>
                          {producerPlayersList.map((player: any) => (
                            <tr key={player.id} className="border-b border-gray-200">
                              <td className="py-2 px-2 sticky-column bg-white border-l-4 border-producer">
                                <div className="text-xs font-medium text-black">
                                  {player.name}
                                </div>
                              </td>
                              {/* Front Nine Producer Player Scores */}
                              {frontNine.map((hole) => {
                                const isLowest = isLowestScore(
                                  hole.number,
                                  player.name,
                                  "producer",
                                );
                                return (
                                  <td key={hole.number} className="py-2 px-2 text-center">
                                    <input
                                      type="tel"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                                        ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed" : ""} 
                                        ${!isLowest ? "non-counting-score" : ""}`}
                                      value={getPlayerScoreValue(
                                        hole.number,
                                        player.name,
                                        "producer",
                                      )}
                                      onChange={(e) =>
                                        handlePlayerScoreChange(
                                          hole.number,
                                          player.name,
                                          "producer",
                                          e.target.value,
                                          e.target
                                        )
                                      }
                                      min="1"
                                      max="12"
                                      disabled={isHoleGreyedOut(hole.number) || locked}
                                    />
                                  </td>
                                );
                              })}
                              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                                {playerFrontNineTotals.get(player.name) || ""}
                              </td>
                              {/* Back Nine Producer Player Scores */}
                              {backNine.map((hole) => {
                                const isLowest = isLowestScore(
                                  hole.number,
                                  player.name,
                                  "producer",
                                );
                                return (
                                  <td key={hole.number} className="py-2 px-2 text-center">
                                    <input
                                      type="tel"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                                        ${isHoleGreyedOut(hole.number) ? "bg-gray-200 cursor-not-allowed" : ""} 
                                        ${!isLowest ? "non-counting-score" : ""}`}
                                      value={getPlayerScoreValue(
                                        hole.number,
                                        player.name,
                                        "producer",
                                      )}
                                      onChange={(e) =>
                                        handlePlayerScoreChange(
                                          hole.number,
                                          player.name,
                                          "producer",
                                          e.target.value,
                                          e.target
                                        )
                                      }
                                      min="1"
                                      max="12"
                                      disabled={isHoleGreyedOut(hole.number) || locked}
                                    />
                                  </td>
                                );
                              })}
                              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                                {playerBackNineTotals.get(player.name) || ""}
                              </td>
                              <td className="py-2 px-2 text-center font-semibold bg-gray-200">
                                {playerTotals.get(player.name) || ""}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedMatchScorecard;
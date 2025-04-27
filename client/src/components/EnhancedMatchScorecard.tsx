import { useMemo, useState } from "react";

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
  aviatorPlayers: string;
  producerPlayers: string;
  onScoreUpdate: (holeNumber: number, aviatorScore: number | null, producerScore: number | null) => void;
  onBestBallScoreUpdate?: (holeNumber: number, playerScores: BestBallPlayerScore[]) => void;
}

const EnhancedMatchScorecard = ({ 
  matchId, 
  holes, 
  scores, 
  matchStatus = 'in_progress', 
  matchType,
  aviatorPlayers,
  producerPlayers,
  onScoreUpdate,
  onBestBallScoreUpdate
}: MatchScorecardProps) => {
  const isBestBall = matchType === "2-man Best Ball";
  
  // For Best Ball, we need to track individual player scores
  const [playerScores, setPlayerScores] = useState<Map<string, BestBallPlayerScore[]>>(new Map());
  
  // Setup player arrays from the comma-separated strings
  const aviatorPlayersList = aviatorPlayers.split(',').map((name, idx) => ({ 
    name: name.trim(), 
    id: idx,
    team: "aviator" 
  }));
  
  const producerPlayersList = producerPlayers.split(',').map((name, idx) => ({ 
    name: name.trim(), 
    id: idx + 100, // Offset to ensure unique IDs
    team: "producer" 
  }));
  
  const frontNine = holes.filter(h => h.number <= 9);
  const backNine = holes.filter(h => h.number > 9);
  
  // Get a score for a specific hole number
  const getScore = (holeNumber: number): Score | undefined => {
    return scores.find(s => s.holeNumber === holeNumber);
  };
  
  // Determine the last completed hole based on scores
  const lastCompletedHole = useMemo(() => {
    const completedHoles = scores
      .filter(s => s.aviatorScore !== null && s.producerScore !== null)
      .map(s => s.holeNumber);
    
    return completedHoles.length > 0 ? Math.max(...completedHoles) : 0;
  }, [scores]);

  // Check if a hole is or should be greyed out (e.g., match is over)
  const isHoleGreyedOut = (holeNumber: number): boolean => {
    if (matchStatus !== 'completed') return false;
    
    // Find the match-deciding hole
    const completedScores = scores.filter(s => s.aviatorScore !== null && s.producerScore !== null);
    if (completedScores.length === 0) return false;
    
    // Count aviator wins vs producer wins
    let aviatorWins = 0;
    let producerWins = 0;
    
    // Sort scores by hole number
    const sortedScores = [...completedScores].sort((a, b) => a.holeNumber - b.holeNumber);
    
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
  const getScoreInputValue = (holeNumber: number, team: 'aviator' | 'producer'): string => {
    const score = getScore(holeNumber);
    if (!score) return "";
    
    const value = team === 'aviator' ? score.aviatorScore : score.producerScore;
    return value !== null ? value.toString() : "";
  };
  
  // For Best Ball format, get an individual player's score
  const getPlayerScoreValue = (holeNumber: number, playerName: string, teamId: string): string => {
    const key = `${holeNumber}-${playerName}`;
    const holeScores = playerScores.get(key);
    if (!holeScores) return "";
    
    const playerScore = holeScores.find(ps => ps.player === playerName && ps.teamId === teamId);
    return playerScore?.score !== null && playerScore?.score !== undefined ? playerScore.score.toString() : "";
  };
  
  // Handle score input change for regular match types
  const handleScoreChange = (holeNumber: number, team: 'aviator' | 'producer', value: string) => {
    let numValue = null;
    
    // Only parse if the value is not empty
    if (value !== "") {
      // Ensure we're parsing a valid number
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        numValue = parsed;
      }
    }
    
    if (team === 'aviator') {
      const producerScore = getScore(holeNumber)?.producerScore || null;
      onScoreUpdate(holeNumber, numValue, producerScore);
    } else {
      const aviatorScore = getScore(holeNumber)?.aviatorScore || null;
      onScoreUpdate(holeNumber, aviatorScore, numValue);
    }
  };
  
  // Handle individual player score changes for Best Ball
  const handlePlayerScoreChange = (holeNumber: number, playerName: string, teamId: string, value: string) => {
    let numValue = null;
    
    // Only parse if the value is not empty
    if (value !== "") {
      // Ensure we're parsing a valid number
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        numValue = parsed;
      }
    }
    
    // Update player scores in state
    const key = `${holeNumber}-${teamId}`;
    let holeScores = playerScores.get(key) || [];
    
    // Find the player in the current hole scores
    const playerIndex = holeScores.findIndex(ps => ps.player === playerName);
    
    if (playerIndex >= 0) {
      // Update existing player score
      holeScores[playerIndex].score = numValue;
    } else {
      // Add new player score
      holeScores.push({
        player: playerName,
        score: numValue,
        teamId,
        playerId: teamId === 'aviator' 
          ? aviatorPlayersList.find(p => p.name === playerName)?.id || 0 
          : producerPlayersList.find(p => p.name === playerName)?.id || 0
      });
    }
    
    // Update state
    const newPlayerScores = new Map(playerScores);
    newPlayerScores.set(key, holeScores);
    setPlayerScores(newPlayerScores);
    
    // Calculate the best score for each team and update the match
    updateBestBallScores(holeNumber, newPlayerScores);
  };
  
  // Calculate Best Ball scores and update the match
  const updateBestBallScores = (holeNumber: number, scoreMap: Map<string, BestBallPlayerScore[]>) => {
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
      const validScores = aviatorHoleScores.filter(s => s.score !== null);
      if (validScores.length > 0) {
        aviatorScore = Math.min(...validScores.map(s => s.score || Infinity));
        if (aviatorScore === Infinity) aviatorScore = null;
      }
    }
    
    if (producerHoleScores.length > 0) {
      const validScores = producerHoleScores.filter(s => s.score !== null);
      if (validScores.length > 0) {
        producerScore = Math.min(...validScores.map(s => s.score || Infinity));
        if (producerScore === Infinity) producerScore = null;
      }
    }
    
    // Update match score
    onScoreUpdate(holeNumber, aviatorScore, producerScore);
    
    // If we have the callback for individual scores, call it
    if (onBestBallScoreUpdate) {
      const allPlayerScores = [...(aviatorHoleScores || []), ...(producerHoleScores || [])];
      onBestBallScoreUpdate(holeNumber, allPlayerScores);
    }
  };
  
  // Get match status for a hole (e.g., "1↑", "AS", etc.)
  const getMatchStatus = (holeNumber: number): string => {
    const score = getScore(holeNumber);
    if (!score || !score.matchStatus) return "-";
    return score.matchStatus;
  };
  
  // Calculate which player is the best score for a hole
  const isLowestScore = (holeNumber: number, playerName: string, teamId: string): boolean => {
    if (!isBestBall) return true; // Not applicable for non-Best Ball matches
    
    const key = `${holeNumber}-${teamId}`;
    const holeScores = playerScores.get(key) || [];
    
    if (holeScores.length < 2) return true; // If only one player, they are the best
    
    // Find current player's score
    const currentPlayerScore = holeScores.find(ps => ps.player === playerName)?.score;
    if (currentPlayerScore === null || currentPlayerScore === undefined) return false;
    
    // Find the minimum score in this team for this hole
    const validScores = holeScores.filter(s => s.score !== null && s.score !== undefined);
    if (validScores.length === 0) return false;
    
    const lowestScore = Math.min(...validScores.map(s => s.score || Infinity));
    
    // Check if this player has the lowest score
    return currentPlayerScore === lowestScore;
  };
  
  // Generate hole-by-hole match status (e.g., "1↑", "2↑", "AS") for the match status row
  const generateMatchStatus = (holeNumber: number): { text: string, color: string } => {
    const completedScores = scores
      .filter(s => s.holeNumber <= holeNumber && s.aviatorScore !== null && s.producerScore !== null)
      .sort((a, b) => a.holeNumber - b.holeNumber);
    
    if (completedScores.length === 0) return { text: '-', color: 'text-gray-400' };
    
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
      return { text: 'AS', color: 'text-gray-600' }; // All Square
    } else if (aviatorWins > producerWins) {
      return { text: `${lead}↑`, color: 'text-aviator' }; // Aviators up
    } else {
      return { text: `${lead}↑`, color: 'text-producer' }; // Producers up
    }
  };
  
  // Calculate totals for front nine (1-9)
  const frontNineTotals = useMemo(() => {
    let aviatorTotal = 0;
    let producerTotal = 0;
    let parTotal = 0;
    
    for (let i = 1; i <= 9; i++) {
      const hole = holes.find(h => h.number === i);
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
      parTotal
    };
  }, [holes, scores]);
  
  // Calculate totals for back nine (10-18)
  const backNineTotals = useMemo(() => {
    let aviatorTotal = 0;
    let producerTotal = 0;
    let parTotal = 0;
    
    for (let i = 10; i <= 18; i++) {
      const hole = holes.find(h => h.number === i);
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
      parTotal
    };
  }, [holes, scores]);
  
  // Calculate full round totals
  const roundTotals = useMemo(() => {
    return {
      aviatorTotal: frontNineTotals.aviatorTotal + backNineTotals.aviatorTotal,
      producerTotal: frontNineTotals.producerTotal + backNineTotals.producerTotal,
      parTotal: frontNineTotals.parTotal + backNineTotals.parTotal
    };
  }, [frontNineTotals, backNineTotals]);

  // Render regular scorecard for non-Best Ball match types
  const renderRegularScorecard = () => {
    return (
      <>
        {/* Front Nine */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 text-left font-semibold sticky left-0 bg-gray-100">Hole</th>
              {frontNine.map(hole => (
                <th key={hole.number} className="py-2 px-2 text-center font-semibold">{hole.number}</th>
              ))}
              <th className="py-2 px-2 text-center font-semibold bg-gray-200">OUT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold bg-gray-50 sticky left-0">Par</td>
              {frontNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center">{hole.par}</td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">{frontNineTotals.parTotal}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-aviator text-white">
                <div>The Aviators</div>
              </td>
              {frontNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`score-input w-8 h-8 text-center border border-gray-300 rounded ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                    value={getScoreInputValue(hole.number, 'aviator')}
                    onChange={(e) => handleScoreChange(hole.number, 'aviator', e.target.value)}
                    min="1"
                    max="12"
                    disabled={isHoleGreyedOut(hole.number)}
                  />
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {frontNineTotals.aviatorTotal > 0 ? frontNineTotals.aviatorTotal : '-'}
              </td>
            </tr>
            
            {/* Match Status Row */}
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-gray-100">Status</td>
              {frontNine.map(hole => {
                const status = generateMatchStatus(hole.number);
                return (
                  <td key={hole.number} className={`py-2 px-2 text-center font-semibold ${status.color}`}>
                    {status.text}
                  </td>
                );
              })}
              <td className="py-2 px-2 text-center bg-gray-100">-</td>
            </tr>
            
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-producer text-white">
                <div>The Producers</div>
              </td>
              {frontNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`score-input w-8 h-8 text-center border border-gray-300 rounded ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                    value={getScoreInputValue(hole.number, 'producer')}
                    onChange={(e) => handleScoreChange(hole.number, 'producer', e.target.value)}
                    min="1"
                    max="12"
                    disabled={isHoleGreyedOut(hole.number)}
                  />
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {frontNineTotals.producerTotal > 0 ? frontNineTotals.producerTotal : '-'}
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* Back Nine */}
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 text-left font-semibold sticky left-0 bg-gray-100">Hole</th>
              {backNine.map(hole => (
                <th key={hole.number} className="py-2 px-2 text-center font-semibold">{hole.number}</th>
              ))}
              <th className="py-2 px-2 text-center font-semibold bg-gray-200">IN</th>
              <th className="py-2 px-2 text-center font-semibold bg-gray-300">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold bg-gray-50 sticky left-0">Par</td>
              {backNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center">{hole.par}</td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">{backNineTotals.parTotal}</td>
              <td className="py-2 px-2 text-center font-semibold bg-gray-200">{roundTotals.parTotal}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-aviator text-white">
                <div>The Aviators</div>
              </td>
              {backNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`score-input w-8 h-8 text-center border border-gray-300 rounded ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                    value={getScoreInputValue(hole.number, 'aviator')}
                    onChange={(e) => handleScoreChange(hole.number, 'aviator', e.target.value)}
                    min="1"
                    max="12"
                    disabled={isHoleGreyedOut(hole.number)}
                  />
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {backNineTotals.aviatorTotal > 0 ? backNineTotals.aviatorTotal : '-'}
              </td>
              <td className="py-2 px-2 text-center font-semibold bg-gray-200">
                {roundTotals.aviatorTotal > 0 ? roundTotals.aviatorTotal : '-'}
              </td>
            </tr>
            
            {/* Match Status Row */}
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-gray-100">Status</td>
              {backNine.map(hole => {
                const status = generateMatchStatus(hole.number);
                return (
                  <td key={hole.number} className={`py-2 px-2 text-center font-semibold ${status.color}`}>
                    {status.text}
                  </td>
                );
              })}
              <td className="py-2 px-2 text-center bg-gray-100">-</td>
              <td className="py-2 px-2 text-center bg-gray-200">-</td>
            </tr>
            
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-producer text-white">
                <div>The Producers</div>
              </td>
              {backNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`score-input w-8 h-8 text-center border border-gray-300 rounded ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                    value={getScoreInputValue(hole.number, 'producer')}
                    onChange={(e) => handleScoreChange(hole.number, 'producer', e.target.value)}
                    min="1"
                    max="12"
                    disabled={isHoleGreyedOut(hole.number)}
                  />
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {backNineTotals.producerTotal > 0 ? backNineTotals.producerTotal : '-'}
              </td>
              <td className="py-2 px-2 text-center font-semibold bg-gray-200">
                {roundTotals.producerTotal > 0 ? roundTotals.producerTotal : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  };

  // Render Best Ball scorecard
  const renderBestBallScorecard = () => {
    return (
      <>
        {/* Front Nine */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 text-left font-semibold sticky left-0 bg-gray-100">Hole</th>
              {frontNine.map(hole => (
                <th key={hole.number} className="py-2 px-2 text-center font-semibold">{hole.number}</th>
              ))}
              <th className="py-2 px-2 text-center font-semibold bg-gray-200">OUT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold bg-gray-50 sticky left-0">Par</td>
              {frontNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center">{hole.par}</td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">{frontNineTotals.parTotal}</td>
            </tr>
            
            {/* Aviator Players Rows */}
            {aviatorPlayersList.map(player => (
              <tr key={player.id} className="border-b border-gray-200">
                <td className="py-2 px-2 sticky left-0 bg-aviator text-white">
                  <div className="text-xs font-medium">{player.name}</div>
                </td>
                {frontNine.map(hole => {
                  const isLowest = isLowestScore(hole.number, player.name, "aviator");
                  return (
                    <td key={hole.number} className="py-2 px-2 text-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                          ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''} 
                          ${!isLowest ? 'opacity-60' : ''}`}
                        value={getPlayerScoreValue(hole.number, player.name, "aviator")}
                        onChange={(e) => handlePlayerScoreChange(hole.number, player.name, "aviator", e.target.value)}
                        min="1"
                        max="12"
                        disabled={isHoleGreyedOut(hole.number)}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center bg-gray-100">-</td>
              </tr>
            ))}
            
            {/* Team Score Row */}
            <tr className="border-b border-gray-200 bg-aviator bg-opacity-20">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-aviator text-white">
                <div>Best Ball</div>
              </td>
              {frontNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center font-semibold">
                  {getScoreInputValue(hole.number, 'aviator') || '-'}
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {frontNineTotals.aviatorTotal > 0 ? frontNineTotals.aviatorTotal : '-'}
              </td>
            </tr>
            
            {/* Match Status Row */}
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-gray-100">Status</td>
              {frontNine.map(hole => {
                const status = generateMatchStatus(hole.number);
                return (
                  <td key={hole.number} className={`py-2 px-2 text-center font-semibold ${status.color}`}>
                    {status.text}
                  </td>
                );
              })}
              <td className="py-2 px-2 text-center bg-gray-100">-</td>
            </tr>
            
            {/* Team Score Row */}
            <tr className="border-b border-gray-200 bg-producer bg-opacity-20">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-producer text-white">
                <div>Best Ball</div>
              </td>
              {frontNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center font-semibold">
                  {getScoreInputValue(hole.number, 'producer') || '-'}
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {frontNineTotals.producerTotal > 0 ? frontNineTotals.producerTotal : '-'}
              </td>
            </tr>
            
            {/* Producer Players Rows */}
            {producerPlayersList.map(player => (
              <tr key={player.id} className="border-b border-gray-200">
                <td className="py-2 px-2 sticky left-0 bg-producer text-white">
                  <div className="text-xs font-medium">{player.name}</div>
                </td>
                {frontNine.map(hole => {
                  const isLowest = isLowestScore(hole.number, player.name, "producer");
                  return (
                    <td key={hole.number} className="py-2 px-2 text-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                          ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''} 
                          ${!isLowest ? 'opacity-60' : ''}`}
                        value={getPlayerScoreValue(hole.number, player.name, "producer")}
                        onChange={(e) => handlePlayerScoreChange(hole.number, player.name, "producer", e.target.value)}
                        min="1"
                        max="12"
                        disabled={isHoleGreyedOut(hole.number)}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center bg-gray-100">-</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Back Nine */}
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 text-left font-semibold sticky left-0 bg-gray-100">Hole</th>
              {backNine.map(hole => (
                <th key={hole.number} className="py-2 px-2 text-center font-semibold">{hole.number}</th>
              ))}
              <th className="py-2 px-2 text-center font-semibold bg-gray-200">IN</th>
              <th className="py-2 px-2 text-center font-semibold bg-gray-300">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold bg-gray-50 sticky left-0">Par</td>
              {backNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center">{hole.par}</td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">{backNineTotals.parTotal}</td>
              <td className="py-2 px-2 text-center font-semibold bg-gray-200">{roundTotals.parTotal}</td>
            </tr>
            
            {/* Aviator Players Rows */}
            {aviatorPlayersList.map(player => (
              <tr key={player.id} className="border-b border-gray-200">
                <td className="py-2 px-2 sticky left-0 bg-aviator text-white">
                  <div className="text-xs font-medium">{player.name}</div>
                </td>
                {backNine.map(hole => {
                  const isLowest = isLowestScore(hole.number, player.name, "aviator");
                  return (
                    <td key={hole.number} className="py-2 px-2 text-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                          ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''} 
                          ${!isLowest ? 'opacity-60' : ''}`}
                        value={getPlayerScoreValue(hole.number, player.name, "aviator")}
                        onChange={(e) => handlePlayerScoreChange(hole.number, player.name, "aviator", e.target.value)}
                        min="1"
                        max="12"
                        disabled={isHoleGreyedOut(hole.number)}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center bg-gray-100">-</td>
                <td className="py-2 px-2 text-center bg-gray-200">-</td>
              </tr>
            ))}
            
            {/* Team Score Row */}
            <tr className="border-b border-gray-200 bg-aviator bg-opacity-20">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-aviator text-white">
                <div>Best Ball</div>
              </td>
              {backNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center font-semibold">
                  {getScoreInputValue(hole.number, 'aviator') || '-'}
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {backNineTotals.aviatorTotal > 0 ? backNineTotals.aviatorTotal : '-'}
              </td>
              <td className="py-2 px-2 text-center font-semibold bg-gray-200">
                {roundTotals.aviatorTotal > 0 ? roundTotals.aviatorTotal : '-'}
              </td>
            </tr>
            
            {/* Match Status Row */}
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-gray-100">Status</td>
              {backNine.map(hole => {
                const status = generateMatchStatus(hole.number);
                return (
                  <td key={hole.number} className={`py-2 px-2 text-center font-semibold ${status.color}`}>
                    {status.text}
                  </td>
                );
              })}
              <td className="py-2 px-2 text-center bg-gray-100">-</td>
              <td className="py-2 px-2 text-center bg-gray-200">-</td>
            </tr>
            
            {/* Team Score Row */}
            <tr className="border-b border-gray-200 bg-producer bg-opacity-20">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-producer text-white">
                <div>Best Ball</div>
              </td>
              {backNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center font-semibold">
                  {getScoreInputValue(hole.number, 'producer') || '-'}
                </td>
              ))}
              <td className="py-2 px-2 text-center font-semibold bg-gray-100">
                {backNineTotals.producerTotal > 0 ? backNineTotals.producerTotal : '-'}
              </td>
              <td className="py-2 px-2 text-center font-semibold bg-gray-200">
                {roundTotals.producerTotal > 0 ? roundTotals.producerTotal : '-'}
              </td>
            </tr>
            
            {/* Producer Players Rows */}
            {producerPlayersList.map(player => (
              <tr key={player.id} className="border-b border-gray-200">
                <td className="py-2 px-2 sticky left-0 bg-producer text-white">
                  <div className="text-xs font-medium">{player.name}</div>
                </td>
                {backNine.map(hole => {
                  const isLowest = isLowestScore(hole.number, player.name, "producer");
                  return (
                    <td key={hole.number} className="py-2 px-2 text-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`score-input w-8 h-8 text-center border border-gray-300 rounded 
                          ${isHoleGreyedOut(hole.number) ? 'bg-gray-200 cursor-not-allowed' : ''} 
                          ${!isLowest ? 'opacity-60' : ''}`}
                        value={getPlayerScoreValue(hole.number, player.name, "producer")}
                        onChange={(e) => handlePlayerScoreChange(hole.number, player.name, "producer", e.target.value)}
                        min="1"
                        max="12"
                        disabled={isHoleGreyedOut(hole.number)}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-2 text-center bg-gray-100">-</td>
                <td className="py-2 px-2 text-center bg-gray-200">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-heading font-bold">Match Scorecard</h3>
        <p className="text-sm text-muted-foreground">{matchType}</p>
      </div>
      
      <div className="p-3 overflow-x-auto">
        {isBestBall ? renderBestBallScorecard() : renderRegularScorecard()}
      </div>
      
      {/* The CSS for this component is in index.css */}
    </div>
  );
};

export default EnhancedMatchScorecard;
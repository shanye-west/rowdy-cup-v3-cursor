import { useState, useEffect } from "react";

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

interface MatchScorecardProps {
  matchId: number;
  holes: Hole[];
  scores: Score[];
  onScoreUpdate: (holeNumber: number, aviatorScore: number | null, producerScore: number | null) => void;
}

const MatchScorecard = ({ matchId, holes, scores, onScoreUpdate }: MatchScorecardProps) => {
  const frontNine = holes.filter(h => h.number <= 9);
  const backNine = holes.filter(h => h.number > 9);
  
  const getScore = (holeNumber: number): Score | undefined => {
    return scores.find(s => s.holeNumber === holeNumber);
  };
  
  const getHoleClass = (holeNumber: number): string => {
    const score = getScore(holeNumber);
    if (!score || !score.aviatorScore || !score.producerScore) return "";
    
    if (score.aviatorScore < score.producerScore) {
      return "bg-green-100"; // Aviators win
    } else if (score.producerScore < score.aviatorScore) {
      return "bg-green-100"; // Producers win
    }
    return ""; // Tied
  };
  
  const getScoreInputValue = (holeNumber: number, team: 'aviator' | 'producer'): string => {
    const score = getScore(holeNumber);
    if (!score) return "";
    
    const value = team === 'aviator' ? score.aviatorScore : score.producerScore;
    return value !== null ? value.toString() : "";
  };
  
  const handleScoreChange = (holeNumber: number, team: 'aviator' | 'producer', value: string) => {
    const numValue = value === "" ? null : parseInt(value);
    
    if (team === 'aviator') {
      const producerScore = getScore(holeNumber)?.producerScore || null;
      onScoreUpdate(holeNumber, numValue, producerScore);
    } else {
      const aviatorScore = getScore(holeNumber)?.aviatorScore || null;
      onScoreUpdate(holeNumber, aviatorScore, numValue);
    }
  };
  
  const getMatchStatus = (holeNumber: number): string => {
    const score = getScore(holeNumber);
    if (!score || !score.matchStatus) return "-";
    return score.matchStatus;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-heading font-bold">Match Scorecard</h3>
      </div>
      
      <div className="p-3 overflow-x-auto">
        {/* Front Nine */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 text-left font-semibold sticky left-0 bg-gray-100">Hole</th>
              {frontNine.map(hole => (
                <th key={hole.number} className="py-2 px-2 text-center font-semibold">{hole.number}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold bg-gray-50 sticky left-0">Par</td>
              {frontNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center">{hole.par}</td>
              ))}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-aviator text-white">
                <div>AVT</div>
              </td>
              {frontNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  {hole.number <= 18 ? (
                    <input
                      type="number"
                      className="score-input w-8 h-8 text-center border border-gray-300 rounded"
                      value={getScoreInputValue(hole.number, 'aviator')}
                      onChange={(e) => handleScoreChange(hole.number, 'aviator', e.target.value)}
                      min="1"
                      max="12"
                    />
                  ) : (
                    getScoreInputValue(hole.number, 'aviator')
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-producer text-white">
                <div>PRD</div>
              </td>
              {frontNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  {hole.number <= 18 ? (
                    <input
                      type="number"
                      className="score-input w-8 h-8 text-center border border-gray-300 rounded"
                      value={getScoreInputValue(hole.number, 'producer')}
                      onChange={(e) => handleScoreChange(hole.number, 'producer', e.target.value)}
                      min="1"
                      max="12"
                    />
                  ) : (
                    getScoreInputValue(hole.number, 'producer')
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 px-2 font-semibold text-xs sticky left-0 bg-gray-50">Score</td>
              {frontNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center text-xs">
                  {getMatchStatus(hole.number)}
                </td>
              ))}
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
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold bg-gray-50 sticky left-0">Par</td>
              {backNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center">{hole.par}</td>
              ))}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-aviator text-white">
                <div>AVT</div>
              </td>
              {backNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  {hole.number <= 18 ? (
                    <input
                      type="number"
                      className="score-input w-8 h-8 text-center border border-gray-300 rounded"
                      value={getScoreInputValue(hole.number, 'aviator')}
                      onChange={(e) => handleScoreChange(hole.number, 'aviator', e.target.value)}
                      min="1"
                      max="12"
                    />
                  ) : (
                    getScoreInputValue(hole.number, 'aviator')
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-2 font-semibold sticky left-0 bg-producer text-white">
                <div>PRD</div>
              </td>
              {backNine.map(hole => (
                <td key={hole.number} className={`py-2 px-2 text-center ${getHoleClass(hole.number)}`}>
                  {hole.number <= 18 ? (
                    <input
                      type="number"
                      className="score-input w-8 h-8 text-center border border-gray-300 rounded"
                      value={getScoreInputValue(hole.number, 'producer')}
                      onChange={(e) => handleScoreChange(hole.number, 'producer', e.target.value)}
                      min="1"
                      max="12"
                    />
                  ) : (
                    getScoreInputValue(hole.number, 'producer')
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 px-2 font-semibold text-xs sticky left-0 bg-gray-50">Score</td>
              {backNine.map(hole => (
                <td key={hole.number} className="py-2 px-2 text-center text-xs">
                  {getMatchStatus(hole.number)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchScorecard;

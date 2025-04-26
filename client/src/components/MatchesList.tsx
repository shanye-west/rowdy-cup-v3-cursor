import { useLocation } from "wouter";

interface Match {
  id: number;
  name: string;
  status: string;
  aviatorPlayers: string;
  producerPlayers: string;
  leadingTeam: string | null;
  leadAmount: number;
  result: string | null;
}

interface MatchesListProps {
  matches: Match[];
}

const MatchesList = ({ matches }: MatchesListProps) => {
  const [_, navigate] = useLocation();

  const handleMatchClick = (matchId: number) => {
    navigate(`/matches/${matchId}`);
  };

  const renderMatchStatus = (match: Match) => {
    if (match.status === "completed") {
      return (
        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
          Completed
        </span>
      );
    } else if (match.status === "in_progress") {
      return (
        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
          In Progress
        </span>
      );
    } else {
      return (
        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
          Upcoming
        </span>
      );
    }
  };

  const renderMatchResult = (match: Match) => {
    if (match.status === "completed" && match.result) {
      const winningTeam = match.leadingTeam === "aviators" 
        ? <span className="text-aviator">AVIATORS</span> 
        : <span className="text-producer">PRODUCERS</span>;
        
      return (
        <div className="text-center bg-gray-100 py-2 rounded-lg font-heading font-bold">
          {winningTeam} win {match.result}
        </div>
      );
    } else if (match.status === "in_progress" && match.leadingTeam) {
      const leadingTeam = match.leadingTeam === "aviators" 
        ? <span className="text-aviator">AVIATORS</span> 
        : <span className="text-producer">PRODUCERS</span>;
        
      return (
        <div className="flex justify-center items-center">
          <div className="text-center py-1 px-3 rounded-lg font-heading font-bold bg-gray-100">
            {leadingTeam}
            <span className="text-sm font-mono bg-white px-2 py-1 rounded ml-1">
              {match.leadAmount} UP
            </span>
          </div>
          <div className="text-xs text-gray-500 ml-2">
            Hole {match.currentHole || 1}
          </div>
        </div>
      );
    } else if (match.status === "in_progress") {
      return (
        <div className="text-center bg-gray-100 py-2 rounded-lg font-heading font-bold">
          ALL SQUARE
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <div 
          key={match.id}
          className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
          onClick={() => handleMatchClick(match.id)}
        >
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="font-heading font-bold">{match.name}</h4>
            {renderMatchStatus(match)}
          </div>
          
          <div className="p-4">
            <div className="flex mb-4">
              <div className="w-1/2 border-r border-gray-200 pr-3">
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-aviator mr-2"></div>
                  <span className="font-semibold text-sm">AVIATORS</span>
                </div>
                <div className="text-sm">{match.aviatorPlayers}</div>
              </div>
              
              <div className="w-1/2 pl-3">
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 rounded-full bg-producer mr-2"></div>
                  <span className="font-semibold text-sm">PRODUCERS</span>
                </div>
                <div className="text-sm">{match.producerPlayers}</div>
              </div>
            </div>
            
            {renderMatchResult(match)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchesList;

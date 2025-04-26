import { useLocation } from "wouter";

interface MatchHeaderProps {
  id: number;
  name: string;
  roundId: number;
  roundName?: string;
  matchType?: string;
  aviatorPlayers: string;
  producerPlayers: string;
  leadingTeam: string | null;
  leadAmount: number;
  currentHole: number;
  status?: string;
  result?: string | null;
}

const MatchHeader = ({
  id,
  name,
  roundId,
  roundName = "Round",
  matchType = "",
  aviatorPlayers,
  producerPlayers,
  leadingTeam,
  leadAmount,
  currentHole,
  status = "in_progress",
  result = null,
}: MatchHeaderProps) => {
  const [_, navigate] = useLocation();

  const handleBackClick = () => {
    navigate(`/rounds/${roundId}`);
  };

  return (
    <div className="mb-6">
      <button 
        className="mb-2 flex items-center font-semibold text-blue-600"
        onClick={handleBackClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Round
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3">
          <h2 className="font-heading font-bold text-xl">{name}</h2>
          <p className="text-sm text-gray-300">{matchType} • {roundName}</p>
        </div>
        
        <div className="p-4">
          <div className="flex mb-3">
            <div className="w-1/2 border-r border-gray-200 pr-3">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-aviator mr-2"></div>
                <span className="font-semibold text-sm">AVIATORS</span>
              </div>
              <div className="text-sm font-semibold">{aviatorPlayers}</div>
            </div>
            
            <div className="w-1/2 pl-3">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full bg-producer mr-2"></div>
                <span className="font-semibold text-sm">PRODUCERS</span>
              </div>
              <div className="text-sm font-semibold">{producerPlayers}</div>
            </div>
          </div>
          
          {/* Display final match result when completed */}
          {status === "completed" && result ? (
            <div className="flex justify-center items-center">
              <div className="text-center py-2 px-4 rounded-lg font-heading font-bold bg-gray-100 text-lg">
                <span className={leadingTeam === "aviators" ? "text-aviator" : "text-producer"}>
                  {leadingTeam === "aviators" ? "Aviators" : "Producers"} win {result}
                </span>
              </div>
            </div>
          ) : leadingTeam ? (
            <div className="flex justify-center items-center">
              <div className="text-center py-1 px-3 rounded-lg font-heading font-bold bg-gray-100">
                <span className={leadingTeam === "aviators" ? "text-aviator" : "text-producer"}>
                  {leadingTeam === "aviators" ? "AVIATORS" : "PRODUCERS"}
                </span>
                <span className="text-sm font-mono bg-white px-2 py-1 rounded ml-1">
                  {leadAmount} UP
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-2">
                <span>Hole {currentHole}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center">
              <div className="text-center py-1 px-3 rounded-lg font-heading font-bold bg-gray-100">
                ALL SQUARE
              </div>
              <div className="text-xs text-gray-500 ml-2">
                <span>Hole {currentHole}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchHeader;

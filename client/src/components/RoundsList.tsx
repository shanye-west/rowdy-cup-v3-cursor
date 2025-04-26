import { useLocation } from "wouter";

interface Round {
  id: number;
  name: string;
  matchType: string;
  date: string;
  courseName: string;
  startTime: string;
  aviatorScore: number;
  producerScore: number;
  isComplete: boolean;
}

interface RoundsListProps {
  rounds: Round[];
}

const RoundsList = ({ rounds }: RoundsListProps) => {
  const [_, navigate] = useLocation();

  const handleRoundClick = (roundId: number) => {
    navigate(`/rounds/${roundId}`);
  };

  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <div 
          key={round.id}
          className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
          onClick={() => handleRoundClick(round.id)}
        >
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h3 className="font-heading font-bold">{round.name}</h3>
            <p className="text-sm text-gray-600 font-medium">{round.courseName}</p>
            <p className="text-sm text-gray-600">{round.matchType}</p>
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-aviator mr-2"></div>
                <span className="font-semibold">{round.aviatorScore}</span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold">{round.producerScore}</span>
                <div className="w-3 h-3 rounded-full bg-producer ml-2"></div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
              <div>{round.date}</div>
              <div>{round.startTime}</div>
            </div>
            {!round.isComplete && (
              <div className="mt-2">
                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  In Progress
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoundsList;

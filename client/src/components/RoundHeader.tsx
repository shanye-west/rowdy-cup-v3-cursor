import { useLocation } from "wouter";

interface RoundHeaderProps {
  id: number;
  name: string;
  matchType: string;
  aviatorScore: number;
  producerScore: number;
  date: string;
  matchCount: number;
}

const RoundHeader = ({ 
  id, 
  name, 
  matchType, 
  aviatorScore, 
  producerScore, 
  date,
  matchCount 
}: RoundHeaderProps) => {
  const [_, navigate] = useLocation();

  const handleBackClick = () => {
    navigate('/');
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
        Back to Tournament
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3">
          <h2 className="font-heading font-bold text-xl">{name}</h2>
          <p className="text-sm text-gray-300">{matchType}</p>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-aviator mr-2"></div>
              <span className="font-heading font-bold text-xl">{aviatorScore}</span>
            </div>
            <div className="flex items-center">
              <span className="font-heading font-bold text-xl">{producerScore}</span>
              <div className="w-4 h-4 rounded-full bg-producer ml-2"></div>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>{matchCount} Matches • {date}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundHeader;

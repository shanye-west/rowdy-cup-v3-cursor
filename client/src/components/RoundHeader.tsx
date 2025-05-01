import { useLocation } from "wouter";
import aviatorsLogo from "../assets/Aviators.svg";
import producersLogo from "../assets/Producers.svg";

interface RoundHeaderProps {
  id: number;
  name: string;
  matchType: string;
  courseName: string;
  startTime: string;
  aviatorScore: number;
  producerScore: number;
  pendingAviatorScore?: number;
  pendingProducerScore?: number;
  date: string;
  matchCount: number;
}

const RoundHeader = ({ 
  id, 
  name, 
  matchType,
  courseName,
  startTime, 
  aviatorScore, 
  producerScore,
  pendingAviatorScore = 0,
  pendingProducerScore = 0,
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
          <p className="text-sm text-gray-300 mt-1 font-medium">{courseName}</p>
          <p className="text-sm text-gray-300">{matchType}</p>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <img src={aviatorsLogo} alt="Aviators" className="w-20 h-20 mr-5" />
              <div className="relative">
                <span className="font-heading font-bold text-3xl">{aviatorScore}</span>
                {pendingAviatorScore > 0 && (
                  <span className="absolute text-gray-400 text-sm font-normal bottom-0 -right-15.5" style={{ marginRight: '10px' }} title="Pending points">
                    +{pendingAviatorScore}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <div className="relative">
                <span className="font-heading font-bold text-3xl">{producerScore}</span>
                {pendingProducerScore > 0 && (
                  <span className="absolute text-gray-400 text-sm font-normal bottom-0 -left-11" style={{ marginLeft: '10px' }} title="Pending points">
                    +{pendingProducerScore}
                  </span>
                )}
              </div>
              <img src={producersLogo} alt="Producers" className="w-20 h-20 ml-5" />
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>{date} • {startTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundHeader;

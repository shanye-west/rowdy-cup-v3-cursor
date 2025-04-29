import aviatorsLogo from "../assets/aviators-logo.svg";
import producersLogo from "../assets/producers-logo.svg";
import aviatorsText from "../assets/aviators-text.svg";
import producersText from "../assets/producers-text.svg";

interface TournamentScoreProps {
  aviatorScore: number;
  producerScore: number;
  pendingAviatorScore?: number;
  pendingProducerScore?: number;
}

const TournamentScore = ({ 
  aviatorScore, 
  producerScore, 
  pendingAviatorScore = 0, 
  pendingProducerScore = 0 
}: TournamentScoreProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="text-center w-5/12">
          <div className="bg-aviator text-white py-2 px-6 rounded-t-lg flex items-center justify-center">
            <img src={aviatorsLogo} alt="Aviators" className="w-7 h-7 mr-2" />
            <img src={aviatorsText} alt="Aviators" className="w-15 h-15" />
          </div>
          <div className="text-5xl font-mono font-bold py-4 border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-lg relative">
            {aviatorScore}
            {pendingAviatorScore > 0 && (
              <span className="absolute text-gray-400 text-lg font-normal bottom-1 right-2" title="Pending points">
                +{pendingAviatorScore}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-xl font-heading font-bold">VS</div>
        
        <div className="text-center w-5/12">
          <div className="bg-producer text-white py-2 px-6 rounded-t-lg flex items-center justify-center">
            <img src={producersLogo} alt="Producers" className="w-7 h-7 mr-1" />
            <img src={producersText} alt="Producers" className="w-15 h-15" />
          </div>
          <div className="text-5xl font-mono font-bold py-4 border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-lg relative">
            {producerScore}
            {pendingProducerScore > 0 && (
              <span className="absolute text-gray-400 text-lg font-normal bottom-1 right-2" title="Pending points">
                +{pendingProducerScore}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentScore;

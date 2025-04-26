import aviatorsLogo from "../assets/aviators-logo.svg";
import producersLogo from "../assets/producers-logo.svg";

interface TournamentScoreProps {
  aviatorScore: number;
  producerScore: number;
}

const TournamentScore = ({ aviatorScore, producerScore }: TournamentScoreProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="text-center w-5/12">
          <div className="bg-aviator text-white py-2 px-3 rounded-t-lg flex items-center justify-center">
            <img src={aviatorsLogo} alt="Aviators" className="w-6 h-6 mr-2" />
            <h3 className="font-heading font-bold">AVIATORS</h3>
          </div>
          <div className="text-5xl font-mono font-bold py-4 border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-lg">
            {aviatorScore}
          </div>
        </div>
        
        <div className="text-xl font-heading font-bold">VS</div>
        
        <div className="text-center w-5/12">
          <div className="bg-producer text-white py-2 px-3 rounded-t-lg flex items-center justify-center">
            <img src={producersLogo} alt="Producers" className="w-6 h-6 mr-2" />
            <h3 className="font-heading font-bold">PRODUCERS</h3>
          </div>
          <div className="text-5xl font-mono font-bold py-4 border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-lg">
            {producerScore}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentScore;

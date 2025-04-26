interface TournamentScoreProps {
  aviatorScore: number;
  producerScore: number;
}

const TournamentScore = ({ aviatorScore, producerScore }: TournamentScoreProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="font-heading text-center text-xl font-bold mb-4">Tournament Score</h2>
      <div className="flex justify-between items-center">
        <div className="text-center w-5/12">
          <div className="bg-aviator text-white py-2 px-3 rounded-t-lg">
            <h3 className="font-heading font-bold">AVIATORS</h3>
          </div>
          <div className="text-5xl font-mono font-bold py-4 border-b-2 border-l-2 border-r-2 border-gray-200 rounded-b-lg">
            {aviatorScore}
          </div>
        </div>
        
        <div className="text-xl font-heading font-bold">VS</div>
        
        <div className="text-center w-5/12">
          <div className="bg-producer text-white py-2 px-3 rounded-t-lg">
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

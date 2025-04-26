import { useState } from "react";

interface ScoreEntryProps {
  currentHole: number;
  aviatorScore: number | null;
  producerScore: number | null;
  onSaveScore: (aviatorScore: number, producerScore: number) => void;
}

const ScoreEntry = ({ 
  currentHole, 
  aviatorScore: initialAviatorScore, 
  producerScore: initialProducerScore,
  onSaveScore 
}: ScoreEntryProps) => {
  const [aviatorScore, setAviatorScore] = useState<number>(initialAviatorScore || 3);
  const [producerScore, setProducerScore] = useState<number>(initialProducerScore || 3);

  const handleAviatorDecrement = () => {
    if (aviatorScore > 1) {
      setAviatorScore(aviatorScore - 1);
    }
  };

  const handleAviatorIncrement = () => {
    setAviatorScore(aviatorScore + 1);
  };

  const handleProducerDecrement = () => {
    if (producerScore > 1) {
      setProducerScore(producerScore - 1);
    }
  };

  const handleProducerIncrement = () => {
    setProducerScore(producerScore + 1);
  };

  const handleSaveScore = () => {
    onSaveScore(aviatorScore, producerScore);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-heading font-bold">Update Score: Hole {currentHole}</h3>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Aviators Score</label>
            <div className="flex">
              <button 
                className="w-10 h-10 bg-gray-200 rounded-l-lg flex items-center justify-center"
                onClick={handleAviatorDecrement}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input 
                type="number" 
                className="score-input h-10 w-16 text-center border-t border-b border-gray-300" 
                value={aviatorScore}
                onChange={(e) => setAviatorScore(parseInt(e.target.value) || 1)}
                min="1"
              />
              <button 
                className="w-10 h-10 bg-gray-200 rounded-r-lg flex items-center justify-center"
                onClick={handleAviatorIncrement}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Producers Score</label>
            <div className="flex">
              <button 
                className="w-10 h-10 bg-gray-200 rounded-l-lg flex items-center justify-center"
                onClick={handleProducerDecrement}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input 
                type="number" 
                className="score-input h-10 w-16 text-center border-t border-b border-gray-300" 
                value={producerScore}
                onChange={(e) => setProducerScore(parseInt(e.target.value) || 1)}
                min="1"
              />
              <button 
                className="w-10 h-10 bg-gray-200 rounded-r-lg flex items-center justify-center"
                onClick={handleProducerIncrement}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <button 
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSaveScore}
        >
          Save Score
        </button>
      </div>
    </div>
  );
};

export default ScoreEntry;

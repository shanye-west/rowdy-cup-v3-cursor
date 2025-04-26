import { useQuery } from "@tanstack/react-query";
import TournamentScore from "@/components/TournamentScore";
import RoundsList from "@/components/RoundsList";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

const Home = () => {
  const [_, navigate] = useLocation();

  // Define types
  interface Tournament {
    id: number;
    name: string;
    year: number;
    aviatorScore: number;
    producerScore: number;
  }

  interface Round {
    id: number;
    name: string;
    matchType: string;
    courseName: string;
    startTime: string;
    date: string;
    isComplete: boolean;
    aviatorScore?: number;
    producerScore?: number;
  }

  // Fetch tournament data
  const { data: tournament, isLoading: isTournamentLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournament'],
  });

  // Fetch rounds data
  const { data: rounds, isLoading: isRoundsLoading } = useQuery<Round[]>({
    queryKey: ['/api/rounds'],
  });

  const isLoading = isTournamentLoading || isRoundsLoading;
  
  // Process rounds data to include scores
  const roundsWithScores = rounds?.map((round: Round) => {
    // Get scores for this round from matches
    const aviatorScore = round.aviatorScore || 0;
    const producerScore = round.producerScore || 0;
    
    return {
      ...round,
      aviatorScore,
      producerScore
    };
  }) || [];

  return (
    <div className="container mx-auto px-4 py-6">
      {isLoading ? (
        <>
          <div className="mb-6">
            <Skeleton className="h-10 w-48 mb-4 mx-auto" />
            <Skeleton className="h-20 w-full mb-2" />
          </div>
          <Skeleton className="h-8 w-32 mb-3" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Tournament Score */}
          <TournamentScore 
            aviatorScore={tournament?.aviatorScore || 0} 
            producerScore={tournament?.producerScore || 0} 
          />
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-heading text-xl font-bold">Rounds</h2>
            <button 
              onClick={() => navigate('/teams')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Team Rosters
            </button>
          </div>
          
          {/* Rounds List */}
          <RoundsList rounds={roundsWithScores || []} />
        </>
      )}
    </div>
  );
};

export default Home;

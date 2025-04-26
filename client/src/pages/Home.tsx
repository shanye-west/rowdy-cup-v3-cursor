import { useQuery } from "@tanstack/react-query";
import TournamentScore from "@/components/TournamentScore";
import RoundsList from "@/components/RoundsList";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import rowdyCupLogo from "../assets/rowdy-cup-logo.svg";

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
          {/* Rowdy Cup Logo */}
          <div className="flex justify-center mb-4">
            <img src={rowdyCupLogo} alt="Rowdy Cup" className="h-24" />
          </div>
          
          {/* Tournament Score */}
          <TournamentScore 
            aviatorScore={tournament?.aviatorScore || 0} 
            producerScore={tournament?.producerScore || 0} 
          />
          
          {/* Section Title */}
          <div className="mb-5">
            <h2 className="font-heading text-xl font-bold">Rounds</h2>
          </div>
          
          {/* Rounds List */}
          <RoundsList rounds={roundsWithScores || []} />
        </>
      )}
    </div>
  );
};

export default Home;

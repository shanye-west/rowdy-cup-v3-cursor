import { useQuery } from "@tanstack/react-query";
import TournamentScore from "@/components/TournamentScore";
import RoundsList from "@/components/RoundsList";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  // Fetch tournament data
  const { data: tournament, isLoading: isTournamentLoading } = useQuery({
    queryKey: ['/api/tournament'],
  });

  // Fetch rounds data
  const { data: rounds, isLoading: isRoundsLoading } = useQuery({
    queryKey: ['/api/rounds'],
  });

  const isLoading = isTournamentLoading || isRoundsLoading;
  
  // Process rounds data to include scores
  const roundsWithScores = rounds?.map((round: any) => {
    // Get scores for this round from matches
    const aviatorScore = round.aviatorScore || 0;
    const producerScore = round.producerScore || 0;
    
    return {
      ...round,
      aviatorScore,
      producerScore
    };
  });

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
          
          {/* Rounds List */}
          <h2 className="font-heading text-xl font-bold mb-3">Rounds</h2>
          <RoundsList rounds={roundsWithScores || []} />
        </>
      )}
    </div>
  );
};

export default Home;

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import RoundHeader from "@/components/RoundHeader";
import MatchesList from "@/components/MatchesList";

interface RoundProps {
  id: number;
}

const Round = ({ id }: RoundProps) => {
  // Fetch round data
  const { data: round, isLoading: isRoundLoading } = useQuery({
    queryKey: [`/api/rounds/${id}`],
  });

  // Fetch matches for this round
  const { data: matches, isLoading: isMatchesLoading } = useQuery({
    queryKey: [`/api/matches?roundId=${id}`],
  });

  const isLoading = isRoundLoading || isMatchesLoading;

  return (
    <div className="container mx-auto px-4 py-6">
      {isLoading ? (
        <>
          <div className="mb-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-36 w-full" />
          </div>
          <Skeleton className="h-6 w-28 mb-3" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Round Header */}
          <RoundHeader 
            id={round.id}
            name={round.name}
            matchType={round.matchType}
            courseName={round.courseName}
            startTime={round.startTime}
            aviatorScore={round.aviatorScore || 0}
            producerScore={round.producerScore || 0}
            date={round.date}
            matchCount={matches?.length || 0}
          />
          
          {/* Matches List */}
          <h3 className="font-heading text-lg font-bold mb-3">Matches</h3>
          <MatchesList matches={matches || []} />
        </>
      )}
    </div>
  );
};

export default Round;

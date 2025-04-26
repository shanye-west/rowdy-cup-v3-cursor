import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MatchHeader from "@/components/MatchHeader";
import MatchScorecard from "@/components/MatchScorecard";
import ScoreEntry from "@/components/ScoreEntry";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MatchProps {
  id: number;
}

interface MatchData {
  id: number;
  roundId: number;
  name: string;
  status: string;
  aviatorPlayers: string;
  producerPlayers: string;
  currentHole: number;
  leadingTeam: string | null;
  leadAmount: number;
  result: string | null;
}

interface RoundData {
  id: number;
  name: string;
  matchType: string;
  courseName: string;
  startTime: string;
  aviatorScore: number;
  producerScore: number;
  date: string;
  isComplete: boolean;
}

interface HoleData {
  id: number;
  number: number;
  par: number;
}

interface ScoreData {
  id: number;
  matchId: number;
  holeNumber: number;
  aviatorScore: number | null;
  producerScore: number | null;
  winningTeam: string | null;
  matchStatus: string | null;
}

const Match = ({ id }: MatchProps) => {
  const { toast } = useToast();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [matchSummary, setMatchSummary] = useState({
    aviatorTotal: 0,
    producerTotal: 0,
    result: '',
    leadingTeam: ''
  });

  // Fetch match data
  const { data: match, isLoading: isMatchLoading } = useQuery<MatchData>({
    queryKey: [`/api/matches/${id}`],
  });

  // Fetch scores for this match
  const { data: scores, isLoading: isScoresLoading } = useQuery<ScoreData[]>({
    queryKey: [`/api/scores?matchId=${id}`],
  });

  // Fetch holes data
  const { data: holes, isLoading: isHolesLoading } = useQuery<HoleData[]>({
    queryKey: ['/api/holes'],
  });

  // Fetch round data
  const { data: round, isLoading: isRoundLoading } = useQuery<RoundData>({
    queryKey: [`/api/rounds/${match?.roundId}`],
    enabled: !!match?.roundId,
  });

  const isLoading = isMatchLoading || isScoresLoading || isHolesLoading || isRoundLoading;

  // Check if match is completed or should be completed
  useEffect(() => {
    if (!scores || !match || match.status === "completed") return;
    
    // Calculate completedHoles and check for match completion conditions
    const completedScores = scores.filter(score => 
      score.aviatorScore !== null && score.producerScore !== null
    );
    
    // If all 18 holes are filled or match is clinched
    if (completedScores.length === 18 || (match.leadAmount > (18 - Math.max(...completedScores.map(s => s.holeNumber), 0)))) {
      // Calculate totals for the summary
      let aviatorTotal = 0;
      let producerTotal = 0;
      completedScores.forEach(score => {
        if (score.aviatorScore) aviatorTotal += score.aviatorScore;
        if (score.producerScore) producerTotal += score.producerScore;
      });
      
      // Set match summary data
      setMatchSummary({
        aviatorTotal,
        producerTotal,
        result: match.result || 'Pending',
        leadingTeam: match.leadingTeam || 'tied'
      });
      
      // Show completion dialog
      setShowCompletionDialog(true);
    }
  }, [scores, match]);

  // Function to update score
  const updateScoreMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      const existingScore = scores?.find(s => s.holeNumber === scoreData.holeNumber);
      
      if (existingScore) {
        // Update existing score
        return apiRequest('PUT', `/api/scores/${existingScore.id}`, scoreData);
      } else {
        // Create new score
        return apiRequest('POST', '/api/scores', scoreData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Score updated",
        description: "The score has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating score",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleScoreUpdate = (holeNumber: number, aviatorScore: number | null, producerScore: number | null) => {
    // Allow updates even if one of the scores is null
    const scoreData = {
      matchId: id,
      holeNumber,
      aviatorScore,
      producerScore,
    };
    
    updateScoreMutation.mutate(scoreData);
  };

  const handleSaveScore = (aviatorScore: number, producerScore: number) => {
    if (!match) return;
    
    const scoreData = {
      matchId: id,
      holeNumber: match.currentHole,
      aviatorScore,
      producerScore,
    };
    
    updateScoreMutation.mutate(scoreData);
  };

  // Get the score for the current hole
  const getCurrentHoleScore = () => {
    if (!match || !scores) return { aviatorScore: null, producerScore: null };
    
    const currentHoleScore = scores.find(s => s.holeNumber === match.currentHole);
    return {
      aviatorScore: currentHoleScore?.aviatorScore || null,
      producerScore: currentHoleScore?.producerScore || null,
    };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {isLoading || !match ? (
        <>
          <div className="mb-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-36 w-full" />
          </div>
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </>
      ) : (
        <>
          {/* Match Header */}
          <MatchHeader 
            id={match.id}
            name={match.name}
            roundId={match.roundId}
            roundName={round?.name}
            matchType={round?.matchType}
            aviatorPlayers={match.aviatorPlayers}
            producerPlayers={match.producerPlayers}
            leadingTeam={match.leadingTeam}
            leadAmount={match.leadAmount}
            currentHole={match.currentHole}
          />
          
          {/* Match Scorecard */}
          <MatchScorecard 
            matchId={id}
            holes={holes || []}
            scores={scores || []}
            onScoreUpdate={handleScoreUpdate}
          />
          
          {/* Score Entry Section - Only show if match is in progress */}
          {match.status === "in_progress" && (
            <ScoreEntry 
              currentHole={match.currentHole}
              aviatorScore={getCurrentHoleScore().aviatorScore}
              producerScore={getCurrentHoleScore().producerScore}
              onSaveScore={handleSaveScore}
            />
          )}
        </>
      )}
      
      {/* Match Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Match Complete</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p className="text-lg font-semibold">Final Score:</p>
                <div className="flex justify-between items-center">
                  <div className="bg-aviator text-white px-4 py-2 rounded">
                    <p className="font-bold">The Aviators</p>
                    <p className="text-2xl text-center">{matchSummary.aviatorTotal}</p>
                  </div>
                  <div className="text-xl font-bold">vs</div>
                  <div className="bg-producer text-white px-4 py-2 rounded">
                    <p className="font-bold">The Producers</p>
                    <p className="text-2xl text-center">{matchSummary.producerTotal}</p>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-lg">
                    {matchSummary.leadingTeam === 'aviators' ? 'The Aviators' : 
                     matchSummary.leadingTeam === 'producers' ? 'The Producers' : 'Match'} {' '}
                    {matchSummary.result !== 'AS' ? 'won' : 'tied'} {matchSummary.result && matchSummary.result}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Match;

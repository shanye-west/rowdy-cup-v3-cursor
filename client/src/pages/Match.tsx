import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import MatchHeader from "@/components/MatchHeader";
import EnhancedMatchScorecard from "@/components/EnhancedMatchScorecard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Edit, Save, Settings } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  const queryClient = useQueryClient();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [matchSummary, setMatchSummary] = useState({
    aviatorTotal: 0,
    producerTotal: 0,
    result: "",
    leadingTeam: "",
    matchPlayResult: "",
  });
  const [editMatchData, setEditMatchData] = useState({
    name: "",
    aviatorPlayers: "",
    producerPlayers: "",
  });

  // Check if admin mode is enabled via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsAdminMode(urlParams.get("admin") === "true");
  }, []);

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
    queryKey: ["/api/holes"],
  });

  // Fetch round data
  const { data: round, isLoading: isRoundLoading } = useQuery<RoundData>({
    queryKey: [`/api/rounds/${match?.roundId}`],
    enabled: !!match?.roundId,
  });

  const isLoading =
    isMatchLoading || isScoresLoading || isHolesLoading || isRoundLoading;

  // Function to update score
  const updateScoreMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      const existingScore = scores?.find(
        (s) => s.holeNumber === scoreData.holeNumber,
      );

      if (existingScore) {
        // Update existing score
        return apiRequest("PUT", `/api/scores/${existingScore.id}`, scoreData);
      } else {
        // Create new score
        return apiRequest("POST", "/api/scores", scoreData);
      }
    },
    onSuccess: () => {
      // Invalidate the scores query to refetch the data
      queryClient.invalidateQueries(`/api/scores?matchId=${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error updating score",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to update match
  const updateMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      return apiRequest("PUT", `/api/matches/${matchData.id}`, matchData);
    },
    onSuccess: () => {
      toast({
        title: "Match completed",
        description: "The match has been marked as completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error completing match",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate proper match play result (e.g., "3&2", "4&3", "1 UP")
  const calculateMatchPlayResult = (completedScores: ScoreData[]): string => {
    if (!completedScores.length) return "";

    let aviatorWins = 0;
    let producerWins = 0;
    let ties = 0;

    // Sort scores by hole number
    const sortedScores = [...completedScores].sort(
      (a, b) => a.holeNumber - b.holeNumber,
    );

    // Calculate wins and ties for each hole
    sortedScores.forEach((score) => {
      if (score.aviatorScore === null || score.producerScore === null) return;

      if (score.aviatorScore < score.producerScore) {
        aviatorWins++;
      } else if (score.producerScore < score.aviatorScore) {
        producerWins++;
      } else {
        ties++;
      }
    });

    // Calculate lead and holes remaining
    const lead = Math.abs(aviatorWins - producerWins);
    const highestHolePlayed = Math.max(
      ...sortedScores.map((s) => s.holeNumber),
    );
    const holesRemaining = 18 - highestHolePlayed;
    const totalCompleted = aviatorWins + producerWins + ties;

    // Match play result format
    if (lead === 0 && totalCompleted === 18) {
      // Tied match after all holes
      return "AS";
    } else if (lead > holesRemaining) {
      // Match clinched before 18 holes
      const leadingTeam = aviatorWins > producerWins ? "aviators" : "producers";
      return `${lead} UP`;
    } else if (lead > 0 && totalCompleted === 18) {
      // Match completed with a winner after 18 holes
      return `${lead} UP`;
    }

    return "";
  };

  // Check if match is completed or should be completed
  useEffect(() => {
    if (!scores || !match || match.status === "completed") return;

    // Calculate completedHoles and check for match completion conditions
    const completedScores = scores.filter(
      (score) => score.aviatorScore !== null && score.producerScore !== null,
    );

    // If all 18 holes are filled or match is clinched
    if (
      completedScores.length === 18 ||
      match.leadAmount >
        18 - Math.max(...completedScores.map((s) => s.holeNumber), 0)
    ) {
      // Calculate totals for the summary
      let aviatorTotal = 0;
      let producerTotal = 0;
      completedScores.forEach((score) => {
        if (score.aviatorScore) aviatorTotal += score.aviatorScore;
        if (score.producerScore) producerTotal += score.producerScore;
      });

      // Calculate the match play result
      const matchPlayResult = calculateMatchPlayResult(completedScores);

      // Set match summary data
      setMatchSummary({
        aviatorTotal,
        producerTotal,
        result: matchPlayResult,
        leadingTeam: match.leadingTeam || "tied",
        matchPlayResult,
      });

      // Mark match as completed and update result in database
      updateMatchMutation.mutate({
        id: match.id,
        status: "completed",
        result: matchPlayResult,
        leadingTeam: match.leadingTeam,
        leadAmount: match.leadAmount,
      });

      // Show completion dialog
      setShowCompletionDialog(true);
    }
  }, [scores, match]);

  const handleScoreUpdate = (
    holeNumber: number,
    aviatorScore: number | null,
    producerScore: number | null,
  ) => {
    // Allow updates even if one of the scores is null
    const scoreData = {
      matchId: id,
      holeNumber,
      aviatorScore,
      producerScore,
    };

    updateScoreMutation.mutate(scoreData);
  };

  // Update match status from "upcoming" to "in_progress" when first score is entered
  useEffect(() => {
    if (!match || !scores || match.status !== "upcoming") return;

    // Check if any scores exist
    const hasScores = scores.some(
      (score) => score.aviatorScore !== null || score.producerScore !== null,
    );

    // If scores exist, update match status to in_progress
    if (hasScores) {
      updateMatchMutation.mutate({
        id: match.id,
        status: "in_progress",
      });
    }
  }, [scores, match]);

  // Handle editing match
  useEffect(() => {
    if (match) {
      setEditMatchData({
        name: match.name,
        aviatorPlayers: match.aviatorPlayers,
        producerPlayers: match.producerPlayers,
      });
    }
  }, [match]);

  const handleOpenEditDialog = () => {
    setShowEditDialog(true);
  };

  const handleEditMatchSubmit = () => {
    if (!match) return;

    updateMatchMutation.mutate(
      {
        id: match.id,
        name: editMatchData.name,
        aviatorPlayers: editMatchData.aviatorPlayers,
        producerPlayers: editMatchData.producerPlayers,
      },
      {
        onSuccess: () => {
          setShowEditDialog(false);
          toast({
            title: "Match updated",
            description: "The match details have been updated successfully.",
          });
        },
      },
    );
  };

  const handleBackToAdminMatches = () => {
    if (match && match.roundId) {
      window.location.href = `/admin/rounds/${match.roundId}/matches`;
    } else {
      window.location.href = "/admin";
    }
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
          {/* Admin Header if in Admin mode */}
          {isAdminMode && (
            <div className="mb-4 flex items-center justify-between">
              <button
                className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                onClick={handleBackToAdminMatches}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Admin Matches
              </button>

              <div className="flex items-center space-x-2">
                <button
                  className="flex items-center text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded"
                  onClick={handleOpenEditDialog}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit Match
                </button>
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-medium">
                  Admin View
                </div>
              </div>
            </div>
          )}

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
            status={match.status}
            result={match.result}
          />

          {/* Enhanced Match Scorecard */}
          <EnhancedMatchScorecard
            matchId={id}
            holes={holes || []}
            scores={scores || []}
            onScoreUpdate={handleScoreUpdate}
            matchStatus={match.status}
            matchType={round?.matchType || ""}
            aviatorPlayers={match.aviatorPlayers}
            producerPlayers={match.producerPlayers}
          />
        </>
      )}

      {/* Match Completion Dialog */}
      <AlertDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Match Complete</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p className="text-lg font-semibold">Final Score:</p>
                <div className="flex justify-between items-center">
                  <div className="bg-aviator text-white px-4 py-2 rounded">
                    <p className="font-bold">The Aviators</p>
                    <p className="text-2xl text-center">
                      {matchSummary.aviatorTotal}
                    </p>
                  </div>
                  <div className="text-xl font-bold">vs</div>
                  <div className="bg-producer text-white px-4 py-2 rounded">
                    <p className="font-bold">The Producers</p>
                    <p className="text-2xl text-center">
                      {matchSummary.producerTotal}
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">Match Play Result:</p>
                  <p className="text-xl mt-2">
                    {matchSummary.leadingTeam === "aviators"
                      ? "The Aviators"
                      : matchSummary.leadingTeam === "producers"
                        ? "The Producers"
                        : "Match"}{" "}
                    {matchSummary.matchPlayResult !== "AS" ? "won" : "tied"}{" "}
                    <span className="font-bold">
                      {matchSummary.matchPlayResult}
                    </span>
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

      {/* Edit Match Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
            <DialogDescription>
              Update the match details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="match-name">Match Name</Label>
              <Input
                id="match-name"
                value={editMatchData.name}
                onChange={(e) =>
                  setEditMatchData({ ...editMatchData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aviator-players">Aviator Players</Label>
              <Input
                id="aviator-players"
                value={editMatchData.aviatorPlayers}
                onChange={(e) =>
                  setEditMatchData({
                    ...editMatchData,
                    aviatorPlayers: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producer-players">Producer Players</Label>
              <Input
                id="producer-players"
                value={editMatchData.producerPlayers}
                onChange={(e) =>
                  setEditMatchData({
                    ...editMatchData,
                    producerPlayers: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMatchSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Match;

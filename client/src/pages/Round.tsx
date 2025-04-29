import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import RoundHeader from "@/components/RoundHeader";
import MatchesList from "@/components/MatchesList";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RoundProps {
  id: number;
}

interface RoundData {
  id: number;
  name: string;
  matchType: string;
  courseName: string;
  startTime: string;
  aviatorScore: number;
  producerScore: number;
  pendingAviatorScore?: number;
  pendingProducerScore?: number;
  date: string;
  isComplete: boolean;
}

interface Match {
  id: number;
  name: string;
  status: string;
  aviatorPlayers: string;
  producerPlayers: string;
  leadingTeam: string | null;
  leadAmount: number;
  result: string | null;
  currentHole: number;
}

const Round = ({ id }: RoundProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isCreateMatchDialogOpen, setIsCreateMatchDialogOpen] = useState(false);
  const [matchFormData, setMatchFormData] = useState({
    name: "",
    aviatorPlayers: "",
    producerPlayers: "",
  });
  
  // Fetch players for match creation
  const { data: players, isLoading: isPlayersLoading } = useQuery<any[]>({
    queryKey: ['/api/players'],
    enabled: isAdmin && isCreateMatchDialogOpen,
  });
  
  // Fetch round data
  const { data: round, isLoading: isRoundLoading } = useQuery<RoundData>({
    queryKey: [`/api/rounds/${id}`],
  });

  // Fetch matches for this round
  const { data: matches, isLoading: isMatchesLoading } = useQuery<Match[]>({
    queryKey: [`/api/matches?roundId=${id}`],
  });
  
  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      const payload = {
        ...matchData,
        roundId: id,
      };
      const res = await apiRequest("POST", `/api/matches`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches?roundId=${id}`] });
      toast({
        title: "Match created",
        description: "New match has been added successfully",
        duration: 1000,
      });
      setIsCreateMatchDialogOpen(false);
      resetMatchForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create match",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });
  
  // Handle form input changes
  const handleMatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMatchFormData({
      ...matchFormData,
      [name]: value,
    });
  };
  
  // Form submission handler
  const handleMatchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatchMutation.mutate(matchFormData);
  };
  
  // Reset form
  const resetMatchForm = () => {
    setMatchFormData({
      name: "",
      aviatorPlayers: "",
      producerPlayers: "",
    });
  };

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
          {round && (
            <>
              {/* Round Header */}
              <RoundHeader 
                id={round.id}
                name={round.name}
                matchType={round.matchType}
                courseName={round.courseName || ''}
                startTime={round.startTime || ''}
                aviatorScore={round.aviatorScore || 0}
                producerScore={round.producerScore || 0}
                pendingAviatorScore={round.pendingAviatorScore || 0}
                pendingProducerScore={round.pendingProducerScore || 0}
                date={round.date}
                matchCount={matches?.length || 0}
              />
              
              {/* Admin Controls */}
              {isAdmin && (
                <div className="mb-5 mt-4">
                  <Button 
                    onClick={() => setIsCreateMatchDialogOpen(true)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Match</span>
                  </Button>
                </div>
              )}
            
              {/* Matches List */}
              <MatchesList matches={matches || []} />
              
              {/* Create Match Dialog */}
              {isCreateMatchDialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Add New Match</h2>
                    
                    <form onSubmit={handleMatchFormSubmit}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Match Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={matchFormData.name}
                            onChange={handleMatchInputChange}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                          />
                        </div>
                        
                        {isPlayersLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Aviators Team Players
                              </label>
                              <select
                                name="aviatorPlayers"
                                value={matchFormData.aviatorPlayers}
                                onChange={handleMatchInputChange}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                              >
                                <option value="">Select player</option>
                                {players?.filter((p: any) => p.teamId === 1).map((player: any) => (
                                  <option 
                                    key={player.id} 
                                    value={player.id}
                                    disabled={matches?.some((m) => 
                                      m.aviatorPlayers.includes(player.name) || 
                                      m.producerPlayers.includes(player.name)
                                    )}
                                  >
                                    {player.name}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                Players can only participate in one match per round
                              </p>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Producers Team Players
                              </label>
                              <select
                                name="producerPlayers"
                                value={matchFormData.producerPlayers}
                                onChange={handleMatchInputChange}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                              >
                                <option value="">Select player</option>
                                {players?.filter((p: any) => p.teamId === 2).map((player: any) => (
                                  <option 
                                    key={player.id} 
                                    value={player.id}
                                    disabled={matches?.some((m) => 
                                      m.aviatorPlayers.includes(player.name) || 
                                      m.producerPlayers.includes(player.name)
                                    )}
                                  >
                                    {player.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex justify-end mt-6 space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateMatchDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createMatchMutation.isPending || isPlayersLoading}
                        >
                          {createMatchMutation.isPending ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </span>
                          ) : (
                            "Create Match"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Round;

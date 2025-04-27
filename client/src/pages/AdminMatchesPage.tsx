import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ChevronLeft, Plus, PenSquare } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

type Round = {
  id: number;
  name: string;
  matchType: string;
  courseName: string;
  date: string;
  startTime: string;
  isComplete?: boolean;
};

type Match = {
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
};

export default function AdminMatchesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [roundId, setRoundId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [matchFormData, setMatchFormData] = useState({
    name: "",
    aviatorPlayers: "",
    producerPlayers: "",
  });

  // Extract roundId from URL path
  useEffect(() => {
    const path = window.location.pathname;
    const matches = path.match(/\/admin\/rounds\/(\d+)\/matches/);
    if (matches && matches[1]) {
      setRoundId(parseInt(matches[1]));
    }
  }, []);

  const { data: round, isLoading: isRoundLoading } = useQuery<Round>({
    queryKey: [`/api/rounds/${roundId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!roundId,
  });

  const { data: matches, isLoading: isMatchesLoading } = useQuery<Match[]>({
    queryKey: [`/api/matches?roundId=${roundId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!roundId,
  });

  const addMatchMutation = useMutation({
    mutationFn: async (matchData: any) => {
      const res = await apiRequest("POST", "/api/matches", {
        ...matchData,
        roundId,
        status: "upcoming",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches?roundId=${roundId}`] });
      toast({
        title: "Match added",
        description: "New match has been added successfully",
      });
      setIsAddDialogOpen(false);
      resetMatchForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add match",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetMatchForm = () => {
    setMatchFormData({
      name: "",
      aviatorPlayers: "",
      producerPlayers: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMatchFormData({
      ...matchFormData,
      [name]: value,
    });
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    addMatchMutation.mutate(matchFormData);
  };

  const handleEditMatch = (matchId: number) => {
    window.location.href = `/admin/matches/${matchId}/edit`;
  };
  
  const handleViewScorecard = (matchId: number) => {
    window.location.href = `/matches/${matchId}?admin=true`;
  };

  if (!isAdmin) {
    return <div>Access denied. You must be an admin to view this page.</div>;
  }

  if (isRoundLoading || isMatchesLoading || !roundId) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={() => window.location.href = "/admin"}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Admin
            </Button>
            <h1 className="text-2xl font-bold">Manage Matches</h1>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Match
          </Button>
        </div>
        
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <h2 className="text-xl font-semibold">{round?.name}</h2>
                <p className="text-muted-foreground">{round?.matchType} - {round?.date}</p>
                <p className="text-muted-foreground">{round?.courseName} - {round?.startTime}</p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className="text-sm font-medium">Status: </span>
                <span className={`text-sm ${round?.isComplete ? "text-green-600" : "text-amber-600"}`}>
                  {round?.isComplete ? "Completed" : "In Progress"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <h2 className="text-xl font-semibold mt-4">Match List</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches && matches.length > 0 ? (
            matches.map((match) => (
              <Card key={match.id} className={match.status === 'deleted' ? 'opacity-50' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{match.name}</CardTitle>
                  <CardDescription>
                    Status: {match.status === 'completed' ? 
                      <span className="text-green-600">Completed</span> : 
                      match.status === 'in_progress' ? 
                      <span className="text-amber-600">In Progress</span> : 
                      match.status === 'deleted' ? 
                      <span className="text-red-600">Deleted</span> :
                      <span className="text-blue-600">Upcoming</span>
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-600">The Aviators</p>
                      <p className="text-sm text-muted-foreground">{match.aviatorPlayers}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600">The Producers</p>
                      <p className="text-sm text-muted-foreground">{match.producerPlayers}</p>
                    </div>
                  </div>
                  {match.status !== 'upcoming' && (
                    <div className="flex justify-between mt-2">
                      <div>
                        <span className="text-sm">
                          {match.leadingTeam ? 
                            `${match.leadingTeam === 'aviator' ? 'Aviators' : 'Producers'} lead by ${match.leadAmount}` : 
                            'Match is tied'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-sm">
                          {match.status === 'completed' ? 
                            (match.result ? `Result: ${match.result}` : 'Completed') : 
                            `Hole: ${match.currentHole}/18`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center"
                    onClick={() => handleEditMatch(match.id)}
                    disabled={match.status === 'deleted'}
                  >
                    <PenSquare className="h-4 w-4 mr-2" />
                    Edit Match
                  </Button>
                  
                  <Button 
                    variant="default" 
                    className="w-full flex items-center"
                    onClick={() => handleViewScorecard(match.id)}
                    disabled={match.status === 'deleted'}
                  >
                    <PenSquare className="h-4 w-4 mr-2" />
                    View Scorecard
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <p className="text-muted-foreground mb-4">No matches found for this round.</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Add First Match
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Add Match Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New Match</h2>
            <form onSubmit={handleAddMatch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Match Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={matchFormData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Match 1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Aviator Players
                  </label>
                  <textarea
                    name="aviatorPlayers"
                    value={matchFormData.aviatorPlayers}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., J. Smith, T. Wilson"
                    rows={2}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated list of player names</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Producer Players
                  </label>
                  <textarea
                    name="producerPlayers"
                    value={matchFormData.producerPlayers}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., M. Johnson, R. Davis"
                    rows={2}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated list of player names</p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addMatchMutation.isPending}
                >
                  {addMatchMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    "Add Match"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
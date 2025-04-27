import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ChevronLeft, Save } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

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

type Round = {
  id: number;
  name: string;
  matchType: string;
};

export default function AdminMatchEditPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [matchId, setMatchId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    aviatorPlayers: string;
    producerPlayers: string;
    status: string;
  }>({
    name: "",
    aviatorPlayers: "",
    producerPlayers: "",
    status: "in_progress"
  });

  // Extract matchId from URL path
  useEffect(() => {
    const path = window.location.pathname;
    const matches = path.match(/\/admin\/matches\/(\d+)\/edit/);
    if (matches && matches[1]) {
      setMatchId(parseInt(matches[1]));
    }
  }, []);

  const { data: match, isLoading: isMatchLoading } = useQuery<Match>({
    queryKey: [`/api/matches/${matchId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!matchId,
  });

  const { data: round, isLoading: isRoundLoading } = useQuery<Round>({
    queryKey: match ? [`/api/rounds/${match.roundId}`] : [],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!match,
  });

  // Update form when match data is loaded
  useEffect(() => {
    if (match) {
      setFormData({
        name: match.name,
        aviatorPlayers: match.aviatorPlayers,
        producerPlayers: match.producerPlayers,
        status: match.status
      });
    }
  }, [match]);

  const updateMatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/matches/${matchId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}`] });
      queryClient.invalidateQueries({ queryKey: match ? [`/api/matches?roundId=${match.roundId}`] : [] });
      toast({
        title: "Match updated",
        description: "Match details have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update match",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMatchMutation.mutate(formData);
  };

  const handleBackToMatches = () => {
    if (match) {
      window.location.href = `/admin/rounds/${match.roundId}/matches`;
    } else {
      window.location.href = '/admin';
    }
  };

  const handleViewScorecard = () => {
    if (matchId) {
      window.location.href = `/matches/${matchId}`;
    }
  };

  if (!isAdmin) {
    return <div>Access denied. You must be an admin to view this page.</div>;
  }

  if (isMatchLoading || isRoundLoading || !matchId) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={handleBackToMatches}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Matches
            </Button>
            <h1 className="text-2xl font-bold">Edit Match</h1>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleViewScorecard}
          >
            View Scorecard
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{match?.name}</h2>
              <p className="text-muted-foreground">{round?.name} - {round?.matchType}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Match Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Aviator Players
                </label>
                <textarea
                  name="aviatorPlayers"
                  value={formData.aviatorPlayers}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
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
                  value={formData.producerPlayers}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated list of player names</p>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit"
                  className="w-full flex items-center justify-center"
                  disabled={updateMatchMutation.isPending}
                >
                  {updateMatchMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Settings, UserPlus, Calendar, Users, Trophy } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

// Define types for our data
type Tournament = {
  id: number;
  name: string;
  year: number;
  aviatorScore: number | null;
  producerScore: number | null;
};

type Round = {
  id: number;
  name: string;
  matchType: string;
  courseName: string;
  startTime: string;
  date: string;
  isComplete: boolean | null;
  aviatorScore?: number | null;
  producerScore?: number | null;
};

type Team = {
  id: number;
  name: string;
  colorCode: string;
};

type Player = {
  id: number;
  name: string;
  teamId: number;
  wins: number | null;
  losses: number | null;
  ties: number | null;
};

type User = {
  id: number;
  username: string;
  isAdmin: boolean;
};

// Tournament Management Tab
function TournamentTab() {
  const { toast } = useToast();
  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournament'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const updateTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      const res = await apiRequest("POST", "/api/admin/tournament", tournamentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Tournament updated",
        description: "Tournament settings have been saved successfully",
        duration: 1000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tournament Details</CardTitle>
          <CardDescription>
            Configure the main tournament settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Current Tournament: <span className="font-medium">{tournament?.name}</span>
          </p>
          <div className="flex space-x-4">
            <div className="bg-primary/10 rounded-lg p-4 flex-1">
              <h3 className="font-semibold">The Aviators</h3>
              <div className="text-3xl font-bold">{tournament?.aviatorScore}</div>
              <p className="text-sm text-muted-foreground">Points</p>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 flex-1">
              <h3 className="font-semibold">The Producers</h3>
              <div className="text-3xl font-bold">{tournament?.producerScore}</div>
              <p className="text-sm text-muted-foreground">Points</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <Settings className="mr-2 h-4 w-4" />
            Edit Tournament Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Rounds Management Tab
function RoundsTab() {
  const { toast } = useToast();
  const { data: rounds, isLoading } = useQuery<Round[]>({
    queryKey: ['/api/rounds'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tournament Rounds</h2>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Add New Round
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rounds?.map((round: any) => (
          <Card key={round.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{round.name}</CardTitle>
              <CardDescription>{round.matchType} - {round.date}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm">{round.courseName} - {round.startTime}</p>
              <div className="flex justify-between mt-2">
                <div>
                  <span className="text-sm font-medium">Status:</span>{" "}
                  <span className={`text-sm ${round.isComplete ? "text-green-600" : "text-amber-600"}`}>
                    {round.isComplete ? "Completed" : "In Progress"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-blue-600">{round.aviatorScore || 0}</span>
                  {" - "}
                  <span className="text-red-600">{round.producerScore || 0}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Manage Matches
              </Button>
            </CardFooter>
          </Card>
        ))}

        {/* Empty state */}
        {(!rounds || rounds.length === 0) && (
          <Card className="col-span-full bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No rounds have been created yet.</p>
              <Button className="mt-4">
                Add First Round
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Players Management Tab
function PlayersTab() {
  const { toast } = useToast();
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoadingTeams || isLoadingPlayers) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Group players by team
  const playersByTeam: Record<number, any[]> = {};
  if (players) {
    players.forEach((player: any) => {
      if (!playersByTeam[player.teamId]) {
        playersByTeam[player.teamId] = [];
      }
      playersByTeam[player.teamId].push(player);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Team Players</h2>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </div>

      {teams?.map((team: any) => (
        <Card key={team.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <div 
                className="w-4 h-4 mr-2 rounded-full" 
                style={{ backgroundColor: team.colorCode }}
              />
              {team.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {playersByTeam[team.id]?.map((player: any) => (
                <div 
                  key={player.id} 
                  className="border rounded-md p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.wins}W - {player.losses}L - {player.ties}T
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              ))}
            </div>

            {/* Empty state for team */}
            {(!playersByTeam[team.id] || playersByTeam[team.id].length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                No players in this team
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Users Management Tab (admin only)
function UsersTab() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Users</h2>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Role</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user: any) => (
                <tr key={user.id} className="border-b">
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.isAdmin ? "bg-primary/20" : "bg-muted"}`}>
                      {user.isAdmin ? "Administrator" : "Standard User"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!users || users.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main Admin Page Component
export default function AdminPage() {
  const { user, isAdmin, logoutMutation } = useAuth();

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage the Rowdy Cup tournament settings and data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4">
            <div className="font-medium">{user?.username}</div>
            <div className="text-xs text-muted-foreground">
              {isAdmin ? "Administrator" : "Standard User"}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Logout"
            )}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="tournament" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="tournament" className="flex items-center">
            <Trophy className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Tournament</span>
          </TabsTrigger>
          <TabsTrigger value="rounds" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Rounds</span>
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden md:inline">Players</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tournament" className="space-y-4">
          <TournamentTab />
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          <RoundsTab />
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <PlayersTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <UsersTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
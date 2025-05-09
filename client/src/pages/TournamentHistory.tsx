import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

interface TournamentHistory {
  id: number;
  tournamentId: number;
  tournamentName: string;
  year: number;
  winningTeam: string | null;
  aviatorScore: number;
  producerScore: number;
}

interface PlayerTournamentStats {
  id: number;
  playerId: number;
  playerName: string; // Added in frontend
  teamId: number;
  teamName: string; // Added in frontend
  tournamentId: number;
  tournamentYear: number; // Added in frontend
  wins: number;
  losses: number;
  ties: number;
  points: number;
  matchesPlayed: number;
}

interface PlayerCareerStats {
  id: number;
  playerId: number;
  playerName: string; // Added in frontend
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  totalPoints: number;
  matchesPlayed: number;
  tournamentsPlayed: number;
}

const TournamentHistory = () => {
  // Fetch tournament history
  const { data: tournamentHistory, isLoading: isHistoryLoading } = useQuery<TournamentHistory[]>({
    queryKey: ["/api/tournament-history"],
  });

  // Fetch all player stats for the most recent tournament
  const { data: playerStats, isLoading: isStatsLoading } = useQuery<PlayerTournamentStats[]>({
    queryKey: ["/api/tournament-player-stats/1"], // Assuming 1 is the current tournament ID
    enabled: !!tournamentHistory && tournamentHistory.length > 0,
  });

  // Get players with their career stats
  const { data: players = [] } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  // Merge player data with their stats for display
  const playersWithStats = React.useMemo(() => {
    if (!playerStats) return [];
    
    return playerStats.map(stats => {
      const player = players.find((p) => p.id === stats.playerId);
      return {
        ...stats,
        playerName: player ? player.name : `Player ${stats.playerId}`,
        teamName: stats.teamId === 1 ? "Aviators" : "Producers"
      };
    });
  }, [players, playerStats]);

  // Sort player stats by points (highest first)
  const sortedPlayerStats = React.useMemo(() => {
    if (!playersWithStats) return [];
    return [...playersWithStats].sort((a, b) => b.points - a.points);
  }, [playersWithStats]);

  // Function to render tournament result with a trophy icon for the winner
  const renderTournamentResult = (history: TournamentHistory) => {
    const aviatorWon = history.aviatorScore > history.producerScore;
    const producerWon = history.producerScore > history.aviatorScore;
    const isTie = history.aviatorScore === history.producerScore;
    
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className={`font-semibold ${aviatorWon ? "text-blue-600" : ""}`}>
            Aviators: {history.aviatorScore}
          </span>
          {aviatorWon && <Trophy className="h-4 w-4 ml-1 text-yellow-500" />}
        </div>
        <span>vs</span>
        <div className="flex items-center">
          <span className={`font-semibold ${producerWon ? "text-red-600" : ""}`}>
            Producers: {history.producerScore}
          </span>
          {producerWon && <Trophy className="h-4 w-4 ml-1 text-yellow-500" />}
        </div>
        {isTie && <span className="text-gray-500">(Tie)</span>}
      </div>
    );
  };

  // Calculate win percentage for each player
  const calculateWinPercentage = (wins: number, losses: number, ties: number) => {
    const totalMatches = wins + losses + ties;
    if (totalMatches === 0) return 0;
    return Math.round((wins + ties * 0.5) / totalMatches * 100);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Tournament History</h1>
      
      <Tabs defaultValue="history">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="history" className="flex-1">Tournament Results</TabsTrigger>
          <TabsTrigger value="player-stats" className="flex-1">Player Statistics</TabsTrigger>
        </TabsList>
        
        {/* Tournament History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Past Tournaments</CardTitle>
              <CardDescription>
                History of all past Rowdy Cup tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tournamentHistory && tournamentHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Tournament</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournamentHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>{history.year}</TableCell>
                        <TableCell>{history.tournamentName}</TableCell>
                        <TableCell>{renderTournamentResult(history)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No tournament history found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Player Stats Tab */}
        <TabsContent value="player-stats">
          <Card>
            <CardHeader>
              <CardTitle>Player Statistics</CardTitle>
              <CardDescription>
                Individual player performance in Rowdy Cup tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStatsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sortedPlayerStats && sortedPlayerStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">L</TableHead>
                      <TableHead className="text-center">T</TableHead>
                      <TableHead className="text-center">Win %</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPlayerStats.map((stats) => (
                      <TableRow key={stats.id}>
                        <TableCell>{stats.playerName}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={stats.teamId === 1 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-700 border-red-200"}
                          >
                            {stats.teamName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{stats.wins}</TableCell>
                        <TableCell className="text-center">{stats.losses}</TableCell>
                        <TableCell className="text-center">{stats.ties}</TableCell>
                        <TableCell className="text-center">
                          {calculateWinPercentage(stats.wins, stats.losses, stats.ties)}%
                        </TableCell>
                        <TableCell className="text-center font-medium">{stats.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No player statistics available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentHistory;
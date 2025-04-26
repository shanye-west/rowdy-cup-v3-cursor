import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface Player {
  id: number;
  name: string;
  teamId: number;
  wins: number;
  losses: number;
  ties: number;
}

interface Team {
  id: number;
  name: string;
  shortName: string;
  colorCode: string;
}

const Teams = () => {
  const [_, navigate] = useLocation();

  // Fetch teams data
  const { data: teams, isLoading: isTeamsLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Fetch players data
  const { data: players, isLoading: isPlayersLoading } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  const isLoading = isTeamsLoading || isPlayersLoading;

  const handleBackClick = () => {
    navigate('/');
  };

  // Group players by team
  const playersByTeam = players?.reduce((acc: Record<number, Player[]>, player: Player) => {
    if (!acc[player.teamId]) {
      acc[player.teamId] = [];
    }
    acc[player.teamId].push(player);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-6">
      <button 
        className="mb-4 flex items-center font-semibold text-blue-600"
        onClick={handleBackClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tournament
      </button>

      <h1 className="font-heading text-2xl font-bold mb-6">Team Rosters</h1>

      {isLoading ? (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-36 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
          
          <div>
            <Skeleton className="h-10 w-36 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {teams?.map((team: Team) => (
            <div key={team.id}>
              <h2 
                className="font-heading text-xl font-bold mb-3 pb-2 border-b-2" 
                style={{ borderColor: team.colorCode }}
              >
                {team.name}
              </h2>
              
              <div className="divide-y">
                {playersByTeam?.[team.id]?.map((player: Player) => (
                  <div key={player.id} className="py-3 flex justify-between items-center">
                    <span className="font-medium">{player.name}</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-md text-gray-800 font-mono">
                      {player.wins}-{player.losses}-{player.ties}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;
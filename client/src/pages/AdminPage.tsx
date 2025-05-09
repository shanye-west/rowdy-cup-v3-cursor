import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Settings, UserPlus, Calendar, Users, Trophy, Trash } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    aviatorScore: 0,
    producerScore: 0
  });
  
  const { data: tournament, isLoading } = useQuery<Tournament>({
    queryKey: ['/api/tournament'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Update form data when tournament data is loaded
  useEffect(() => {
    if (tournament) {
      setFormData({
        name: tournament.name,
        year: tournament.year,
        aviatorScore: tournament.aviatorScore || 0,
        producerScore: tournament.producerScore || 0
      });
    }
  }, [tournament]);

  const updateTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      // We don't include scores in the update since they're calculated on the server
      const { aviatorScore, producerScore, ...safeData } = tournamentData;
      
      const res = await apiRequest("PUT", `/api/tournament/${tournament?.id}`, safeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Tournament updated",
        description: "Tournament settings have been saved successfully",
        duration: 1000,
      });
      setIsEditDialogOpen(false);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTournamentMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'year' ? parseInt(value) : value,
    });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>, team: 'aviatorScore' | 'producerScore') => {
    const value = parseInt(e.target.value) || 0;
    setFormData({
      ...formData,
      [team]: value
    });
  };

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
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Edit Tournament Settings
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Tournament Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Tournament</h2>
            
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tournament Name
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
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    min="2000"
                    max="2099"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Aviator Score (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    value={formData.aviatorScore}
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Score is automatically calculated from match results</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Producer Score (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    value={formData.producerScore}
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Score is automatically calculated from match results</p>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateTournamentMutation.isPending}
                >
                  {updateTournamentMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
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

// Rounds Management Tab
function RoundsTab() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [roundFormData, setRoundFormData] = useState({
    name: "",
    matchType: "Singles Match",
    courseId: 0,
    courseName: "", // keeping for backward compatibility
    date: new Date().toISOString().split('T')[0],
    startTime: "08:00",
    isComplete: false,
    tournamentId: 1 // Default tournament ID
  });
  
  // Define Round interface with courseId
  interface Round {
    id: number;
    name: string;
    matchType: string;
    courseId?: number;
    courseName: string;
    date: string;
    startTime: string;
    aviatorScore?: number;
    producerScore?: number;
    isComplete?: boolean;
  }
  
  const { data: rounds, isLoading } = useQuery<Round[]>({
    queryKey: ['/api/rounds'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Define Course type interface
  interface Course {
    id: number;
    name: string;
    location: string;
    description: string;
  }
  
  // Using a simplified fetch for courses to ensure it works
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log("Fetching courses directly...");
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          console.log("Got courses data:", data);
          setCourses(data);
        } else {
          console.error("Error fetching courses:", response.status);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const addRoundMutation = useMutation({
    mutationFn: async (roundData: any) => {
      const res = await apiRequest("POST", "/api/rounds", roundData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      toast({
        title: "Round added",
        description: "New round has been added successfully",
        duration: 1000,
      });
      setIsAddDialogOpen(false);
      resetRoundForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add round",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const updateRoundMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/rounds/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      toast({
        title: "Round updated",
        description: "Round has been updated successfully",
        duration: 1000,
      });
      setIsEditDialogOpen(false);
      setCurrentRound(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update round",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });
  
  const deleteRoundMutation = useMutation({
    mutationFn: async (roundId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/rounds/${roundId}`, {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Round deleted",
        description: "Round and all associated matches have been deleted",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
      setRoundToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete round",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
  });

  const handleOpenAddDialog = () => {
    resetRoundForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (round: Round) => {
    setCurrentRound(round);
    setRoundFormData({
      name: round.name,
      matchType: round.matchType,
      courseId: round.courseId || 1,
      courseName: round.courseName,
      date: round.date,
      startTime: round.startTime,
      isComplete: round.isComplete || false,
      tournamentId: 1 // Use the current tournament ID
    });
    setIsEditDialogOpen(true);
  };

  const resetRoundForm = () => {
    // Default to the first course if courses are loaded
    console.log("Available courses:", courses);
    const defaultCourseId = courses && courses.length > 0 ? courses[0].id : 1;
    const defaultCourseName = courses && courses.length > 0 ? courses[0].name : "";
    
    setRoundFormData({
      name: "",
      matchType: "Singles Match",
      courseId: defaultCourseId,
      courseName: defaultCourseName,
      date: new Date().toISOString().split('T')[0],
      startTime: "08:00",
      isComplete: false,
      tournamentId: 1 // Default tournament ID
    });

    console.log("Round form data after reset:", {
      courseId: defaultCourseId,
      courseName: defaultCourseName
    });
  };

  const handleRoundInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setRoundFormData({
      ...roundFormData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleRoundFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // More robust validation and casting to ensure courseId is a number
    if (!roundFormData.courseId || isNaN(Number(roundFormData.courseId))) {
      toast({
        title: "Error",
        description: "Please select a valid course",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure courseId is properly cast to a number
    const formData = {
      ...roundFormData,
      courseId: Number(roundFormData.courseId)
    };
    
    console.log('Submitting round with data:', formData);
    
    if (isEditDialogOpen && currentRound) {
      updateRoundMutation.mutate({ id: currentRound.id, data: formData });
    } else {
      addRoundMutation.mutate(formData);
    }
  };

  const handleManageMatches = (roundId: number) => {
    // Navigate to the admin matches page for this round
    window.location.href = `/admin/rounds/${roundId}/matches`;
  };
  
  const handleDeleteRound = (roundId: number) => {
    setRoundToDelete(roundId);
    setConfirmationDialogOpen(true);
  };
  
  const confirmDeleteRound = () => {
    if (roundToDelete !== null) {
      deleteRoundMutation.mutate(roundToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Round form JSX for both add and edit dialogs
  const roundFormJSX = (
    <form onSubmit={handleRoundFormSubmit}>
      <div className="space-y-4">
        {/* Debug info for courses */}
        <div className="text-xs bg-gray-100 p-2 rounded">
          <p>Courses loading: {isLoadingCourses ? 'Yes' : 'No'}</p>
          <p>Courses count: {courses?.length || 0}</p>
          <p>Courses data: {JSON.stringify(courses)}</p>
        </div>
      
        <div>
          <label className="block text-sm font-medium mb-1">
            Round Name
          </label>
          <input
            type="text"
            name="name"
            value={roundFormData.name}
            onChange={handleRoundInputChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Match Type
          </label>
          <select
            name="matchType"
            value={roundFormData.matchType}
            onChange={handleRoundInputChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="Singles Match">Singles Match</option>
            <option value="2-man Team Scramble">2-man Team Scramble</option>
            <option value="4-man Team Scramble">4-man Team Scramble</option>
            <option value="2-man Team Shamble">2-man Team Shamble</option>
            <option value="2-man Team Best Ball">2-man Team Best Ball</option>
            <option value="Alternate Shot">Alternate Shot</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Course
          </label>
          
          {isLoadingCourses ? (
            <div className="p-2 border rounded">Loading courses...</div>
          ) : courses && courses.length > 0 ? (
            <select
              name="courseId"
              value={roundFormData.courseId || ""}
              onChange={(e) => {
                // Update both courseId and courseName
                const courseId = parseInt(e.target.value);
                const selectedCourse = courses.find(course => course.id === courseId);
                setRoundFormData({
                  ...roundFormData,
                  courseId: courseId,
                  courseName: selectedCourse ? selectedCourse.name : "",
                  tournamentId: 1 // Keep the tournament ID
                });
              }}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.location})
                </option>
              ))}
            </select>
          ) : (
            <div className="p-2 border rounded text-red-500">
              No courses available. Please add courses first.
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={roundFormData.date}
              onChange={handleRoundInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={roundFormData.startTime}
              onChange={handleRoundInputChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        </div>
        
        {isEditDialogOpen && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isComplete"
              name="isComplete"
              checked={roundFormData.isComplete}
              onChange={handleRoundInputChange}
              className="mr-2"
            />
            <label htmlFor="isComplete" className="text-sm">
              Mark as Complete
            </label>
          </div>
        )}
      </div>
      
      <div className="flex justify-end mt-6 space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => isEditDialogOpen ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={addRoundMutation.isPending || updateRoundMutation.isPending}
        >
          {(addRoundMutation.isPending || updateRoundMutation.isPending) ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            isEditDialogOpen ? "Update Round" : "Add Round"
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tournament Rounds</h2>
        <Button onClick={handleOpenAddDialog}>
          <Calendar className="mr-2 h-4 w-4" />
          Add New Round
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rounds?.map((round: Round) => (
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
            <CardFooter className="pt-2 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleOpenEditDialog(round)}
              >
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleManageMatches(round.id)}
              >
                Matches
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-none"
                onClick={() => handleDeleteRound(round.id)}
              >
                <Trash className="h-4 w-4 text-red-500" />
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
              <Button 
                className="mt-4"
                onClick={handleOpenAddDialog}
              >
                Add First Round
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Add Round Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Round</h2>
            {roundFormJSX}
          </div>
        </div>
      )}
      
      {/* Edit Round Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Round</h2>
            {roundFormJSX}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {confirmationDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Confirm Deletion</h2>
            <p className="mb-4 text-destructive">
              Are you sure you want to delete this round? This will also delete all matches, scores, and player assignments associated with this round. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmationDialogOpen(false);
                  setRoundToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteRound}
                disabled={deleteRoundMutation.isPending}
              >
                {deleteRoundMutation.isPending ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete Round"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Players Management Tab
function PlayersTab() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerFormData, setPlayerFormData] = useState({
    name: "",
    teamId: 0,
    wins: 0,
    losses: 0,
    ties: 0
  });
  
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      const res = await apiRequest("POST", "/api/players", playerData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player added",
        description: "New player has been added successfully",
        duration: 1000,
      });
      setIsAddDialogOpen(false);
      resetPlayerForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add player",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/players/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player updated",
        description: "Player has been updated successfully",
        duration: 1000,
      });
      setIsEditDialogOpen(false);
      setCurrentPlayer(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update player",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });
  
  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await apiRequest("DELETE", `/api/players/${playerId}`, {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player deleted",
        description: "Player has been removed successfully",
        duration: 1000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete player",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const handleOpenAddDialog = () => {
    resetPlayerForm();
    if (teams && teams.length > 0) {
      setPlayerFormData(prev => ({ ...prev, teamId: teams[0].id }));
    }
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (player: Player) => {
    setCurrentPlayer(player);
    setPlayerFormData({
      name: player.name,
      teamId: player.teamId,
      wins: player.wins || 0,
      losses: player.losses || 0,
      ties: player.ties || 0
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeletePlayer = (playerId: number) => {
    if (window.confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      deletePlayerMutation.mutate(playerId);
    }
  };
  
  const handleAddPlayerForTeam = (teamId: number) => {
    resetPlayerForm();
    setPlayerFormData(prev => ({ ...prev, teamId }));
    setIsAddDialogOpen(true);
  };

  const resetPlayerForm = () => {
    setPlayerFormData({
      name: "",
      teamId: teams && teams.length > 0 ? teams[0].id : 0,
      wins: 0,
      losses: 0,
      ties: 0
    });
  };

  const handlePlayerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlayerFormData({
      ...playerFormData,
      [name]: name === 'teamId' ? parseInt(value) : name === 'name' ? value : parseInt(value) || 0
    });
  };

  const handlePlayerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditDialogOpen && currentPlayer) {
      updatePlayerMutation.mutate({ id: currentPlayer.id, data: playerFormData });
    } else {
      addPlayerMutation.mutate(playerFormData);
    }
  };

  if (isLoadingTeams || isLoadingPlayers) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Group players by team
  const playersByTeam: Record<number, Player[]> = {};
  if (players) {
    players.forEach((player: Player) => {
      if (!playersByTeam[player.teamId]) {
        playersByTeam[player.teamId] = [];
      }
      playersByTeam[player.teamId].push(player);
    });
  }

  // Player form JSX for both add and edit dialogs
  const playerFormJSX = (
    <form onSubmit={handlePlayerFormSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Player Name
          </label>
          <input
            type="text"
            name="name"
            value={playerFormData.name}
            onChange={handlePlayerInputChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Team
          </label>
          <select
            name="teamId"
            value={playerFormData.teamId}
            onChange={handlePlayerInputChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            {teams?.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Wins
            </label>
            <input
              type="number"
              name="wins"
              value={playerFormData.wins}
              onChange={handlePlayerInputChange}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Losses
            </label>
            <input
              type="number"
              name="losses"
              value={playerFormData.losses}
              onChange={handlePlayerInputChange}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Ties
            </label>
            <input
              type="number"
              name="ties"
              value={playerFormData.ties}
              onChange={handlePlayerInputChange}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6 space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => isEditDialogOpen ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false)}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={addPlayerMutation.isPending || updatePlayerMutation.isPending}
        >
          {(addPlayerMutation.isPending || updatePlayerMutation.isPending) ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            isEditDialogOpen ? "Update Player" : "Add Player"
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Team Players</h2>
          <Button onClick={handleOpenAddDialog}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <p className="text-sm mb-3">
            A new dedicated player management page is now available with improved functionality for adding and deleting players.
          </p>
          <Button 
            onClick={() => navigate('/admin/players')} 
            variant="outline"
          >
            <Users className="mr-2 h-4 w-4" />
            Go to Player Management
          </Button>
        </div>
      </div>

      {teams?.map((team: Team) => (
        <Card key={team.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 mr-2 rounded-full" 
                  style={{ backgroundColor: team.colorCode }}
                />
                {team.name}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleAddPlayerForTeam(team.id)}
                className="ml-2"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Player
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {playersByTeam[team.id]?.map((player: Player) => (
                <div 
                  key={player.id} 
                  className="border rounded-md p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.wins || 0}W - {player.losses || 0}L - {player.ties || 0}T
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOpenEditDialog(player)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeletePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
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
      
      {/* Add Player Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Player</h2>
            {playerFormJSX}
          </div>
        </div>
      )}
      
      {/* Edit Player Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Player</h2>
            {playerFormJSX}
          </div>
        </div>
      )}
    </div>
  );
}

// Users Management Tab (admin only)
function UsersTab() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: "",
    password: "",
    isAdmin: false
  });
  
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User added",
        description: "New user has been created successfully",
        duration: 1000,
      });
      setIsAddDialogOpen(false);
      resetUserForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add user",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User updated",
        description: "User has been updated successfully",
        duration: 1000,
      });
      setIsEditDialogOpen(false);
      setCurrentUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const handleOpenAddDialog = () => {
    resetUserForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setCurrentUser(user);
    setUserFormData({
      username: user.username,
      password: "", // Password field is empty for security
      isAdmin: user.isAdmin
    });
    setIsEditDialogOpen(true);
  };

  const resetUserForm = () => {
    setUserFormData({
      username: "",
      password: "",
      isAdmin: false
    });
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setUserFormData({
      ...userFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditDialogOpen && currentUser) {
      // Only send password if it's not empty (user changed it)
      const dataToSend = userFormData.password 
        ? userFormData 
        : { username: userFormData.username, isAdmin: userFormData.isAdmin };
      updateUserMutation.mutate({ id: currentUser.id, data: dataToSend });
    } else {
      addUserMutation.mutate(userFormData);
    }
  };

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
        <Button onClick={handleOpenAddDialog}>
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
              {users?.map((user: User) => (
                <tr key={user.id} className="border-b">
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.isAdmin ? "bg-primary/20" : "bg-muted"}`}>
                      {user.isAdmin ? "Administrator" : "Standard User"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenEditDialog(user)}
                    >
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
      
      {/* Add User Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleUserFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={userFormData.username}
                    onChange={handleUserInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleUserInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    name="isAdmin"
                    checked={userFormData.isAdmin}
                    onChange={handleUserInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="isAdmin" className="text-sm">
                    Administrator Access
                  </label>
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
                  disabled={addUserMutation.isPending}
                >
                  {addUserMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit User Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleUserFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={userFormData.username}
                    onChange={handleUserInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password <span className="text-xs text-muted-foreground">(Leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={userFormData.password}
                    onChange={handleUserInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAdminEdit"
                    name="isAdmin"
                    checked={userFormData.isAdmin}
                    onChange={handleUserInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="isAdminEdit" className="text-sm">
                    Administrator Access
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update User"
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

// Reset & Delete Tab
function ResetDeleteTab() {
  const { toast } = useToast();
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<{
    type: 'delete' | 'reset';
    entity: 'rounds' | 'matches' | 'players' | 'scores';
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  
  const deleteAllRoundsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/rounds/all", {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Success",
        description: "All rounds have been deleted",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
    },
  });
  
  const deleteAllMatchesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/matches/all", {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Success",
        description: "All matches have been deleted",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
    },
  });
  
  const deleteAllPlayersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/players/all", {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Success",
        description: "All players have been deleted",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
    },
  });
  
  const deleteAllScoresMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/scores/all", {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Success",
        description: "All scores have been deleted",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
    },
  });
  
  const resetAllRoundsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/rounds/reset-all", {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Success",
        description: "All rounds have been reset",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
    },
  });
  
  const resetAllMatchesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/matches/reset-all", {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rounds'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tournament'] });
      toast({
        title: "Success",
        description: "All matches have been reset",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
    },
  });
  
  const resetAllPlayersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/admin/players/reset-all", {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Success",
        description: "All players have been reset",
        duration: 2000,
      });
      setConfirmationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
        duration: 2000,
      });
    },
  });
  
  const handleDeleteConfirmation = async (entity: 'rounds' | 'matches' | 'players' | 'scores') => {
    let action: () => Promise<void>;
    let title = "";
    let message = "";
    
    switch (entity) {
      case 'rounds':
        action = async () => { await deleteAllRoundsMutation.mutateAsync(); };
        title = "Delete All Rounds";
        message = "Are you sure you want to delete all rounds? This will also delete all associated matches and scores. This action cannot be undone.";
        break;
      case 'matches':
        action = async () => { await deleteAllMatchesMutation.mutateAsync(); };
        title = "Delete All Matches";
        message = "Are you sure you want to delete all matches? This will also delete all associated scores. This action cannot be undone.";
        break;
      case 'players':
        action = async () => { await deleteAllPlayersMutation.mutateAsync(); };
        title = "Delete All Players";
        message = "Are you sure you want to delete all players? This action cannot be undone.";
        break;
      case 'scores':
        action = async () => { await deleteAllScoresMutation.mutateAsync(); };
        title = "Delete All Scores";
        message = "Are you sure you want to delete all scores? This will reset all match statistics. This action cannot be undone.";
        break;
      default:
        return;
    }
    
    setConfirmationAction({
      type: 'delete',
      entity,
      title,
      message,
      action
    });
    setConfirmationDialogOpen(true);
  };
  
  const handleResetConfirmation = async (entity: 'rounds' | 'matches' | 'players') => {
    let action: () => Promise<void>;
    let title = "";
    let message = "";
    
    switch (entity) {
      case 'rounds':
        action = async () => { await resetAllRoundsMutation.mutateAsync(); };
        title = "Reset All Rounds";
        message = "Are you sure you want to reset all rounds? This will set all rounds to their default state. This action cannot be undone.";
        break;
      case 'matches':
        action = async () => { await resetAllMatchesMutation.mutateAsync(); };
        title = "Reset All Matches";
        message = "Are you sure you want to reset all matches? This will set all matches to their default state and remove all scores. This action cannot be undone.";
        break;
      case 'players':
        action = async () => { await resetAllPlayersMutation.mutateAsync(); };
        title = "Reset All Players";
        message = "Are you sure you want to reset all player statistics? This will set all player wins, losses, and ties to zero. This action cannot be undone.";
        break;
      default:
        return;
    }
    
    setConfirmationAction({
      type: 'reset',
      entity,
      title,
      message,
      action
    });
    setConfirmationDialogOpen(true);
  };
  
  const isPending = 
    deleteAllRoundsMutation.isPending || 
    deleteAllMatchesMutation.isPending || 
    deleteAllPlayersMutation.isPending || 
    deleteAllScoresMutation.isPending ||
    resetAllRoundsMutation.isPending ||
    resetAllMatchesMutation.isPending ||
    resetAllPlayersMutation.isPending;
  
  return (
    <div className="space-y-8">
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Danger Zone</h3>
        <p className="text-sm text-red-700 mb-2">
          The actions below will permanently delete or reset data in the tournament. These actions cannot be undone.
        </p>
        <p className="text-sm text-red-700">
          Make sure you understand the consequences before proceeding.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        {/* Delete Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tournament Data Management</CardTitle>
            <CardDescription>
              Delete data from the tournament - these actions cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => handleDeleteConfirmation('rounds')}
              disabled={isPending}
            >
              Delete All Rounds
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => handleDeleteConfirmation('matches')}
              disabled={isPending}
            >
              Delete All Matches
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => handleDeleteConfirmation('scores')}
              disabled={isPending}
            >
              Delete All Scores
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => handleDeleteConfirmation('players')}
              disabled={isPending}
            >
              Delete All Players
            </Button>
            
            <p className="text-sm text-muted-foreground italic mt-4">
              Note: Deleting scores will reset match and round statistics automatically.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      {confirmationDialogOpen && confirmationAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">{confirmationAction.title}</h2>
            <p className="text-muted-foreground mb-6">{confirmationAction.message}</p>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setConfirmationDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant={confirmationAction.type === 'delete' ? "destructive" : "default"}
                onClick={async () => {
                  try {
                    await confirmationAction.action();
                  } catch (error) {
                    console.error('Action failed:', error);
                  }
                }}
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm ${confirmationAction.type === 'delete' ? 'Delete' : 'Reset'}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
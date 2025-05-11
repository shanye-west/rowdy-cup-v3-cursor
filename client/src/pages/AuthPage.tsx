import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, passcode });
  };

  // Only redirect if we're not loading and the user is authenticated
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the Rowdy Cup admin panel
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passcode">PIN Code</Label>
                <Input
                  id="passcode"
                  type="password"
                  placeholder="Enter your 4-digit PIN"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="flex-1 bg-primary p-6 text-primary-foreground flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-4">Rowdy Cup Scoreboard</h1>
          <p className="text-xl mb-6">
            Tournament administration panel for the Rowdy Cup golf tournament.
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground text-primary rounded-full w-8 h-8 flex items-center justify-center mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-semibold">Create Tournament</h3>
                <p className="text-sm text-primary-foreground/80">
                  Set up tournament details, rounds, and matches
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground text-primary rounded-full w-8 h-8 flex items-center justify-center mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-semibold">Manage Players</h3>
                <p className="text-sm text-primary-foreground/80">
                  Add, edit, and organize players in their teams
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground text-primary rounded-full w-8 h-8 flex items-center justify-center mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-semibold">Track Scores</h3>
                <p className="text-sm text-primary-foreground/80">
                  Monitor match progress and update tournament standings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
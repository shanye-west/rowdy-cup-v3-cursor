import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Round from "@/pages/Round";
import Match from "@/pages/Match";
import Teams from "@/pages/Teams";
import AuthPage from "@/pages/AuthPage";
import AdminPlayersPage from "@/pages/AdminPlayersPage";
import SetPinPage from "@/pages/SetPin";
import TestCourses from "@/pages/TestCourses";
import TournamentHistory from "@/pages/TournamentHistory";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Layout>
            <Switch>
              {/* Public Routes */}
              <Route path="/" component={Home} />
              <Route path="/teams" component={Teams} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/tournament-history" component={TournamentHistory} />
              {/* Protected Routes with params */}
              <Route path="/round/:roundId">
                {(params: { roundId: string }) => (
                  <ProtectedRoute path="/round/:roundId">
                    <Round id={parseInt(params.roundId)} />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/match/:matchId">
                {(params: { matchId: string }) => (
                  <ProtectedRoute path="/match/:matchId">
                    <Match id={parseInt(params.matchId)} />
                  </ProtectedRoute>
                )}
              </Route>
              <ProtectedRoute path="/set-pin" component={SetPinPage} />
              {/* Admin Only Routes */}
              <ProtectedRoute path="/admin/players" component={AdminPlayersPage} adminOnly />
              <ProtectedRoute path="/test-courses" component={TestCourses} adminOnly />
              {/* 404 Route */}
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

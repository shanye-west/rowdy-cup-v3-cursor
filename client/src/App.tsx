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
import LoginPage from "@/pages/Login";
import SetPinPage from "@/pages/SetPin";
import TestCourses from "@/pages/TestCourses";
import TournamentHistory from "@/pages/TournamentHistory";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Layout>
            <Switch>
              {/* Public Routes */}
              <ProtectedRoute path="/" component={Home} public />
              <ProtectedRoute path="/teams" component={Teams} public />
              <ProtectedRoute path="/auth" component={AuthPage} public />
              <ProtectedRoute path="/login" component={LoginPage} public />
              <ProtectedRoute path="/tournament-history" component={TournamentHistory} public />
              
              {/* Protected Routes */}
              <Route path="/round/:roundId">
                {(params) => <Round id={parseInt(params.roundId)} />}
              </Route>
              <Route path="/match/:matchId">
                {(params) => <Match id={parseInt(params.matchId)} />}
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

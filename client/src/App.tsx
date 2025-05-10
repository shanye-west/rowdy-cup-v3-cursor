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

function Router() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [window.location.pathname]);

  useEffect(() => {
    const wsUrl = process.env.NODE_ENV === 'production'
      ? 'wss://rowdy-cup-v3-cursor.onrender.com/ws'
      : 'ws://localhost:5000/ws';

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setSocket(ws);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed with code', event.code);
        setSocket(null);
        
        // Only attempt to reconnect if the connection was lost unexpectedly
        if (event.code === 1006) {
          console.log('Attempting to reconnect WebSocket...');
          setTimeout(connectWebSocket, 5000);
        }
      };

      return ws;
    };

    const ws = connectWebSocket();
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/rounds/:id">
        {(params) => <Round id={parseInt(params.id)} />}
      </Route>
      <Route path="/matches/:id">
        {(params) => <Match id={parseInt(params.id)} />}
      </Route>
      <Route path="/teams" component={Teams} />
      <Route path="/history" component={TournamentHistory} />
      <Route path="/login" component={LoginPage} />
      <Route path="/set-pin" component={SetPinPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/test-courses" component={TestCourses} />
      <ProtectedRoute path="/admin/players" component={AdminPlayersPage} adminOnly={true} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Layout>
            <Router />
          </Layout>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

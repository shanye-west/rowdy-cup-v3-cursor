import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { ReactNode } from "react";

type ProtectedRouteProps = {
  path: string;
  component?: React.ComponentType;
  children?: ReactNode;
  adminOnly?: boolean;
  public?: boolean;
};

export function ProtectedRoute({
  path,
  component: Component,
  children,
  adminOnly = false,
  public: isPublic = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (isPublic) {
          return Component ? <Component /> : children;
        }

        if (!user) {
          if (path === '/auth') {
            return Component ? <Component /> : children;
          }
          return <Redirect to="/auth" />;
        }

        if (adminOnly && !isAdmin) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access this page.
              </p>
              <Redirect to="/" />
            </div>
          );
        }

        return Component ? <Component /> : children;
      }}
    </Route>
  );
}
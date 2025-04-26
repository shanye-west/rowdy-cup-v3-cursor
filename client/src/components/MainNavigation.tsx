import rowdyCupLogo from "../assets/rowdy-cup-logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { Settings } from "lucide-react";

interface MainNavigationProps {
  isOpen: boolean;
  onNavigate: (path: string) => void;
}

const MainNavigation = ({ isOpen, onNavigate }: MainNavigationProps) => {
  const { user, isAdmin, isAuthenticated, logoutMutation } = useAuth();
  
  if (!isOpen) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-center mb-4">
          <img src={rowdyCupLogo} alt="Rowdy Cup" className="h-16" />
        </div>
        
        {/* User info if authenticated */}
        {isAuthenticated && (
          <div className="mb-4 px-3 py-2 bg-gray-50 rounded-md">
            <div className="font-medium">{user?.username}</div>
            <div className="text-xs text-muted-foreground">
              {isAdmin ? "Administrator" : "Standard User"}
            </div>
          </div>
        )}
        
        <ul className="space-y-1">
          <li>
            <button 
              className="block w-full text-left py-2 hover:bg-gray-100 px-3 rounded font-semibold"
              onClick={() => onNavigate('/')}
            >
              Tournament Home
            </button>
          </li>

          <li>
            <button 
              className="block w-full text-left py-2 hover:bg-gray-100 px-3 rounded"
              onClick={() => onNavigate('/teams')}
            >
              Team Rosters
            </button>
          </li>
          
          {isAdmin && (
            <li>
              <button 
                className="block w-full text-left py-2 hover:bg-gray-100 px-3 rounded text-primary flex items-center"
                onClick={() => onNavigate('/admin')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin Dashboard
              </button>
            </li>
          )}
          
          {!isAuthenticated && (
            <li>
              <button 
                className="block w-full text-left py-2 mt-4 bg-gray-100 hover:bg-gray-200 px-3 rounded text-center"
                onClick={() => onNavigate('/auth')}
              >
                Login
              </button>
            </li>
          )}
          
          {isAuthenticated && (
            <li>
              <button 
                className="block w-full text-left py-2 mt-4 bg-gray-100 hover:bg-gray-200 px-3 rounded text-center text-rose-600"
                onClick={() => {
                  logoutMutation.mutate();
                  onNavigate('/');
                }}
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default MainNavigation;

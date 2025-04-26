interface MainNavigationProps {
  isOpen: boolean;
  onNavigate: (path: string) => void;
}

const MainNavigation = ({ isOpen, onNavigate }: MainNavigationProps) => {
  if (!isOpen) return null;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-2">
        <ul>
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
              onClick={() => onNavigate('/rounds')}
            >
              All Rounds
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
          <li>
            <button 
              className="block w-full text-left py-2 hover:bg-gray-100 px-3 rounded"
              onClick={() => onNavigate('/about')}
            >
              About Rowdy Cup
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default MainNavigation;

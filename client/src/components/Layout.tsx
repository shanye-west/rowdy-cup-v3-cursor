import { useState } from "react";
import { useLocation } from "wouter";
import MainNavigation from "./MainNavigation";
import FooterNavigation from "./FooterNavigation";
import RowdyCupLogo from "../assets/rowdy-cup-logo.svg"

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [_, navigate] = useLocation();

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeNav();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <a href="https://rowdycup.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
            <img src={RowdyCupLogo} alt="Rowdy Cup" className="h-10" />
          </a>
          <div className="flex items-center space-x-2">
            <button 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={toggleNav}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <MainNavigation isOpen={isNavOpen} onNavigate={handleNavigation} />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer Navigation */}
      <FooterNavigation onNavigate={handleNavigation} />
    </div>
  );
};

export default Layout;

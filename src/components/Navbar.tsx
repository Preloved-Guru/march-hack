import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Menu, X, ShoppingBag, User, LayoutDashboard } from 'lucide-react';

// Navbar no longer includes wishlist functionality
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Navigate to profile page
  const handleProfileClick = () => {
    navigate('/profile');
    window.scrollTo(0, 0);
  };
  
  // Handle navigation with scroll to top
  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0); // Scroll to top when navigating
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0  z-50 transition-all duration-300 ease-in-out-expo py-4 px-4 md:px-8',
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          onClick={() => window.scrollTo(0, 0)}
          className="flex items-center font-display text-2xl font-bold tracking-tight transition-opacity duration-300 hover:opacity-80"
        >
          <img 
            src="/01_Logo_Green.jpg" 
            alt="Preloved Guru" 
            className="h-8"
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => handleNavigation('/')}
            className="text-sm font-medium transition-colors hover:text-thrift-600"
          >
            Home
          </button>
          <button 
            onClick={() => handleNavigation('/shop')}
            className="text-sm font-medium transition-colors hover:text-thrift-600"
          >
            Shop
          </button>
          <button 
            onClick={() => handleNavigation('/retail')}
            className="text-sm font-medium transition-colors hover:text-thrift-600"
          >
            Retail Hub
          </button>
          <div className="hidden md:flex items-center space-x-4">
          <button 
            className="rounded-full p-2 transition-colors hover:bg-thrift-100"
            onClick={handleProfileClick}
            aria-label="Open Profile"
          >
            <User size={20} className="text-thrift-700" />
          </button>
        </div>
        </nav>

        

        <button 
          className="md:hidden rounded-full p-2 transition-colors hover:bg-thrift-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg animate-fade-in">
          <nav className="flex flex-col p-6 space-y-4">
            <button 
              onClick={() => {
                handleNavigation('/');
                setIsMobileMenuOpen(false);
              }}
              className="text-base font-medium transition-colors hover:text-thrift-600"
            >
              Home
            </button>
            <button 
              onClick={() => {
                handleNavigation('/shop');
                setIsMobileMenuOpen(false);
              }}
              className="text-base font-medium transition-colors hover:text-thrift-600"
            >
              Shop
            </button>
            <button 
              onClick={() => {
                handleNavigation('/retail');
                setIsMobileMenuOpen(false);
              }}
              className="text-base font-medium transition-colors hover:text-thrift-600"
            >
              Retailer Tools
            </button>
            <div className="flex items-center space-x-4 pt-2">
              <button className="flex items-center space-x-2 text-sm font-medium">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button 
                className="flex items-center space-x-2 text-sm font-medium"
                onClick={() => {
                  handleProfileClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                <User size={18} />
                <span>Profile</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;


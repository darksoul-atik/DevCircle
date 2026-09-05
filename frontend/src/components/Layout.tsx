import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { FiSun, FiMoon, FiUser, FiLogOut } from 'react-icons/fi';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import SearchDropdown from './SearchDropdown';
import gsap from 'gsap';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSizeClass?: string;
}

export function Logo({ className = "", iconSize = 24, textSizeClass = "text-xl" }: LogoProps = {}) {
  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent transition-transform group-hover:scale-105">
        <polyline points="7 8 3 12 7 16" />
        <polyline points="17 8 21 12 17 16" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </svg>
      <span className={`font-display font-bold tracking-tight text-primary ${textSizeClass}`}>DevCircle</span>
    </Link>
  );
}

export function DarkModeToggle({ isDark, toggle }: { isDark: boolean, toggle: () => void }) {
  const iconRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    // A short rotational cross-fade
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotation: "+=180",
        scale: 0.8,
        opacity: 0,
        duration: 0.15,
        onComplete: () => {
          toggle();
          gsap.to(iconRef.current, {
            rotation: "+=180",
            scale: 1,
            opacity: 1,
            duration: 0.15,
          });
        }
      });
    } else {
      toggle();
    }
  };

  return (
    <button 
      onClick={handleToggle}
      className="p-2 text-muted hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
      aria-label="Toggle Dark Mode"
    >
      <div ref={iconRef}>
        {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
      </div>
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <header 
        className={`sticky top-0 z-50 transition-all duration-200 border-b ${
          scrolled 
            ? 'bg-base/90 backdrop-blur-md border-hairline shadow-sm' 
            : 'bg-base border-hairline'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              {user && (
                <Link 
                  to="/" 
                  className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted hover:text-primary'}`}
                >
                  Feed
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4 w-full justify-end">
            <div className="hidden sm:block flex-1 max-w-sm mr-2">
              <SearchDropdown />
            </div>
            
            <DarkModeToggle isDark={isDark} toggle={toggleDarkMode} />

            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-hairline">
                <Link to="/profile/me" className="flex items-center justify-center p-1 rounded-full border border-hairline hover:border-accent transition-colors" title="Profile">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-6 h-6 rounded-full bg-subtle" />
                  ) : (
                    <FiUser size={18} className="m-1 text-muted" />
                  )}
                </Link>
                <button 
                  onClick={() => logout()} 
                  className="p-2 text-muted hover:text-primary transition-colors"
                  title="Logout"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-hairline">
                <Link to="/login" className="text-sm font-medium text-muted hover:text-primary transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="text-sm font-medium bg-accent text-white px-4 py-1.5 rounded-md hover:bg-accent/90 transition-colors">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content route transition wrapper could go here if we wanted full page anims, 
          but prompt asks for brief subtle fade on page route transitions. 
          We'll add a simple CSS animation keyframe for page loads. */}
      <div className="flex-1 flex max-w-5xl w-full mx-auto px-4 relative">
        <Sidebar />
        <main className="flex-1 min-w-0 md:pl-8 pb-16 md:pb-0 animate-in fade-in duration-300">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

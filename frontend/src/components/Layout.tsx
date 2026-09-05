import { useRef } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { FiSun, FiMoon, FiLogOut } from 'react-icons/fi';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import SearchDropdown from './SearchDropdown';
import Avatar from './Avatar';
import Footer from './Footer';
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

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <header className="sticky top-0 z-50 transition-all duration-200 border-b bg-base/70 backdrop-blur-lg border-hairline shadow-sm">
        <div className="w-full px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
            </nav>
          </div>
          
          <div className="flex items-center gap-4 w-full justify-end">
            <div className="flex-1 max-w-sm mr-2">
              <SearchDropdown />
            </div>
            
            <DarkModeToggle isDark={isDark} toggle={toggleDarkMode} />

            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-hairline">
                <Link to="/profile/me" className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-accent transition-all" title="Profile">
                  <Avatar url={user.avatar} name={user.name} size="md" />
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
      <div className="flex-1 flex w-full px-4 md:px-8 relative">
        <Sidebar />
        <main className="flex-1 min-w-0 md:pl-8 pb-16 md:pb-0 h-full flex flex-col">
          <Outlet />
        </main>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}

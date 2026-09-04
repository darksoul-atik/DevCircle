import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-purple-600 dark:text-purple-400">DevCircle</Link>
          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <Link to="/" className="text-sm font-medium hover:text-purple-600">Feed</Link>
                <Link to="/profile/me" className="text-sm font-medium hover:text-purple-600">Profile</Link>
                <button 
                  onClick={() => logout()} 
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-purple-600">Login</Link>
                <Link to="/register" className="text-sm font-medium hover:text-purple-600">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

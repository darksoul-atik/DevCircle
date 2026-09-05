import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiHeart, FiPlusSquare, FiPlusCircle } from 'react-icons/fi';

export default function MobileNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Feed', path: '/', icon: FiHome },
    { label: 'Add Post', path: '/posts/new', icon: FiPlusSquare },
    { label: 'Add Comm.', path: '/communities/new', icon: FiPlusCircle },
    { label: 'Favorites', path: '/favorites', icon: FiHeart },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-base/90 backdrop-blur-md border-t border-hairline z-50 px-2 pb-safe">
      <div className="flex items-center justify-between h-14">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors ${isActive ? 'text-accent' : 'text-muted hover:text-primary'}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

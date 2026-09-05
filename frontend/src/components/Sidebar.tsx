import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiHome, FiHeart, FiPlusSquare, FiPlusCircle } from 'react-icons/fi';
import client from '../api/client';
import CommunityIcon from './CommunityIcon';

export default function Sidebar() {
  const location = useLocation();

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const res = await client.get('/communities');
      return res.data.data;
    }
  });

  const navItems = [
    { label: 'Feed', path: '/', icon: FiHome },
    { label: 'Add Post', path: '/posts/new', icon: FiPlusSquare },
    { label: 'Add Community', path: '/communities/new', icon: FiPlusCircle },
    { label: 'Favorites', path: '/favorites', icon: FiHeart },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-hairline bg-base hidden md:block pt-6 px-4 pb-20 sticky top-16" style={{ height: 'calc(100vh - 4rem)' }}>
      <nav className="space-y-1 mb-8">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${isActive ? 'bg-subtle text-primary' : 'text-muted hover:bg-subtle/50 hover:text-primary'}`}
            >
              <Icon size={18} className={isActive ? 'text-accent' : ''} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div>
        <div className="flex items-center justify-between px-3 mb-3">
          <h3 className="text-xs font-semibold text-muted tracking-wider uppercase">
            Communities
          </h3>
          <Link to="/communities/new" className="text-muted hover:text-accent transition-colors" title="Add Community">
            <FiPlusCircle size={14} />
          </Link>
        </div>
        <div className="space-y-1 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
          {communities?.map((community: any) => {
            const path = `/communities/${community.slug}`;
            const isActive = location.pathname === path;
            return (
              <Link
                key={community.id}
                to={path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-subtle text-primary font-medium' : 'text-muted hover:bg-subtle/50 hover:text-primary'}`}
              >
                <CommunityIcon icon={community.icon} name={community.name} size="sm" />
                <span className="truncate">{community.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

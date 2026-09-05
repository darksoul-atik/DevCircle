import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { FiSearch, FiMessageSquare, FiUser, FiCompass } from 'react-icons/fi';
import { useDebounce } from '../hooks/useDebounce';

export default function SearchDropdown() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ posts: any[], users: any[], communities: any[] } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults(null);
        return;
      }
      setIsLoading(true);
      try {
        const res = await client.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
        setResults(res.data.data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div className="relative w-full max-w-sm" ref={wrapperRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within:text-accent transition-colors">
          <FiSearch size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-full pl-9 pr-4 py-2 border border-hairline rounded-md bg-subtle text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
        />
      </div>

      {isOpen && (query.trim().length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-base border border-hairline rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted animate-pulse">Searching...</div>
          ) : results ? (
            <div className="py-2">
              {results.communities.length > 0 && (
                <div className="mb-2">
                  <h3 className="px-3 py-1 text-xs font-semibold tracking-wider text-muted uppercase">Communities</h3>
                  {results.communities.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleResultClick(`/communities/${c.slug}`)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-subtle hover:text-accent transition-colors flex items-center gap-2"
                    >
                      <FiCompass size={14} className="text-muted" /> {c.name}
                    </button>
                  ))}
                </div>
              )}
              {results.users.length > 0 && (
                <div className="mb-2">
                  <h3 className="px-3 py-1 text-xs font-semibold tracking-wider text-muted uppercase">People</h3>
                  {results.users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleResultClick(`/profile/${u.id}`)} // Or wherever users go
                      className="w-full text-left px-4 py-2 text-sm hover:bg-subtle hover:text-accent transition-colors flex items-center gap-2"
                    >
                      <FiUser size={14} className="text-muted" /> {u.name}
                    </button>
                  ))}
                </div>
              )}
              {results.posts.length > 0 && (
                <div>
                  <h3 className="px-3 py-1 text-xs font-semibold tracking-wider text-muted uppercase">Discussions</h3>
                  {results.posts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleResultClick(`/posts/${p.id}`)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-subtle hover:text-accent transition-colors flex flex-col gap-0.5"
                    >
                      <span className="font-medium line-clamp-1">{p.title}</span>
                      <span className="text-xs text-muted flex items-center gap-1"><FiMessageSquare size={10} /> {p.commentCount} replies</span>
                    </button>
                  ))}
                </div>
              )}
              {results.posts.length === 0 && results.communities.length === 0 && results.users.length === 0 && (
                <div className="p-4 text-center text-sm text-muted">No results found for "{query}"</div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

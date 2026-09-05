import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiArrowUp, FiArrowDown, FiChevronLeft, FiChevronRight, FiSearch, FiEdit3 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { formatDateTime } from '../utils/date';

interface Post {
  id: string;
  title: string;
  body: string;
  author: { name: string; email: string; avatar?: string; title?: string | null };
  community?: { name: string; slug: string };
  imageUrl?: string;
  tags?: string[];
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  score: number;
  createdAt: string;
}

function FeedSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-base rounded-xl p-6 border border-hairline flex flex-col gap-3 shadow-sm">
          <div className="h-4 w-48 bg-subtle rounded"></div>
          <div className="h-6 w-3/4 bg-subtle rounded"></div>
          <div className="h-4 w-full bg-subtle rounded"></div>
          <div className="h-4 w-32 bg-subtle rounded mt-2"></div>
        </div>
      ))}
    </div>
  );
}

export default function Feed() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['posts', page, search],
    queryFn: async () => {
      const res = await client.get('/posts', { params: { page, q: search } });
      return res.data.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset page on new search
  };

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-muted mb-4">Error loading the feed: {(error as any)?.response?.data?.message || 'Server unreachable'}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 border border-hairline rounded-md text-sm font-medium hover:bg-subtle transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col py-6 md:py-10 px-0 md:px-4">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-display tracking-tight text-primary">Discussions</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-hairline rounded-md bg-subtle text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          {user && (
            <Link to="/posts/new" className="shrink-0 bg-primary text-base px-3 py-1.5 border border-hairline rounded-md hover:bg-subtle transition-colors flex items-center gap-2">
              <FiEdit3 size={16} className="text-muted" /> <span className="text-sm font-medium">New</span>
            </Link>
          )}
        </div>
      </header>

      {isLoading ? (
        <FeedSkeleton />
      ) : data?.items.length === 0 ? (
        <div className="py-16 text-center border border-hairline border-dashed rounded-lg">
          <FiMessageSquare size={24} className="mx-auto text-muted mb-4" />
          <h3 className="text-primary font-medium mb-1">No discussions found</h3>
          <p className="text-sm text-muted mb-4">It's quiet here. Be the first to start a conversation.</p>
          {user && (
            <Link to="/posts/new" className="text-sm text-accent hover:underline">
              Write a post
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 flex-1">
          {data?.items.map((post: Post) => {
            const isHot = post.score >= 5; // Example threshold for signal
            return (
              <Link 
                key={post.id} 
                to={`/posts/${post.id}`} 
                className={`group block bg-base rounded-xl p-6 border border-hairline shadow-sm hover:shadow-md hover:border-accent/30 transition-all relative overflow-hidden`}
              >
                {/* Ranking Signal Indicator */}
                {isHot && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-signal" title="Trending"></div>
                )}

                {post.community && (
                  <div className="absolute top-6 right-6 text-xs font-bold text-accent uppercase tracking-wider">
                    {post.community.name}
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={post.author.name} url={post.author.avatar} size="md" className="w-10 h-10 text-lg shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-primary font-semibold text-sm leading-tight">
                      {post.author.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted mt-0.5">
                      <span>{post.author.title || `@${post.author.name.toLowerCase().replace(/\s/g, '')}`}</span>
                      <span>·</span>
                      <time>{formatDateTime(post.createdAt)}</time>
                      {isHot && (
                        <>
                          <span>·</span>
                          <span className="text-signal flex items-center gap-1">Trending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-display font-medium text-primary mb-2 group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                
                <div className="text-sm text-muted leading-relaxed mb-4">
                  <p className="line-clamp-3">{post.body}</p>
                  {post.body.length > 200 && (
                    <span className="text-accent font-medium text-xs mt-1 block">... read more</span>
                  )}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">#{tag}</span>
                    ))}
                  </div>
                )}

                {post.imageUrl && (
                  <div className="w-full mb-4 bg-subtle rounded-md overflow-hidden border border-hairline flex items-center justify-center">
                    <img src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${post.imageUrl}` : `http://localhost:3000${post.imageUrl}`} alt="" className="w-full h-auto max-h-[500px] object-contain" />
                  </div>
                )}

                <div className="flex gap-4 text-sm font-medium text-muted">
                  <span className="flex items-center gap-1.5"><FiArrowUp size={14} /> {post.likeCount}</span>
                  <span className="flex items-center gap-1.5"><FiArrowDown size={14} /> {post.dislikeCount}</span>
                  <span className="flex items-center gap-1.5"><FiMessageSquare size={14} /> {post.commentCount}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="mt-12 flex justify-between items-center border-t border-hairline pt-6">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-hairline rounded hover:bg-subtle disabled:opacity-30 transition-colors"
          >
            <FiChevronLeft size={16} /> Prev
          </button>
          <span className="text-sm font-mono text-muted">
            {page} / {Math.ceil(data.total / data.limit)}
          </span>
          <button 
            disabled={page === Math.ceil(data.total / data.limit)}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-hairline rounded hover:bg-subtle disabled:opacity-30 transition-colors"
          >
            Next <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

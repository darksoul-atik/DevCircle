import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, ThumbsDown, Plus } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  body: string;
  author: { name: string; email: string };
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  score: number;
  createdAt: string;
}

export default function Feed() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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
      <div className="p-8 text-center text-red-600">
        <p>Failed to load posts: {(error as any)?.response?.data?.message || 'Unknown error'}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-purple-600 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <Link to="/posts/new" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2">
          <Plus size={18} /> New Post
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <input
          type="text"
          placeholder="Search posts..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 h-32 rounded-lg"></div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 mb-4">No posts found.</p>
          <Link to="/posts/new" className="text-purple-600 font-medium hover:underline">Be the first to post!</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map((post: Post) => (
            <Link key={post.id} to={`/posts/${post.id}`} className="block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-colors">
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-sm text-gray-500 mb-4">
                Posted by {post.author.name} • {new Date(post.createdAt).toLocaleDateString()} • Rank Score: {post.score}
              </p>
              <div className="flex gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1"><ThumbsUp size={16} /> {post.likeCount}</span>
                <span className="flex items-center gap-1"><ThumbsDown size={16} /> {post.dislikeCount}</span>
                <span className="flex items-center gap-1"><MessageSquare size={16} /> {post.commentCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Basic Pagination */}
      {data && data.total > 10 && (
        <div className="mt-8 flex justify-between items-center">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {page} of {Math.ceil(data.total / data.limit)}</span>
          <button 
            disabled={page === Math.ceil(data.total / data.limit)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

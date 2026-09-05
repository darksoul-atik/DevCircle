import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { formatDateTime } from '../utils/date';
import Avatar from '../components/Avatar';
import { FiMessageSquare, FiHeart, FiArrowDown } from 'react-icons/fi';

export default function Favorites() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await client.get('/favorites');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        <h1 className="text-2xl font-display font-bold text-primary mb-6">Favorites</h1>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-subtle rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-display font-bold text-primary mb-8">Favorites</h1>
      
      <div className="space-y-4">
        {posts?.length === 0 ? (
          <div className="text-center py-12 border border-hairline border-dashed rounded-lg text-muted">
            You haven't favorited any posts yet.
          </div>
        ) : (
          posts?.map((post: any) => (
            <Link 
              key={post.id} 
              to={`/posts/${post.id}`}
              className="block p-5 bg-base border border-hairline rounded-lg hover:border-accent transition-colors shadow-sm hover:shadow group"
            >
              <h2 className="text-lg font-display font-semibold text-primary mb-2 group-hover:text-accent transition-colors">
                {post.title}
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono text-muted mb-4">
                <Avatar name={post.author.name} size="sm" />
                <span className="font-medium text-primary">{post.author.name}</span>
                <span>·</span>
                <time>{formatDateTime(post.createdAt)}</time>
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-4 leading-relaxed">
                {post.body}
              </p>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-subtle text-xs text-muted rounded-full border border-hairline">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {post.imageUrl && (
                <div className="w-full h-48 mb-4 bg-subtle rounded-md overflow-hidden border border-hairline">
                  <img src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${post.imageUrl}` : `http://localhost:3000${post.imageUrl}`} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-6 text-xs font-mono text-muted">
                <div className="flex items-center gap-1.5 text-accent">
                  <FiHeart size={14} className="fill-accent" /> {post.likeCount}
                </div>
                <div className="flex items-center gap-1.5">
                  <FiArrowDown size={14} /> {post.dislikeCount}
                </div>
                <div className="flex items-center gap-1.5">
                  <FiMessageSquare size={14} /> {post.commentCount}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

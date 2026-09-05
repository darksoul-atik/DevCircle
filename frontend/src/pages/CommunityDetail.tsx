import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { formatDateTime } from '../utils/date';
import Avatar from '../components/Avatar';
import { FiMessageSquare, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import CommunityIcon from '../components/CommunityIcon';
import Pagination from '../components/Pagination';

export default function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['community', slug, page],
    queryFn: async () => {
      const res = await client.get(`/communities/${slug}/posts?page=${page}&limit=10`);
      return res.data.data;
    }
  });

  const navigate = useNavigate();
  const handleAuthorClick = (e: React.MouseEvent, authorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/users/${authorId}`);
  };

  if (isLoading) {
    return (
      <div className="py-8 space-y-4">
        <div className="h-24 bg-subtle rounded-md animate-pulse mb-8" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-subtle rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || !data.community) {
    return <div className="py-8 text-center text-muted">Community not found</div>;
  }

  const { community, items: posts } = data;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 space-y-8 px-0 md:px-4">
      {/* Community Header */}
      <header className="bg-subtle p-8 rounded-lg border border-hairline flex items-center gap-6">
        <CommunityIcon icon={community.icon} name={community.name} size="lg" />
        <div>
          <h1 className="text-2xl font-display font-bold text-primary mb-1">{community.name}</h1>
          {community.description && (
            <p className="text-muted text-sm">{community.description}</p>
          )}
        </div>
      </header>

      {/* Posts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-medium text-primary">Recent Posts</h2>
          <Link to="/posts/new" className="text-sm bg-accent text-white px-3 py-1.5 rounded hover:bg-accent/90 transition-colors shadow-sm">
            New Post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 border border-hairline border-dashed rounded-lg text-muted">
            No posts in this community yet. Be the first!
          </div>
        ) : (
          posts.map((post: any) => (
            <Link 
              key={post.id} 
              to={`/posts/${post.id}`}
              className="group block bg-subtle/40 backdrop-blur-md rounded-2xl p-6 border border-hairline/50 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)] hover:border-accent/30 transition-all relative overflow-hidden"
            >
              <h2 className="text-lg font-display font-semibold text-primary mb-2 group-hover:text-accent transition-colors">
                {post.title}
              </h2>
              <div 
                className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => handleAuthorClick(e, post.author.id)}
                title="View Profile"
              >
                <Avatar name={post.author.name} url={post.author.avatar} size="md" className="w-10 h-10 text-lg shrink-0" />
                <div className="flex flex-col">
                  <span className="text-primary font-semibold text-sm leading-tight hover:text-accent transition-colors">
                    {post.author.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted mt-0.5">
                    <span>{post.author.title || `@${post.author.name.toLowerCase().replace(/\s/g, '')}`}</span>
                    <span>·</span>
                    <time>{formatDateTime(post.createdAt)}</time>
                  </div>
                </div>
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
                <div className="w-full mb-4 bg-subtle rounded-md overflow-hidden border border-hairline flex items-center justify-center">
                  <img src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${post.imageUrl}` : `http://localhost:3000${post.imageUrl}`} alt="" className="w-full h-auto max-h-[500px] object-contain" />
                </div>
              )}
              <div className="flex items-center gap-6 text-xs font-mono text-muted">
                <div className="flex items-center gap-1.5">
                  <FiArrowUp size={14} /> {post.likeCount}
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

      {data && data.total > data.limit && (
        <Pagination 
          currentPage={page} 
          totalPages={Math.ceil(data.total / data.limit)} 
          onPageChange={setPage} 
        />
      )}
    </div>
  );
}

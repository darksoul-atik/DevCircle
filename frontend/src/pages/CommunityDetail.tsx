import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import client from '../api/client';
import { formatDateTime } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

import { FiMessageSquare, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import CommunityIcon from '../components/CommunityIcon';
import Pagination from '../components/Pagination';

export default function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIconPreview, setEditIconPreview] = useState<string | null>(null);
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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

  const handleEditStart = () => {
    setEditName(community.name);
    setEditDescription(community.description || '');
    setEditIconPreview(community.icon ? (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${community.icon}` : `http://localhost:3000${community.icon}`) : null);
    setEditIconFile(null);
    setEditError('');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditIconFile(file);
      setEditIconPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    setEditError('');
    try {
      const formData = new FormData();
      let hasChanges = false;
      
      if (editName !== community.name) {
        formData.append('name', editName);
        hasChanges = true;
      }
      if (editDescription !== community.description) {
        formData.append('description', editDescription);
        hasChanges = true;
      }
      if (editIconFile) {
        formData.append('icon', editIconFile);
        hasChanges = true;
      }

      let updatedSlug = community.slug;
      if (hasChanges) {
        const res = await client.put(`/communities/${community.slug}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedSlug = res.data.data.slug;
      }

      await queryClient.invalidateQueries({ queryKey: ['community', community.slug] });
      await queryClient.invalidateQueries({ queryKey: ['community', updatedSlug] });
      await queryClient.invalidateQueries({ queryKey: ['communities'] });
      
      setIsEditing(false);
      
      if (updatedSlug !== community.slug) {
        navigate(`/communities/${updatedSlug}`, { replace: true });
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update community');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 space-y-8 px-0 md:px-4">
      <Helmet>
        <title>{community.name} | DevCircle</title>
        {community.icon && (
          <link rel="icon" type="image/png" href={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${community.icon}` : `http://localhost:3000${community.icon}`} />
        )}
      </Helmet>
      {/* Community Header */}
      {isEditing ? (
        <header className="bg-subtle p-4 sm:p-6 md:p-8 rounded-lg border border-hairline flex flex-col gap-4">
          {editError && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
              {editError}
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div 
                className="w-24 h-24 rounded-2xl bg-background flex items-center justify-center overflow-hidden border border-hairline cursor-pointer relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {editIconPreview ? (
                  <img src={editIconPreview} alt="Icon preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-muted font-display font-bold text-2xl">{editName.substring(0, 2).toUpperCase()}</div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Upload</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-hairline rounded-md text-primary font-display font-bold text-xl focus:outline-none focus:border-accent transition-colors"
                  placeholder="Community Name"
                />
              </div>
              <div>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-hairline rounded-md text-primary text-sm focus:outline-none focus:border-accent transition-colors min-h-[80px] resize-y"
                  placeholder="What is this community about?"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleEditCancel}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-primary transition-colors border border-hairline rounded hover:bg-background"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSave}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium bg-accent text-white rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </header>
      ) : (
        <header className="bg-subtle p-4 sm:p-6 md:p-8 rounded-lg border border-hairline flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-6">
            <CommunityIcon icon={community.icon} name={community.name} size="lg" />
            <div>
              <h1 className="text-2xl font-display font-bold text-primary mb-1">{community.name}</h1>
              {community.description && (
                <p className="text-muted text-sm mb-3">{community.description}</p>
              )}
              
              {/* Created By Info */}
              {community.createdBy && (
                <div 
                  className="flex items-center gap-2 mt-2 cursor-pointer group w-fit"
                  onClick={(e) => handleAuthorClick(e, community.createdBy.id)}
                >
                  <span className="text-xs text-muted">Created by</span>
                  <Avatar url={community.createdBy.avatar} name={community.createdBy.name} size="sm" />
                  <span className="text-sm font-medium text-primary group-hover:text-accent transition-colors">
                    {community.createdBy.name}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {user?.id === community.createdBy?.id && (
            <button 
              onClick={handleEditStart}
              className="px-4 py-2 text-sm font-medium bg-background border border-hairline rounded hover:bg-subtle transition-colors shadow-sm whitespace-nowrap"
            >
              Edit Community details
            </button>
          )}
        </header>
      )}

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

      {data && (
        <Pagination 
          currentPage={page} 
          totalPages={Math.max(1, Math.ceil(data.total / data.limit))} 
          onPageChange={setPage} 
        />
      )}


    </div>
  );
}

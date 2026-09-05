import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import ReactMarkdown from 'react-markdown';
import { FiMessageSquare, FiArrowUp, FiArrowDown, FiCornerDownRight, FiEdit2, FiTrash2, FiBookmark } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { formatDateTime } from '../utils/date';
import gsap from 'gsap';

interface Reaction {
  id: string;
  type: 'like' | 'dislike';
  userId: string;
}

interface Comment {
  id: string;
  body: string;
  author: { id: string; name: string; avatar?: string; title?: string | null };
  createdAt: string;
  likeCount: number;
  dislikeCount: number;
  reactions: Reaction[];
  replies: Comment[];
}

interface Post {
  id: string;
  title: string;
  body: string;
  author: { id: string; name: string; email: string; avatar?: string; title?: string | null };
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
  reactions: Reaction[];
  favorites?: { id: string; userId: string; postId: string }[];
  community?: { name: string; slug: string };
  imageUrl?: string;
  tags?: string[];
}

function CommentNode({ comment, postId }: { comment: Comment, postId: string }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const likeIconRef = useRef<HTMLSpanElement>(null);
  const dislikeIconRef = useRef<HTMLSpanElement>(null);

  const replyMutation = useMutation({
    mutationFn: (body: string) => client.post(`/posts/${postId}/comments`, { body, parentCommentId: comment.id }),
    onSuccess: (res) => {
      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old) return old;
        const updateTree = (nodes: any[]): any[] => {
          return nodes.map(node => {
            if (node.id === comment.id) {
              return { ...node, replies: [...(node.replies || []), res.data.data] };
            }
            if (node.replies) {
              return { ...node, replies: updateTree(node.replies) };
            }
            return node;
          });
        };
        return updateTree(old);
      });
      setIsReplying(false);
      setReplyBody('');
    }
  });

  const editMutation = useMutation({
    mutationFn: (body: string) => client.put(`/posts/${postId}/comments/${comment.id}`, { body }),
    onSuccess: (res) => {
      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old) return old;
        const updateTree = (nodes: any[]): any[] => {
          return nodes.map(node => {
            if (node.id === comment.id) {
              return { ...node, ...res.data.data };
            }
            if (node.replies) {
              return { ...node, replies: updateTree(node.replies) };
            }
            return node;
          });
        };
        return updateTree(old);
      });
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.delete(`/posts/${postId}/comments/${comment.id}`),
    onSuccess: () => {
      queryClient.setQueryData(['comments', postId], (old: any) => {
        if (!old) return old;
        const removeTree = (nodes: any[]): any[] => {
          return nodes.filter(node => node.id !== comment.id).map(node => {
            if (node.replies) {
              return { ...node, replies: removeTree(node.replies) };
            }
            return node;
          });
        };
        return removeTree(old);
      });
    }
  });

  const toggleReaction = useMutation({
    mutationFn: (type: 'like' | 'dislike') => 
      client.post('/reactions', { targetType: 'comment', targetId: comment.id, type }),
    onMutate: async (type) => {
      // GSAP bounce
      const targetRef = type === 'like' ? likeIconRef.current : dislikeIconRef.current;
      if (targetRef) {
        gsap.fromTo(targetRef, { scale: 1 }, { scale: 1.25, duration: 0.1, yoyo: true, repeat: 1 });
      }

      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData(['comments', postId]);

      const updateTree = (nodes: Comment[]): Comment[] => {
        return nodes.map(node => {
          if (node.id === comment.id) {
            let newLikeCount = node.likeCount;
            let newDislikeCount = node.dislikeCount;
            let newReactions = [...(node.reactions || [])];
            
            const existingIndex = newReactions.findIndex(r => r.userId === user?.id);
            if (existingIndex > -1) {
              const existing = newReactions[existingIndex];
              if (existing.type === type) {
                newReactions.splice(existingIndex, 1);
                if (type === 'like') newLikeCount--;
                if (type === 'dislike') newDislikeCount--;
              } else {
                newReactions[existingIndex] = { ...existing, type };
                if (type === 'like') { newLikeCount++; newDislikeCount--; }
                if (type === 'dislike') { newDislikeCount++; newLikeCount--; }
              }
            } else {
              newReactions.push({ id: 'temp', type, userId: user!.id });
              if (type === 'like') newLikeCount++;
              if (type === 'dislike') newDislikeCount++;
            }
            return { ...node, likeCount: newLikeCount, dislikeCount: newDislikeCount, reactions: newReactions };
          }
          if (node.replies) {
            return { ...node, replies: updateTree(node.replies) };
          }
          return node;
        });
      };

      queryClient.setQueryData(['comments', postId], (old: any) => old ? updateTree(old) : old);
      return { previousComments };
    },
    onError: (err, newTodo, context: any) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    replyMutation.mutate(replyBody);
  };

  const userReaction = comment.reactions?.find(r => r.userId === user?.id)?.type;

  return (
    <div className="border-l border-hairline pl-4 py-3 mt-2 relative">
      {/* Structural connector */}
      <div className="absolute -left-[1px] top-4 w-[1px] h-4 bg-hairline"></div>
      
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar name={comment.author.name} url={comment.author.avatar} size="md" className="w-9 h-9 text-base shrink-0" />
        <div className="flex flex-col">
          <span className="font-semibold text-primary text-sm leading-tight">
            {comment.author.name}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted mt-0.5">
            <span>{comment.author.title || `@${comment.author.name.toLowerCase().replace(/\s/g, '')}`}</span>
            <span>·</span>
            <time>{formatDateTime(comment.createdAt)}</time>
          </div>
        </div>
        {user?.id === comment.author.id && (
          <div className="flex gap-2 ml-auto text-muted">
            <button onClick={() => setIsEditing(!isEditing)} className="hover:text-accent transition-colors" title="Edit"><FiEdit2 size={12} /></button>
            <button onClick={() => { if(confirm('Delete comment?')) deleteMutation.mutate() }} className="hover:text-red-500 transition-colors" title="Delete"><FiTrash2 size={12} /></button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); editMutation.mutate(editBody); }} className="mb-2">
          <textarea
            className="w-full text-sm px-3 py-2 border border-hairline rounded-md bg-subtle focus:outline-none focus:border-accent"
            rows={2}
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={() => setIsEditing(false)} className="text-sm font-medium text-muted hover:text-primary px-2 py-1">Cancel</button>
            <button type="submit" disabled={editMutation.isPending} className="text-sm font-medium text-accent hover:text-accent/80 px-2 py-1">Save</button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-primary leading-relaxed mb-2">{comment.body}</p>
      )}
      
      <div className="flex items-center gap-4 text-sm font-medium text-muted">
        <button 
          onClick={() => user && toggleReaction.mutate('like')}
          className={`flex items-center gap-1.5 transition-colors ${userReaction === 'like' ? 'text-green-500' : 'hover:text-primary'}`}
          disabled={!user}
        >
          <span ref={likeIconRef}><FiArrowUp size={13} /></span> {comment.likeCount}
        </button>
        <button 
          onClick={() => user && toggleReaction.mutate('dislike')}
          className={`flex items-center gap-1.5 transition-colors ${userReaction === 'dislike' ? 'text-red-500' : 'hover:text-primary'}`}
          disabled={!user}
        >
          <span ref={dislikeIconRef}><FiArrowDown size={13} /></span> {comment.dislikeCount}
        </button>
        {user && (
          <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-1 hover:text-primary transition-colors">
            <FiCornerDownRight size={13} /> Reply
          </button>
        )}
      </div>

      {isReplying && (
        <form onSubmit={handleSubmit} className="mt-4 mb-2">
          <textarea
            className="w-full text-sm px-3 py-2 border border-hairline rounded-md bg-subtle focus:outline-none focus:border-accent"
            rows={2}
            placeholder="Write a reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={() => setIsReplying(false)} className="text-xs font-medium text-muted hover:text-primary px-3 py-1.5 border border-transparent rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={replyMutation.isPending} className="text-xs font-medium bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm">
              {replyMutation.isPending ? 'Replying...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map(reply => (
            <CommentNode key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [commentBody, setCommentBody] = useState('');
  
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPostBody, setEditPostBody] = useState('');
  
  const likeIconRef = useRef<HTMLSpanElement>(null);
  const dislikeIconRef = useRef<HTMLSpanElement>(null);

  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await client.get(`/posts/${id}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (post) {
      setEditTitle(post.title);
      setEditPostBody(post.body);
    }
  }, [post]);

  const editPostMutation = useMutation({
    mutationFn: (data: { title: string; body: string }) => client.put(`/posts/${id}`, data),
    onSuccess: (res) => {
      queryClient.setQueryData(['post', id], (old: any) => ({ ...old, ...res.data.data }));
      setIsEditingPost(false);
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: () => client.delete(`/posts/${id}`),
    onSuccess: () => {
      navigate('/');
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: () => client.post('/favorites', { postId: id }),
    onSuccess: (res) => {
      const { favorited } = res.data.data;
      queryClient.setQueryData(['post', id], (old: any) => {
        if (!old) return old;
        const newFavorites = favorited 
          ? [...(old.favorites || []), { userId: user!.id, postId: id }]
          : (old.favorites || []).filter((f: any) => f.userId !== user!.id);
        
        return { ...old, favorites: newFavorites };
      });
    }
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['comments', id],
    queryFn: async () => {
      const res = await client.get(`/posts/${id}/comments`);
      return res.data.data;
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => client.post(`/posts/${id}/comments`, { body }),
    onSuccess: (res) => {
      queryClient.setQueryData(['comments', id], (old: any) => {
        if (!old) return old;
        return [...old, res.data.data];
      });
      queryClient.setQueryData(['post', id], (old: any) => {
        if (!old) return old;
        return { ...old, commentCount: old.commentCount + 1 };
      });
      setCommentBody('');
    }
  });

  const postReactionMutation = useMutation({
    mutationFn: (type: 'like' | 'dislike') => 
      client.post('/reactions', { targetType: 'post', targetId: id, type }),
    onMutate: async (type) => {
      // GSAP bounce
      const targetRef = type === 'like' ? likeIconRef.current : dislikeIconRef.current;
      if (targetRef) {
        gsap.fromTo(targetRef, { scale: 1 }, { scale: 1.25, duration: 0.1, yoyo: true, repeat: 1 });
      }

      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const previousPost = queryClient.getQueryData<Post>(['post', id]);

      if (previousPost && user) {
        let newLikeCount = previousPost.likeCount;
        let newDislikeCount = previousPost.dislikeCount;
        let newReactions = [...(previousPost.reactions || [])];
        
        const existingIndex = newReactions.findIndex(r => r.userId === user.id);
        if (existingIndex > -1) {
          const existing = newReactions[existingIndex];
          if (existing.type === type) {
            newReactions.splice(existingIndex, 1);
            if (type === 'like') newLikeCount--;
            if (type === 'dislike') newDislikeCount--;
          } else {
            newReactions[existingIndex] = { ...existing, type };
            if (type === 'like') { newLikeCount++; newDislikeCount--; }
            if (type === 'dislike') { newDislikeCount++; newLikeCount--; }
          }
        } else {
          newReactions.push({ id: 'temp', type, userId: user.id });
          if (type === 'like') newLikeCount++;
          if (type === 'dislike') newDislikeCount++;
        }

        queryClient.setQueryData<Post>(['post', id], {
          ...previousPost,
          likeCount: newLikeCount,
          dislikeCount: newDislikeCount,
          reactions: newReactions
        });
      }

      return { previousPost };
    },
    onError: (err, newTodo, context: any) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', id], context.previousPost);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    commentMutation.mutate(commentBody);
  };

  if (postLoading) {
    return (
      <div className="max-w-[72ch] mx-auto py-12 px-4 animate-pulse space-y-4">
        <div className="h-10 w-3/4 bg-subtle rounded"></div>
        <div className="h-4 w-1/4 bg-subtle rounded mb-8"></div>
        <div className="h-4 w-full bg-subtle rounded"></div>
        <div className="h-4 w-full bg-subtle rounded"></div>
        <div className="h-4 w-5/6 bg-subtle rounded"></div>
      </div>
    );
  }
  
  if (!post) return <div className="max-w-3xl mx-auto py-12 px-4 text-center text-muted">Post not found</div>;

  const userPostReaction = post.reactions?.find(r => r.userId === user?.id)?.type;

  return (
    <div className="max-w-[72ch] mx-auto py-12 px-4 relative pb-32">
      <article className="mb-12">
        {isEditingPost ? (
          <form onSubmit={(e) => { e.preventDefault(); editPostMutation.mutate({ title: editTitle, body: editPostBody }); }} className="mb-8">
            <input
              type="text"
              className="w-full text-3xl font-display font-bold tracking-tight text-primary mb-4 px-3 py-2 border border-hairline rounded-md bg-subtle focus:outline-none focus:border-accent"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <textarea
              className="w-full text-base px-3 py-2 border border-hairline rounded-md bg-subtle focus:outline-none focus:border-accent font-mono"
              rows={8}
              value={editPostBody}
              onChange={(e) => setEditPostBody(e.target.value)}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button type="button" onClick={() => setIsEditingPost(false)} className="text-sm font-medium text-muted hover:text-primary px-4 py-2">Cancel</button>
              <button type="submit" disabled={editPostMutation.isPending} className="text-sm font-medium bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 disabled:opacity-50">Save Post</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col items-start gap-4 mb-4">
              {post.community && (
                <span className="px-4 py-1.5 text-xs font-bold text-accent uppercase tracking-wider rounded-full bg-base shadow-[4px_4px_10px_rgba(0,0,0,0.2),-4px_-4px_10px_rgba(255,255,255,0.05)] border border-hairline/20 inline-flex items-center justify-center">
                  {post.community.name}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-primary leading-tight">
                {post.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-3 border-b border-hairline pb-6 mb-8">
              <Avatar name={post.author.name} url={post.author.avatar} size="lg" className="w-12 h-12 text-xl shrink-0" />
              <div className="flex flex-col">
                <span className="text-primary font-semibold text-base leading-tight">
                  {post.author.name}
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted mt-0.5">
                  <span>{post.author.title || `@${post.author.name.toLowerCase().replace(/\s/g, '')}`}</span>
                  <span>·</span>
                  <time>{formatDateTime(post.createdAt)}</time>
                </div>
              </div>
              
              {user?.id === post.author.id && (
                <div className="flex gap-3 ml-auto text-muted">
                  <button onClick={() => setIsEditingPost(true)} className="hover:text-accent transition-colors" title="Edit Post"><FiEdit2 size={16} /></button>
                  <button onClick={() => { if(confirm('Delete this post?')) deletePostMutation.mutate() }} className="hover:text-red-500 transition-colors" title="Delete Post"><FiTrash2 size={16} /></button>
                </div>
              )}
            </div>
            
            <div className="prose prose-p:text-primary prose-headings:font-display prose-headings:text-primary prose-a:text-accent prose-code:text-primary prose-code:bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none text-base leading-relaxed mb-8">
              <ReactMarkdown>{post.body}</ReactMarkdown>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map(tag => (
                  <span key={tag} className="text-sm text-accent bg-accent/10 px-3 py-1 rounded-md border border-accent/20">#{tag}</span>
                ))}
              </div>
            )}

            {post.imageUrl && (
              <div className="w-full mb-10 bg-subtle rounded-xl overflow-hidden border border-hairline flex items-center justify-center">
                <img src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${post.imageUrl}` : `http://localhost:3000${post.imageUrl}`} alt="" className="w-full h-auto max-h-[600px] object-contain" />
              </div>
            )}
          </>
        )}

        {/* Reaction Bar anchored within post body instead of floating loosely */}
        <div className="flex items-center gap-6 text-sm font-mono text-muted bg-subtle/50 px-6 py-3 rounded-full border border-hairline w-max mx-auto shadow-sm">
          <button 
            onClick={() => user && postReactionMutation.mutate('like')}
            disabled={!user}
            className={`flex items-center gap-2 transition-colors ${userPostReaction === 'like' ? 'text-green-500' : 'hover:text-primary'}`}
            title={user ? 'Upvote' : 'Login to upvote'}
          >
            <span ref={likeIconRef}><FiArrowUp size={18} /></span> <span>{post.likeCount}</span>
          </button>
          <button 
            onClick={() => user && postReactionMutation.mutate('dislike')}
            disabled={!user}
            className={`flex items-center gap-2 transition-colors ${userPostReaction === 'dislike' ? 'text-red-500' : 'hover:text-primary'}`}
            title={user ? 'Downvote' : 'Login to downvote'}
          >
            <span ref={dislikeIconRef}><FiArrowDown size={18} /></span> <span>{post.dislikeCount}</span>
          </button>
          <div className="w-px h-4 bg-hairline"></div>
          <div className="flex items-center gap-2 text-primary" title="Comments">
            <FiMessageSquare size={18} /> <span>{post.commentCount}</span>
          </div>
          
          <div className="w-px h-4 bg-hairline"></div>
          <button
            onClick={() => user && favoriteMutation.mutate()}
            disabled={!user || favoriteMutation.isPending}
            className={`flex items-center gap-2 transition-colors ${post.favorites?.some(f => f.userId === user?.id) ? 'text-accent' : 'hover:text-primary'}`}
            title={user ? 'Favorite Post' : 'Login to favorite'}
          >
            <FiBookmark size={18} className={post.favorites?.some(f => f.userId === user?.id) ? 'fill-accent' : ''} />
          </button>
        </div>
      </article>


      
      <section className="pt-8 border-t border-hairline">
        <h2 className="text-xl font-display font-medium text-primary mb-8">Comments</h2>
        
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-10">
            <textarea
              className="w-full px-4 py-3 border border-hairline rounded-md bg-subtle focus:outline-none focus:border-accent text-sm"
              rows={3}
              placeholder="Add a comment..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <button 
                type="submit" 
                disabled={commentMutation.isPending || !commentBody.trim()}
                className="bg-accent text-white px-5 py-2 text-sm font-medium rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-10 p-6 border border-hairline border-dashed rounded-md text-sm text-center text-muted">
            Log in to comment.
          </div>
        )}

        {commentsLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-full bg-subtle rounded"></div>
            <div className="h-20 w-full bg-subtle rounded"></div>
          </div>
        ) : comments?.length === 0 ? (
          <div className="py-8 text-center text-muted text-sm">
            <FiMessageSquare size={24} className="mx-auto mb-3 opacity-50" />
            No comments yet.
          </div>
        ) : (
          <div className="space-y-4">
            {comments?.map((comment: Comment) => (
              <CommentNode key={comment.id} comment={comment} postId={id as string} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

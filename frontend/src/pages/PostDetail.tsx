import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import ReactMarkdown from 'react-markdown';
import { FiMessageSquare, FiHeart, FiArrowDown, FiCornerDownRight } from 'react-icons/fi';
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
  author: { id: string; name: string };
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
  author: { id: string; name: string; email: string };
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
  reactions: Reaction[];
}

function CommentNode({ comment, postId }: { comment: Comment, postId: string }) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const likeIconRef = useRef<SVGElement>(null);
  const dislikeIconRef = useRef<SVGElement>(null);

  const replyMutation = useMutation({
    mutationFn: (body: string) => client.post(`/posts/${postId}/comments`, { body, parentCommentId: comment.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setIsReplying(false);
      setReplyBody('');
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
    onError: (err, type, context: any) => {
      queryClient.setQueryData(['comments', postId], context.previousComments);
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
      
      <div className="flex items-center gap-2 mb-1.5 font-mono text-xs text-muted">
        <Avatar name={comment.author.name} size="sm" />
        <span className="font-medium text-primary">{comment.author.name} (@{comment.author.name.toLowerCase().replace(/\s/g, '')})</span>
        <span>·</span>
        <time>{formatDateTime(comment.createdAt)}</time>
      </div>
      
      <p className="text-sm text-primary leading-relaxed mb-2">{comment.body}</p>
      
      <div className="flex items-center gap-4 text-xs font-mono text-muted">
        <button 
          onClick={() => user && toggleReaction.mutate('like')}
          className={`flex items-center gap-1.5 transition-colors ${userReaction === 'like' ? 'text-accent' : 'hover:text-primary'}`}
          disabled={!user}
        >
          <FiHeart ref={likeIconRef} size={13} /> {comment.likeCount}
        </button>
        <button 
          onClick={() => user && toggleReaction.mutate('dislike')}
          className={`flex items-center gap-1.5 transition-colors ${userReaction === 'dislike' ? 'text-accent' : 'hover:text-primary'}`}
          disabled={!user}
        >
          <FiArrowDown ref={dislikeIconRef} size={13} /> {comment.dislikeCount}
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
  const [commentBody, setCommentBody] = useState('');
  
  const likeIconRef = useRef<SVGElement>(null);
  const dislikeIconRef = useRef<SVGElement>(null);

  const { data: post, isLoading: postLoading } = useQuery<Post>({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await client.get(`/posts/${id}`);
      return res.data.data;
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
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
    onError: (err, type, context: any) => {
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
        <h1 className="text-4xl font-display font-bold tracking-tight text-primary mb-4 leading-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-3 text-sm font-mono text-muted border-b border-hairline pb-6 mb-8">
          <Avatar name={post.author.name} size="md" />
          <span className="font-medium text-primary">{post.author.name} (@{post.author.name.toLowerCase().replace(/\s/g, '')})</span>
          <span>·</span>
          <time>{formatDateTime(post.createdAt)}</time>
        </div>
        
        <div className="prose prose-p:text-primary prose-headings:font-display prose-headings:text-primary prose-a:text-accent prose-code:text-primary prose-code:bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none text-base leading-relaxed mb-10">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>

        {/* Reaction Bar anchored within post body instead of floating loosely */}
        <div className="flex items-center gap-6 text-sm font-mono text-muted bg-subtle/50 px-6 py-3 rounded-full border border-hairline w-max mx-auto shadow-sm">
          <button 
            onClick={() => user && postReactionMutation.mutate('like')}
            disabled={!user}
            className={`flex items-center gap-2 transition-colors ${userPostReaction === 'like' ? 'text-accent' : 'hover:text-primary'}`}
            title={user ? 'Like' : 'Login to like'}
          >
            <FiHeart ref={likeIconRef} size={18} /> <span>{post.likeCount}</span>
          </button>
          <button 
            onClick={() => user && postReactionMutation.mutate('dislike')}
            disabled={!user}
            className={`flex items-center gap-2 transition-colors ${userPostReaction === 'dislike' ? 'text-accent' : 'hover:text-primary'}`}
            title={user ? 'Dislike' : 'Login to dislike'}
          >
            <FiArrowDown ref={dislikeIconRef} size={18} /> <span>{post.dislikeCount}</span>
          </button>
          <div className="w-px h-4 bg-hairline"></div>
          <div className="flex items-center gap-2 text-primary" title="Comments">
            <FiMessageSquare size={18} /> <span>{post.commentCount}</span>
          </div>
        </div>
      </article>


      
      <section className="pt-8 border-t border-hairline">
        <h2 className="text-xl font-display font-medium text-primary mb-8">Discussion</h2>
        
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-10">
            <textarea
              className="w-full px-4 py-3 border border-hairline rounded-md bg-subtle focus:outline-none focus:border-accent text-sm"
              rows={3}
              placeholder="Add to the discussion..."
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
            Log in to join the discussion.
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

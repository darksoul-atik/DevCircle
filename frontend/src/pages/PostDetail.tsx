import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData(['comments', postId]);

      // Optimistic update function for a nested tree
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
                // Remove
                newReactions.splice(existingIndex, 1);
                if (type === 'like') newLikeCount--;
                if (type === 'dislike') newDislikeCount--;
              } else {
                // Switch
                newReactions[existingIndex] = { ...existing, type };
                if (type === 'like') { newLikeCount++; newDislikeCount--; }
                if (type === 'dislike') { newDislikeCount++; newLikeCount--; }
              }
            } else {
              // Add
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
    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-2 mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold">{comment.author.name}</span>
        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm mb-2">{comment.body}</p>
      
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
        <button 
          onClick={() => user && toggleReaction.mutate('like')}
          className={`flex items-center gap-1 hover:text-purple-600 ${userReaction === 'like' ? 'text-purple-600' : ''}`}
        >
          <ThumbsUp size={14} /> {comment.likeCount}
        </button>
        <button 
          onClick={() => user && toggleReaction.mutate('dislike')}
          className={`flex items-center gap-1 hover:text-purple-600 ${userReaction === 'dislike' ? 'text-purple-600' : ''}`}
        >
          <ThumbsDown size={14} /> {comment.dislikeCount}
        </button>
        {user && (
          <button onClick={() => setIsReplying(!isReplying)} className="font-medium hover:text-purple-600">
            Reply
          </button>
        )}
      </div>

      {isReplying && (
        <form onSubmit={handleSubmit} className="mt-2 mb-4">
          <textarea
            className="w-full text-sm p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
            rows={2}
            placeholder="Write a reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button type="button" onClick={() => setIsReplying(false)} className="text-xs text-gray-500">Cancel</button>
            <button type="submit" disabled={replyMutation.isPending} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-md">
              {replyMutation.isPending ? 'Replying...' : 'Reply'}
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-2">
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

  if (postLoading) return <div className="max-w-3xl mx-auto py-8 px-4 animate-pulse bg-gray-200 dark:bg-gray-800 h-64 rounded-lg"></div>;
  if (!post) return <div className="max-w-3xl mx-auto py-8 px-4 text-center text-red-600">Post not found</div>;

  const userPostReaction = post.reactions?.find(r => r.userId === user?.id)?.type;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <p className="text-sm text-gray-500 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
          Posted by {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
        </p>
        
        <div className="prose dark:prose-invert max-w-none mb-8">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>

        <div className="flex gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button 
            onClick={() => user && postReactionMutation.mutate('like')}
            className={`flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors ${userPostReaction === 'like' ? 'text-purple-600' : ''}`}
          >
            <ThumbsUp size={18} /> <span>{post.likeCount}</span>
          </button>
          <button 
            onClick={() => user && postReactionMutation.mutate('dislike')}
            className={`flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors ${userPostReaction === 'dislike' ? 'text-purple-600' : ''}`}
          >
            <ThumbsDown size={18} /> <span>{post.dislikeCount}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500 ml-auto">
            <MessageSquare size={18} /> <span>{post.commentCount} Comments</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-6">Comments</h2>
        
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
              rows={3}
              placeholder="Add to the discussion..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button 
                type="submit" 
                disabled={commentMutation.isPending}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {commentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-md text-sm text-center">
            Log in to join the discussion.
          </div>
        )}

        {commentsLoading ? (
          <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-24 rounded-lg"></div>
        ) : comments?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No comments yet.</p>
        ) : (
          <div className="space-y-2">
            {comments?.map((comment: Comment) => (
              <CommentNode key={comment.id} comment={comment} postId={id as string} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

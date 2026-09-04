import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const res = await client.get(`/posts/${id}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-64 rounded-lg"></div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center text-red-600">
        <p>Failed to load post: {(error as any)?.response?.data?.message || 'Unknown error'}</p>
      </div>
    );
  }

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
          <button className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
            <ThumbsUp size={18} /> <span>{post.likeCount}</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors">
            <ThumbsDown size={18} /> <span>{post.dislikeCount}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500 ml-auto">
            <MessageSquare size={18} /> <span>{post.commentCount} Comments</span>
          </div>
        </div>
      </div>
      
      {/* Comments section will go here in Phase 5 */}
    </div>
  );
}

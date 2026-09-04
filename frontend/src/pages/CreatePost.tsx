import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Post body is required'),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function CreatePost() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema)
  });

  const onSubmit = async (data: PostFormValues) => {
    setError('');
    try {
      const res = await client.post('/posts', data);
      navigate(`/posts/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create a New Post</h1>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            {...register('title')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent"
            placeholder="What's on your mind?"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Body (Markdown supported)</label>
          <textarea
            {...register('body')}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent font-mono text-sm"
            placeholder="Write your post content here..."
          />
          {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body.message}</p>}
        </div>

        <div className="flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

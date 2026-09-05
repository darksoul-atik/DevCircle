import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useQuery } from '@tanstack/react-query';
import { FiImage, FiX } from 'react-icons/fi';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Post body is required'),
  communityId: z.string().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function CreatePost() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const res = await client.get('/communities');
      return res.data.data;
    }
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      body: '',
    }
  });

  const bodyValue = watch('body');
  const titleValue = watch('title');

  const onSubmit = async (data: PostFormValues) => {
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('body', data.body);
      if (data.communityId) {
        formData.append('communityId', data.communityId);
      }
      if (tags.length > 0) {
        // Express multer allows arrays by appending same key
        tags.forEach(tag => formData.append('tags', tag));
      }
      if (file) {
        formData.append('image', file);
      }

      const res = await client.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate(`/posts/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-primary">Create a New Post</h1>
      </div>
      
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Editor Column */}
        <form id="post-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-base p-6 rounded-xl border border-hairline shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Community</label>
            <select
              {...register('communityId')}
              className="w-full px-4 py-2.5 border border-hairline rounded-md bg-subtle text-primary focus:outline-none focus:border-accent text-sm appearance-none"
            >
              <option value="">Select a community (defaults to General)</option>
              {communities?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Title</label>
            <input
              {...register('title')}
              className="w-full px-4 py-2.5 border border-hairline rounded-md bg-subtle text-primary focus:outline-none focus:border-accent text-sm font-medium"
              placeholder="Give your post a catchy title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Body (Markdown)</label>
            <textarea
              {...register('body')}
              rows={12}
              className="w-full px-4 py-3 border border-hairline rounded-md bg-subtle text-primary focus:outline-none focus:border-accent font-mono text-sm leading-relaxed resize-y custom-scrollbar"
              placeholder="Write your content here..."
            />
            {errors.body && <p className="text-red-500 text-xs mt-1.5">{errors.body.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-subtle text-xs text-primary rounded-md border border-hairline">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-muted hover:text-accent focus:outline-none">
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="w-full px-4 py-2 border border-hairline rounded-md bg-subtle text-primary focus:outline-none focus:border-accent text-sm"
              placeholder="Add tags (press Enter or comma)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Cover Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageChange}
            />
            
            {previewImage ? (
              <div className="relative rounded-md overflow-hidden border border-hairline group">
                <img src={previewImage} alt="Preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreviewImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-hairline border-dashed rounded-md bg-subtle text-muted hover:text-primary hover:border-accent transition-colors"
              >
                <FiImage size={24} />
                <span className="text-sm font-medium">Click to upload an image</span>
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="px-5 py-2 text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="hidden lg:block sticky top-24 border border-hairline bg-base rounded-xl overflow-hidden shadow-sm h-[calc(100vh-8rem)] flex flex-col">
          <div className="px-6 py-3 border-b border-hairline bg-subtle flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Live Preview</h2>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {previewImage && (
              <div className="w-full h-48 mb-8 rounded-lg overflow-hidden border border-hairline">
                <img src={previewImage} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
            )}
            
            <h1 className="text-4xl font-display font-bold text-primary mb-8 leading-tight break-words">
              {titleValue || 'Your Post Title'}
            </h1>
            
            <div className="prose prose-p:text-primary prose-headings:font-display prose-headings:text-primary prose-a:text-accent prose-code:text-primary prose-code:bg-subtle prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none text-base leading-relaxed break-words">
              {bodyValue ? (
                <ReactMarkdown>{bodyValue}</ReactMarkdown>
              ) : (
                <p className="text-muted italic">Start typing to see your content rendered here...</p>
              )}
            </div>

            {tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-hairline">
                {tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-subtle text-xs text-muted rounded-full border border-hairline">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

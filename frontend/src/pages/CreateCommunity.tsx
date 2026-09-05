import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import client from '../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUsers, FiInfo, FiImage, FiPlusCircle } from 'react-icons/fi';

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(40, "Name must be less than 40 characters"),
  description: z.string().max(200, "Description is too long").optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCommunity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (iconFile) formData.append('icon', iconFile);

      const res = await client.post('/communities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      navigate(`/communities/${data.slug}`);
    },
    onError: (err: any) => {
      setServerError(err.response?.data?.message || 'Failed to create community');
    }
  });

  const onSubmit = (data: FormValues) => {
    setServerError('');
    mutation.mutate(data);
  };

  return (
    <div className="w-full py-10 px-4 md:px-8">
      <header className="mb-8 border-b border-hairline pb-6">
        <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
          <FiPlusCircle className="text-accent" />
          Create Community
        </h1>
        <p className="text-muted mt-2">Start a new space for people to connect, share, and discuss.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-base p-6 md:p-8 rounded-xl border border-hairline shadow-sm">
        {serverError && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-md text-sm border border-red-500/20">
            {serverError}
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <FiUsers className="text-muted" /> Community Name
          </label>
          <p className="text-xs text-muted mb-2">Choose a unique and clear name for your community.</p>
          <input
            {...register('name')}
            className={`w-full p-3 border rounded-md bg-subtle text-primary focus:outline-none focus:ring-1 transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-hairline focus:border-accent focus:ring-accent'}`}
            placeholder="e.g. React Developers"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <FiInfo className="text-muted" /> Description <span className="text-muted font-normal">(Optional)</span>
          </label>
          <p className="text-xs text-muted mb-2">What is this community about?</p>
          <textarea
            {...register('description')}
            rows={3}
            className={`w-full p-3 border rounded-md bg-subtle text-primary focus:outline-none focus:ring-1 transition-all ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-hairline focus:border-accent focus:ring-accent'}`}
            placeholder="A place for React developers to hang out..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
            <FiImage className="text-muted" /> Community Image <span className="text-muted font-normal">(Optional)</span>
          </label>
          <p className="text-xs text-muted mb-3">Upload a photo to represent your community. If skipped, a text icon will be used.</p>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-4">
            <div 
              className="relative w-16 h-16 rounded-lg border-2 border-dashed border-hairline hover:border-accent hover:bg-subtle transition-colors flex items-center justify-center cursor-pointer overflow-hidden group shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload community image"
            >
              {iconPreview ? (
                <img src={iconPreview} alt="Community preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted group-hover:text-accent font-medium text-sm text-center px-2 leading-tight">Add Photo</span>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Upload Image
            </button>
            {iconPreview && (
              <button
                type="button"
                onClick={() => { setIconFile(null); setIconPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors ml-2"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-hairline flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-md font-medium text-muted hover:bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="px-6 py-2 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting || mutation.isPending ? 'Creating...' : 'Create Community'}
          </button>
        </div>
      </form>
    </div>
  );
}

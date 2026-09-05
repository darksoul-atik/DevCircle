import { useState, useRef } from 'react';
import { FiX, FiUpload, FiImage } from 'react-icons/fi';
import client from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

interface EditCommunityModalProps {
  community: {
    name: string;
    description?: string;
    slug: string;
    icon?: string;
  };
  onClose: () => void;
}

export default function EditCommunityModal({ community, onClose }: EditCommunityModalProps) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || '');
  const [iconPreview, setIconPreview] = useState<string | null>(
    community.icon ? `http://localhost:3000${community.icon}` : null
  );
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (name !== community.name) formData.append('name', name);
      if (description !== community.description) formData.append('description', description);
      if (iconFile) formData.append('icon', iconFile);

      // Only send request if there's something to update
      let updatedSlug = community.slug;
      if (Array.from(formData.keys()).length > 0) {
        const res = await client.put(`/communities/${community.slug}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updatedSlug = res.data.data.slug;
      }

      await queryClient.invalidateQueries({ queryKey: ['community', community.slug] });
      await queryClient.invalidateQueries({ queryKey: ['community', updatedSlug] });
      await queryClient.invalidateQueries({ queryKey: ['communities'] });
      
      onClose();
      
      // If slug changed, we need to redirect, but since we rely on Outlet we'll just reload for now
      if (updatedSlug !== community.slug) {
        window.location.href = `/communities/${updatedSlug}`;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-xl border border-hairline overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-hairline">
          <h2 className="text-xl font-display font-bold text-primary">Edit Community</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-primary hover:bg-subtle rounded-full transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-24 h-24 rounded-2xl bg-subtle flex items-center justify-center overflow-hidden border border-hairline cursor-pointer relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {iconPreview ? (
                  <img src={iconPreview} alt="Icon preview" className="w-full h-full object-cover" />
                ) : (
                  <FiImage size={32} className="text-muted" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiUpload size={24} className="text-white" />
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Change Icon
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-background border border-hairline rounded-lg text-primary focus:outline-none focus:border-accent transition-colors"
                placeholder="Community Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-hairline rounded-lg text-primary focus:outline-none focus:border-accent transition-colors min-h-[100px] resize-y"
                placeholder="What is this community about?"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

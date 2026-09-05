import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { FiPlus, FiTrash2, FiBriefcase, FiCode, FiEdit2 } from 'react-icons/fi';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

interface Skill {
  id: string;
  name: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  from: string;
  to: string | null;
  description: string | null;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  title: string | null;
  bio: string | null;
  skills: Skill[];
  experiences: Experience[];
}

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-pulse">
      <div className="border-b border-hairline pb-8 mb-8">
        <div className="h-10 w-48 bg-subtle rounded mb-2"></div>
        <div className="h-4 w-32 bg-subtle rounded mb-4"></div>
        <div className="h-16 w-full max-w-lg bg-subtle rounded"></div>
      </div>
      <div className="space-y-12">
        <div>
          <div className="h-6 w-24 bg-subtle rounded mb-4"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-subtle rounded"></div>
            <div className="h-8 w-24 bg-subtle rounded"></div>
            <div className="h-8 w-16 bg-subtle rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skillName, setSkillName] = useState('');
  const [exp, setExp] = useState({ title: '', company: '', startDate: '', endDate: '', description: '' });
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setAvatar(dataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await client.get('/profile/me');
      setBio(res.data.data.bio || '');
      setName(res.data.data.name);
      setTitle(res.data.data.title || '');
      setAvatar(res.data.data.avatar || '');
      return res.data.data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: () => client.put('/profile/me', { name, title: title || null, bio, avatar: avatar || null }),
    onSuccess: () => {
      // Optimistic update of profile
      queryClient.setQueryData(['profile'], (old: any) => ({ ...old, name, title: title || null, bio, avatar: avatar || null }));
      // Update AuthContext user
      updateUser({ name, avatar: avatar || undefined });
      setIsEditingHeader(false);
    }
  });

  const addSkill = useMutation({
    mutationFn: () => client.post('/profile/skills', { name: skillName }),
    onSuccess: (res) => {
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return { ...old, skills: [...old.skills, res.data.data] };
      });
      setSkillName('');
    }
  });

  const deleteSkill = useMutation({
    mutationFn: (id: string) => client.delete(`/profile/skills/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return { ...old, skills: old.skills.filter((s: any) => s.id !== id) };
      });
    }
  });

  const addExp = useMutation({
    mutationFn: () => client.post('/profile/experiences', exp),
    onSuccess: (res) => {
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return { ...old, experiences: [res.data.data, ...old.experiences] };
      });
      setExp({ title: '', company: '', startDate: '', endDate: '', description: '' });
    }
  });

  const editExp = useMutation({
    mutationFn: () => client.put(`/profile/experiences/${editingExpId}`, exp),
    onSuccess: (res) => {
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return { ...old, experiences: old.experiences.map((e: any) => e.id === editingExpId ? res.data.data : e) };
      });
      setExp({ title: '', company: '', startDate: '', endDate: '', description: '' });
      setEditingExpId(null);
    }
  });

  const deleteExp = useMutation({
    mutationFn: (id: string) => client.delete(`/profile/experiences/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return { ...old, experiences: old.experiences.filter((e: any) => e.id !== id) };
      });
    }
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return <div className="p-12 text-center text-muted font-mono text-sm">Failed to load profile data.</div>;

  const handleName = profile.name.toLowerCase().replace(/\s/g, '');

  return (
    <div className="w-full py-12 px-4 md:px-8">
      {/* Header Band */}
      <header className="bg-subtle/40 backdrop-blur-md border border-hairline rounded-2xl p-6 md:p-10 mb-8 shadow-sm relative">
        {isEditingHeader ? (
          <div className="max-w-lg space-y-4">
            <div className="flex flex-col mb-4">
              <label className="block text-sm font-medium text-accent mb-2 uppercase tracking-wider">Profile Picture</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-4">
                <div 
                  className="relative w-16 h-16 rounded-full border-2 border-dashed border-hairline hover:border-accent hover:bg-subtle transition-colors flex items-center justify-center cursor-pointer overflow-hidden group shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload new picture"
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <FiPlus className="text-muted group-hover:text-accent" />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  Change Picture
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-accent mb-1 uppercase tracking-wider">Display Name</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle focus:border-accent focus:outline-none text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-accent mb-1 uppercase tracking-wider">Title</label>
              <input 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle focus:border-accent focus:outline-none text-primary mb-4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-accent mb-1 uppercase tracking-wider">Bio</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle focus:border-accent focus:outline-none text-primary resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => updateProfile.mutate()}
                disabled={updateProfile.isPending}
                className="text-sm bg-accent text-white px-4 py-1.5 rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {updateProfile.isPending ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => {
                  setName(profile.name);
                  setTitle(profile.title || '');
                  setAvatar(profile.avatar || '');
                  setBio(profile.bio || '');
                  setIsEditingHeader(false);
                }}
                className="text-sm border border-hairline px-4 py-1.5 rounded-md hover:bg-subtle transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group max-w-2xl flex gap-6 items-start">
            <Avatar name={profile.name} url={profile.avatar} size="lg" className="w-20 h-20 text-3xl shrink-0" />
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary tracking-tight mb-1">{profile.name}</h1>
              <p className="font-mono text-sm text-muted mb-4">{profile.title || `@${handleName}`}</p>
              <p className="text-base text-primary leading-relaxed max-w-xl">
                {profile.bio || <span className="text-muted italic text-sm">No bio provided.</span>}
              </p>
            </div>
            <button 
              onClick={() => setIsEditingHeader(true)}
              className="absolute bottom-6 right-6 md:bottom-10 md:right-10 text-sm font-medium border border-hairline px-3 py-1 rounded hover:bg-subtle text-muted hover:text-primary transition-colors"
            >
              Edit Profile
            </button>
          </div>
        )}
      </header>

      {/* Skills Section */}
      <section className="bg-subtle/40 backdrop-blur-md border border-hairline rounded-2xl p-6 md:p-10 mb-8 shadow-sm">
        <h2 className="text-xl font-display font-medium text-accent mb-6 flex items-center gap-2">
          <FiCode className="text-accent" /> Skills
        </h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.skills.length === 0 ? (
            <span className="text-sm text-muted">No skills added yet.</span>
          ) : (
            profile.skills.map(skill => (
              <span 
                key={skill.id} 
                className="group flex items-center gap-2 px-3 py-1 text-sm bg-subtle border border-hairline rounded-md text-primary"
              >
                {skill.name}
                <button 
                  onClick={() => deleteSkill.mutate(skill.id)} 
                  className="text-muted opacity-0 group-hover:opacity-100 hover:text-signal transition-all"
                  title="Remove skill"
                >
                  <FiTrash2 size={13} />
                </button>
              </span>
            ))
          )}
        </div>
        
        <div className="flex gap-2 max-w-sm">
          <input 
            value={skillName} 
            onChange={e => setSkillName(e.target.value)}
            placeholder="E.g. TypeScript, React..."
            className="flex-1 px-3 py-1.5 border border-hairline rounded-md bg-subtle text-sm focus:border-accent focus:outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && skillName.trim()) {
                e.preventDefault();
                addSkill.mutate();
              }
            }}
          />
          <button 
            onClick={() => { if(skillName.trim()) addSkill.mutate() }}
            disabled={!skillName.trim() || addSkill.isPending}
            className="px-3 py-1.5 border border-hairline rounded-md hover:bg-subtle disabled:opacity-50 transition-colors flex items-center justify-center"
            title="Add Skill"
          >
            <FiPlus size={16} />
          </button>
        </div>
      </section>

      {/* Experience Section (Timeline) */}
      <section className="bg-subtle/40 backdrop-blur-md border border-hairline rounded-2xl p-6 md:p-10 mb-8 shadow-sm">
        <h2 className="text-xl font-display font-medium text-accent mb-8 flex items-center gap-2">
          <FiBriefcase className="text-accent" /> Experience
        </h2>
        
        <div className="mb-10 relative">
          {profile.experiences.length === 0 ? (
            <p className="text-sm text-muted">No experience entries added.</p>
          ) : (
            <div className="space-y-8">
              {profile.experiences.map((e) => (
                <div key={e.id} className="relative pl-6 group">
                  {/* Timeline connector and dot */}
                  <div className="absolute left-[3px] top-2 bottom-[-24px] w-px bg-hairline last:hidden"></div>
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full border border-primary bg-base"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-medium text-primary">{e.title}</h3>
                      <p className="font-mono text-sm text-muted mb-2">
                        {e.company} · {new Date(e.from).toLocaleDateString('default', { month: 'short', year: 'numeric' })} - {e.to ? new Date(e.to).toLocaleDateString('default', { month: 'short', year: 'numeric' }) : 'Present'}
                      </p>
                      {e.description && (
                        <p className="text-sm text-primary leading-relaxed max-w-2xl">{e.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingExpId(e.id);
                          setExp({
                            title: e.title,
                            company: e.company,
                            startDate: e.from.split('T')[0],
                            endDate: e.to ? e.to.split('T')[0] : '',
                            description: e.description || ''
                          });
                        }}
                        className="text-muted opacity-0 group-hover:opacity-100 hover:text-accent transition-opacity"
                        title="Edit Experience"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteExp.mutate(e.id)} 
                        className="text-muted opacity-0 group-hover:opacity-100 hover:text-signal transition-opacity"
                        title="Delete Experience"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Add/Edit Experience Form */}
        <div className="pt-8 mt-8 border-t border-hairline">
          <h3 className="text-sm font-medium text-muted mb-4 uppercase tracking-wider">{editingExpId ? 'Edit Experience' : 'Add Experience'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="sr-only">Job Title</label>
              <input value={exp.title} onChange={e => setExp({...exp, title: e.target.value})} placeholder="Job Title" className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm focus:border-accent focus:outline-none"/>
            </div>
            <div>
              <label className="sr-only">Company</label>
              <input value={exp.company} onChange={e => setExp({...exp, company: e.target.value})} placeholder="Company" className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm focus:border-accent focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Start Date</label>
              <input type="date" value={exp.startDate} onChange={e => setExp({...exp, startDate: e.target.value})} className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm text-primary focus:border-accent focus:outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">End Date (leave blank if current)</label>
              <input type="date" value={exp.endDate} onChange={e => setExp({...exp, endDate: e.target.value})} className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm text-primary focus:border-accent focus:outline-none"/>
            </div>
          </div>
          <div className="mb-4">
            <label className="sr-only">Description</label>
            <textarea value={exp.description} onChange={e => setExp({...exp, description: e.target.value})} placeholder="Role description & achievements..." className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm resize-none focus:border-accent focus:outline-none" rows={3}/>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              {editingExpId && (
                <button 
                  onClick={() => {
                    setEditingExpId(null);
                    setExp({ title: '', company: '', startDate: '', endDate: '', description: '' });
                  }}
                  className="px-4 py-2 border border-hairline rounded-md hover:bg-subtle transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => {
                  if(exp.title && exp.company && exp.startDate) {
                    if (editingExpId) {
                      editExp.mutate();
                    } else {
                      addExp.mutate();
                    }
                  }
                }}
                disabled={!exp.title || !exp.company || !exp.startDate || addExp.isPending || editExp.isPending}
                className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
              >
                {editingExpId ? 'Save Changes' : 'Add Experience'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

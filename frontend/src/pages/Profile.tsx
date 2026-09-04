import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { FiPlus, FiTrash2, FiBriefcase, FiCode } from 'react-icons/fi';

interface Skill {
  id: string;
  name: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
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
  const queryClient = useQueryClient();
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [exp, setExp] = useState({ title: '', company: '', startDate: '', endDate: '', description: '' });
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await client.get('/profile/me');
      setBio(res.data.data.bio || '');
      setName(res.data.data.name);
      return res.data.data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: () => client.put('/profile/me', { name, bio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditingHeader(false);
    }
  });

  const addSkill = useMutation({
    mutationFn: () => client.post('/profile/skills', { name: skillName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSkillName('');
    }
  });

  const deleteSkill = useMutation({
    mutationFn: (id: string) => client.delete(`/profile/skills/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] })
  });

  const addExp = useMutation({
    mutationFn: () => client.post('/profile/experiences', exp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setExp({ title: '', company: '', startDate: '', endDate: '', description: '' });
    }
  });

  const deleteExp = useMutation({
    mutationFn: (id: string) => client.delete(`/profile/experiences/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] })
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return <div className="p-12 text-center text-muted font-mono text-sm">Failed to load profile data.</div>;

  const handleName = profile.name.toLowerCase().replace(/\s/g, '');

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Header Band */}
      <header className="border-b border-hairline pb-10 mb-10">
        {isEditingHeader ? (
          <div className="max-w-lg space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Display Name</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle focus:border-accent focus:outline-none text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted mb-1 uppercase tracking-wider">Bio</label>
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
          <div className="group relative max-w-2xl">
            <h1 className="text-4xl font-display font-bold text-primary tracking-tight mb-1">{profile.name}</h1>
            <p className="font-mono text-sm text-muted mb-4">@{handleName}</p>
            <p className="text-base text-primary leading-relaxed max-w-xl">
              {profile.bio || <span className="text-muted italic text-sm">No bio provided.</span>}
            </p>
            <button 
              onClick={() => setIsEditingHeader(true)}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium border border-hairline px-3 py-1 rounded hover:bg-subtle"
            >
              Edit Profile
            </button>
          </div>
        )}
      </header>

      {/* Skills Section */}
      <section className="mb-14">
        <h2 className="text-xl font-display font-medium text-primary mb-6 flex items-center gap-2">
          <FiCode className="text-muted" /> Skills
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
      <section>
        <h2 className="text-xl font-display font-medium text-primary mb-8 flex items-center gap-2">
          <FiBriefcase className="text-muted" /> Experience
        </h2>
        
        <div className="mb-10 relative">
          {profile.experiences.length === 0 ? (
            <p className="text-sm text-muted">No experience entries added.</p>
          ) : (
            <div className="space-y-8">
              {profile.experiences.map((e, index) => (
                <div key={e.id} className="relative pl-6 group">
                  {/* Timeline connector and dot */}
                  <div className="absolute left-[3px] top-2 bottom-[-24px] w-px bg-hairline last:hidden"></div>
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full border border-primary bg-base"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-medium text-primary">{e.title}</h3>
                      <p className="font-mono text-sm text-muted mb-2">
                        {e.company} · {new Date(e.startDate).getFullYear()} - {e.endDate ? new Date(e.endDate).getFullYear() : 'Present'}
                      </p>
                      {e.description && (
                        <p className="text-sm text-primary leading-relaxed max-w-2xl">{e.description}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteExp.mutate(e.id)} 
                      className="text-muted opacity-0 group-hover:opacity-100 hover:text-signal transition-opacity"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Add Experience Form */}
        <div className="pt-8 border-t border-hairline max-w-2xl">
          <h3 className="text-sm font-mono text-muted mb-4 uppercase tracking-wider">Add Experience</h3>
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
              <label className="block text-xs font-mono text-muted mb-1">Start Date</label>
              <input type="date" value={exp.startDate} onChange={e => setExp({...exp, startDate: e.target.value})} className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm text-primary focus:border-accent focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted mb-1">End Date (leave blank if current)</label>
              <input type="date" value={exp.endDate} onChange={e => setExp({...exp, endDate: e.target.value})} className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm text-primary focus:border-accent focus:outline-none"/>
            </div>
          </div>
          <div className="mb-4">
            <label className="sr-only">Description</label>
            <textarea value={exp.description} onChange={e => setExp({...exp, description: e.target.value})} placeholder="Role description & achievements..." className="w-full px-3 py-2 border border-hairline rounded-md bg-subtle text-sm resize-none focus:border-accent focus:outline-none" rows={3}/>
          </div>
          <button 
            onClick={() => { if(exp.title && exp.company && exp.startDate) addExp.mutate() }}
            disabled={!exp.title.trim() || !exp.company.trim() || !exp.startDate || addExp.isPending}
            className="text-sm border border-hairline px-4 py-2 rounded-md hover:bg-subtle disabled:opacity-50 transition-colors"
          >
            {addExp.isPending ? 'Adding...' : 'Add to timeline'}
          </button>
        </div>
      </section>
    </div>
  );
}

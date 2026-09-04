import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { Plus, Trash2 } from 'lucide-react';

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

export default function Profile() {
  const queryClient = useQueryClient();
  const [bio, setBio] = useState('');
  const [name, setName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [exp, setExp] = useState({ title: '', company: '', startDate: '', endDate: '', description: '' });

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] })
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

  if (isLoading) return <div className="p-8 max-w-3xl mx-auto animate-pulse bg-gray-200 dark:bg-gray-800 h-64 rounded-lg"></div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
              rows={3}
            />
          </div>
          <button 
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.skills.map(skill => (
            <span key={skill.id} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {skill.name}
              <button onClick={() => deleteSkill.mutate(skill.id)} className="hover:text-red-500"><Trash2 size={14}/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            value={skillName} 
            onChange={e => setSkillName(e.target.value)}
            placeholder="Add a skill"
            className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent text-sm"
          />
          <button 
            onClick={() => { if(skillName) addSkill.mutate() }}
            disabled={!skillName || addSkill.isPending}
            className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1"
          >
            <Plus size={16}/> Add
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Experiences</h2>
        <div className="space-y-4 mb-8">
          {profile.experiences.map(e => (
            <div key={e.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{e.title} at {e.company}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(e.startDate).toLocaleDateString()} - {e.endDate ? new Date(e.endDate).toLocaleDateString() : 'Present'}
                </p>
                {e.description && <p className="text-sm mt-2">{e.description}</p>}
              </div>
              <button onClick={() => deleteExp.mutate(e.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={18}/>
              </button>
            </div>
          ))}
        </div>
        
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="font-medium">Add New Experience</h3>
          <div className="grid grid-cols-2 gap-4">
            <input value={exp.title} onChange={e => setExp({...exp, title: e.target.value})} placeholder="Job Title" className="p-2 border rounded-md bg-transparent text-sm"/>
            <input value={exp.company} onChange={e => setExp({...exp, company: e.target.value})} placeholder="Company" className="p-2 border rounded-md bg-transparent text-sm"/>
            <input type="date" value={exp.startDate} onChange={e => setExp({...exp, startDate: e.target.value})} className="p-2 border rounded-md bg-transparent text-sm"/>
            <input type="date" value={exp.endDate} onChange={e => setExp({...exp, endDate: e.target.value})} className="p-2 border rounded-md bg-transparent text-sm"/>
          </div>
          <textarea value={exp.description} onChange={e => setExp({...exp, description: e.target.value})} placeholder="Description (Optional)" className="w-full p-2 border rounded-md bg-transparent text-sm" rows={2}/>
          <button 
            onClick={() => { if(exp.title && exp.company && exp.startDate) addExp.mutate() }}
            disabled={!exp.title || !exp.company || !exp.startDate || addExp.isPending}
            className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Add Experience
          </button>
        </div>
      </div>
    </div>
  );
}

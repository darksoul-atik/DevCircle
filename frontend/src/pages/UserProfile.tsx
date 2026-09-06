import { useQuery } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import client from '../api/client';
import { FiBriefcase, FiCode } from 'react-icons/fi';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';

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

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: profile, isLoading, isError } = useQuery<ProfileData>({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const res = await client.get(`/profile/user/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // If the user clicks on their own ID, redirect to their editable profile
  if (id === user?.id) {
    return <Navigate to="/profile/me" replace />;
  }
  if (isLoading) return <ProfileSkeleton />;
  if (isError || !profile) return <div className="max-w-3xl mx-auto py-12 px-4 text-center text-muted">User not found.</div>;

  return (
    <div className="w-full py-12 px-4 md:px-8">
      <Helmet>
        <title>{profile.name} | DevCircle</title>
        {profile.avatar && (
          <link rel="icon" type="image/png" href={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${profile.avatar}` : `http://localhost:3000${profile.avatar}`} />
        )}
      </Helmet>
      {/* Header Band */}
      <header className="bg-subtle/40 backdrop-blur-md border border-hairline rounded-2xl p-6 md:p-10 mb-8 shadow-sm relative">
        <div className="max-w-3xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-6">
            <Avatar name={profile.name} url={profile.avatar} size="lg" className="w-16 h-16 md:w-20 md:h-20 text-3xl shadow-sm" />
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary mb-1 tracking-tight">{profile.name}</h1>
              {profile.title && (
                <div className="text-accent font-medium text-lg flex items-center gap-2">
                  {profile.title}
                </div>
              )}
            </div>
          </div>
          
          {profile.bio && (
            <p className="text-muted text-base max-w-2xl leading-relaxed mt-4">
              {profile.bio}
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Experience Section */}
          <section className="bg-base rounded-2xl border border-hairline p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-hairline">
              <FiBriefcase className="text-accent text-xl" />
              <h2 className="text-xl font-display font-bold text-primary tracking-tight">Experience</h2>
            </div>
            
            <div className="space-y-6">
              {profile.experiences.length === 0 ? (
                <p className="text-muted text-sm italic">No experience added yet.</p>
              ) : (
                profile.experiences.map((e) => (
                  <div key={e.id} className="relative pl-6 border-l-2 border-subtle">
                    <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_var(--bg-base)]"></div>
                    <div className="mb-1">
                      <h3 className="text-lg font-semibold text-primary">{e.title}</h3>
                      <div className="text-accent font-medium text-sm">{e.company}</div>
                    </div>
                    <div className="text-xs text-muted font-medium mb-3 tracking-wide uppercase">
                      {new Date(e.from).getFullYear()} - {e.to ? new Date(e.to).getFullYear() : 'Present'}
                    </div>
                    {e.description && <p className="text-sm text-muted leading-relaxed">{e.description}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Skills Section */}
          <section className="bg-base rounded-2xl border border-hairline p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-hairline">
              <FiCode className="text-accent text-xl" />
              <h2 className="text-xl font-display font-bold text-primary tracking-tight">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.skills.length === 0 ? (
                <p className="text-muted text-sm italic">No skills added yet.</p>
              ) : (
                profile.skills.map((s) => (
                  <div 
                    key={s.id} 
                    className="group flex items-center gap-2 bg-subtle border border-hairline px-3 py-1.5 rounded-md text-sm text-primary font-medium hover:border-accent transition-colors shadow-sm"
                  >
                    <span>{s.name}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

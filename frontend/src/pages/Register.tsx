import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FiArrowRight, FiEye, FiEyeOff, FiAlertCircle, FiUpload, FiX } from 'react-icons/fi';
import { Logo, DarkModeToggle } from '../components/Layout';
import AnimatedBackground from '../components/AnimatedBackground';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Register() {
  const { isDark, toggleDarkMode } = useDarkMode();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Stagger typography and form
    tl.fromTo('.hero-text-line', 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
    );
    
    tl.fromTo('.hero-form',
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
      "-=0.4"
    );

    // Subtle graph motif animation (opacity fade in)
    tl.fromTo('.bg-motif',
      { opacity: 0 },
      { opacity: 1, duration: 1.5, ease: 'power2.inOut' },
      "-=0.6"
    );

  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic password validation
    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters long and include a number.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { name, email, password };
      if (avatar) {
        payload.avatar = avatar;
      } else {
        payload.avatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name || 'Dev')}&backgroundColor=transparent`;
      }
      const res = await client.post('/auth/register', payload);
      login(res.data.data.accessToken, res.data.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-[calc(100vh-4rem)] flex flex-col justify-center relative overflow-hidden bg-base transition-colors duration-200">
      <div className="absolute top-6 right-6 z-50">
        <DarkModeToggle isDark={isDark} toggle={toggleDarkMode} />
      </div>

      {/* Particles Background */}
      <AnimatedBackground />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10 py-12 md:py-0">
        {/* Left Column: Hero Copy */}
        <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left">
          <div className="mb-8 md:mb-10 hero-text-line flex justify-center md:justify-start">
            <Logo iconSize={40} textSizeClass="text-4xl md:text-5xl" />
          </div>
          <div className="hero-text-line overflow-hidden">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-primary tracking-tight leading-tight mb-2">
              Code. Connect.
            </h1>
          </div>
          <div className="hero-text-line overflow-hidden">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-primary tracking-tight leading-tight mb-4 md:mb-6">
              Conquer.
            </h1>
          </div>
          <div className="hero-text-line">
            <p className="text-base sm:text-lg text-muted leading-relaxed font-sans mb-8">
              The developer community you've been waiting for. Skip the noise, join the discussion, and share the signal.
            </p>
          </div>
        </div>

        {/* Right Column: Auth Form */}
        <div className="hero-form mx-auto md:ml-auto max-w-sm w-full bg-subtle/50 backdrop-blur-sm border border-hairline p-6 sm:p-8 rounded-xl shadow-sm">
          <h2 className="text-xl md:text-2xl font-display font-medium text-primary mb-6 text-center md:text-left">Create an account</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-sm font-medium border border-red-500/20 flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center justify-center mb-6">
              <label className="block text-sm font-medium text-accent mb-3 uppercase tracking-wider">Upload Profile Picture</label>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div 
                className="relative w-20 h-20 rounded-full border-2 border-dashed border-hairline hover:border-accent hover:bg-subtle transition-colors flex items-center justify-center cursor-pointer overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatar ? (
                  <>
                    <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FiUpload className="text-white" size={20} />
                    </div>
                  </>
                ) : (
                  <div className="text-muted flex flex-col items-center">
                    <FiUpload size={20} className="mb-1 group-hover:text-accent transition-colors" />
                    <span className="text-[10px] font-mono uppercase tracking-wider group-hover:text-accent transition-colors">Upload</span>
                  </div>
                )}
              </div>
              {avatar && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setAvatar(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="mt-2 text-xs text-muted hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <FiX /> Remove
                </button>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-accent mb-1.5 uppercase tracking-wider">Display Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-hairline rounded-md bg-base text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2 border border-hairline rounded-md bg-base text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-4 pr-10 py-2 border border-hairline rounded-md bg-base text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-accent text-white py-2.5 rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors font-medium flex justify-center items-center gap-2 group"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
              {!loading && <FiArrowRight className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-hairline text-center">
            <p className="text-sm font-medium text-muted">
              Already have an account? <Link to="/login" className="text-primary font-medium hover:text-accent transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

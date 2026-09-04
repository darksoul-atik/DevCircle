import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FiArrowRight, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { Logo } from '../components/Layout';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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
      const res = await client.post('/auth/login', { email, password });
      login(res.data.data.accessToken, res.data.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-[calc(100vh-4rem)] flex flex-col justify-center relative overflow-hidden">
      {/* Background Motif */}
      <div className="bg-motif absolute top-0 right-0 bottom-0 left-1/2 -z-10 pointer-events-none hidden md:block">
        <svg viewBox="0 0 800 600" className="w-full h-full opacity-10 stroke-primary/30" preserveAspectRatio="none">
          <path d="M0,500 Q100,450 200,480 T400,300 T600,200 T800,100" fill="none" strokeWidth="2" />
          <path d="M0,550 Q150,550 250,500 T500,400 T700,250 T800,180" fill="none" strokeWidth="1" />
          <path d="M0,580 Q200,580 300,530 T600,450 T800,280" fill="none" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column: Hero Copy */}
        <div className="max-w-lg">
          <div className="mb-10 hero-text-line">
            <Logo iconSize={48} textSizeClass="text-5xl" />
          </div>
          <div className="hero-text-line overflow-hidden">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-primary tracking-tight leading-tight mb-2">
              Code. Connect.
            </h1>
          </div>
          <div className="hero-text-line overflow-hidden">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-primary tracking-tight leading-tight mb-6">
              Conquer.
            </h1>
          </div>
          <div className="hero-text-line">
            <p className="text-lg text-muted leading-relaxed font-sans mb-8">
              The developer community you've been waiting for. Skip the noise, join the discussion, and share the signal.
            </p>
          </div>
        </div>

        {/* Right Column: Auth Form */}
        <div className="hero-form max-w-sm w-full bg-subtle/50 backdrop-blur-sm border border-hairline p-8 rounded-xl shadow-sm">
          <h2 className="text-xl font-display font-medium text-primary mb-6">Sign in to your account</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-sm font-medium border border-red-500/20 flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2 border border-hairline rounded-md bg-base text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted mb-1.5 uppercase tracking-wider">Password</label>
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
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <FiArrowRight className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-hairline text-center">
            <p className="text-sm font-mono text-muted">
              Don't have an account? <Link to="/register" className="text-primary font-medium hover:text-accent transition-colors">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

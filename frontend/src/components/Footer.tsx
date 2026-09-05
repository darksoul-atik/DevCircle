import { Link } from 'react-router-dom';
import { Logo } from './Layout';

export default function Footer() {
  return (
    <footer className="w-full bg-indigo-400 dark:bg-indigo-950/20 border-t border-hairline mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Logo iconSize={20} textSizeClass="text-lg" />
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} DevCircle. All rights reserved.
          </p>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link to="#" className="hover:text-accent transition-colors">About</Link>
          <Link to="#" className="hover:text-accent transition-colors">Privacy Policy</Link>
          <Link to="#" className="hover:text-accent transition-colors">Terms of Service</Link>
          <Link to="#" className="hover:text-accent transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

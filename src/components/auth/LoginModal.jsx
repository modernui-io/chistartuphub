import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithOAuth } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      console.error('Login error details:', error);

      // Provide better error messages
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before signing in. Check your inbox for a confirmation link.';
      }

      toast.error('Login failed', {
        description: errorMessage,
      });
    } else {
      toast.success('Welcome back!', {
        description: 'Successfully logged in',
      });
      setEmail('');
      setPassword('');
      onClose();
    }

    setLoading(false);
  };

  const handleOAuthLogin = async (provider) => {
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast.error('Login failed', {
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0F0F0F] border border-white/10 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl uppercase tracking-[0.1em] text-white">
            Welcome Back
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-white/50 uppercase tracking-[0.05em]">
            Sign in to access your bookmarks and personalized experience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEmailLogin} className="space-y-4 mt-4">
          <div>
            <label htmlFor="email" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-white/10 py-3 px-4 pr-10 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-none duration-0 cursor-crosshair"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border border-current border-t-transparent animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#0F0F0F] px-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          className="w-full flex items-center justify-center gap-3 font-mono text-[12px] uppercase tracking-[0.1em] px-6 py-4 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair rounded-none"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center font-mono text-[11px] text-white/50 mt-4">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-white hover:text-white/70 uppercase tracking-[0.1em] transition-none duration-0 cursor-crosshair"
          >
            Sign up
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}

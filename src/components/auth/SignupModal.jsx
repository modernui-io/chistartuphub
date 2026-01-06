import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bookmark, Shield, Eye, EyeOff, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'founder', label: 'Founder', description: 'Building a startup' },
  { value: 'helper', label: 'Helper', description: 'Investor, mentor, service provider, or supporter' },
];

export default function SignupModal({ isOpen, onClose, onSwitchToLogin, onSignupComplete }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithOAuth, updateProfile } = useAuth();

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setEmail('');
    setPassword('');
    setRole('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();

    try {
      // Sign up
      const { data, error: signUpError } = await signUp(email, password, {
        full_name: fullName,
      });

      if (signUpError) {
        toast.error('Signup failed', {
          description: signUpError.message,
        });
        setLoading(false);
        return;
      }

      // Create profile - even if email confirmation is required, we want to store profile data
      if (data?.user) {
        const { error: profileError } = await updateProfile({
          email,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          company_name: companyName || null,
          role,
          verification_status: 'none', // vetting happens later when posting
        });

        if (profileError) {
          toast.error('Profile creation failed', {
            description: profileError.message,
          });
        }
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = data?.user && !data.session;

      if (needsEmailConfirmation) {
        // Show toast and close modal
        toast.success('Check your email!', {
          description: 'We sent you a confirmation link. Click it to activate your account.',
        });
        setLoading(false);
        resetForm();
        onClose();
      } else {
        // Trigger welcome modal instead of simple toast
        if (onSignupComplete) {
          onSignupComplete({ name: fullName, role: role });
        }

        // Navigate to home - welcome modal will guide them
        navigate('/');
        setLoading(false);
        resetForm();
        onClose();
      }
    } catch (error) {
      toast.error('Signup failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider) => {
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast.error('Signup failed', {
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-md bg-[#0F0F0F] border border-white/10 rounded-none">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl uppercase tracking-[0.1em] text-white">
            Create Account
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-white/50 uppercase tracking-[0.05em]">
            Join ChiStartupHub - takes 30 seconds
          </DialogDescription>
        </DialogHeader>

        {/* Privacy & Benefits Info - Bureau Style */}
        <div className="border border-white/10 p-4 mb-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-3 h-3 text-white/50" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/90">Save & Bookmark Resources</p>
                <p className="font-mono text-[10px] text-white/40">Easily save events, funding opportunities, and workspaces for later</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 border border-white/20 flex items-center justify-center flex-shrink-0">
                <MessageSquarePlus className="w-3 h-3 text-white/50" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/90">Post an Ask</p>
                <p className="font-mono text-[10px] text-white/40">Share what you need with Chicago's startup ecosystem and get help from the community</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3 h-3 text-white/50" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/90">Your Privacy Matters</p>
                <p className="font-mono text-[10px] text-white/40">We never share your data without permission</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              First Name *
            </label>
            <input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              Last Name *
            </label>
            <input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
              required
            />
          </div>

          {/* Company Name (Optional) */}
          <div>
            <label htmlFor="companyName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              Company Name
            </label>
            <input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="signup-email" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              Email *
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="signup-password" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-white/10 py-3 px-4 pr-10 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
                required
                minLength={6}
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
            <p className="font-mono text-[10px] text-white/30 mt-1">At least 6 characters</p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
              I am a... *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left px-3 py-2 border transition-none duration-0 cursor-crosshair rounded-none ${
                    role === r.value
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white/20 hover:border-white/40'
                  }`}
                >
                  <span className={`font-mono text-[10px] uppercase tracking-[0.1em] block ${
                    role === r.value ? 'text-black' : 'text-white/70'
                  }`}>
                    {r.label}
                  </span>
                  <span className={`font-mono text-[9px] block mt-0.5 leading-tight ${
                    role === r.value ? 'text-black/60' : 'text-white/40'
                  }`}>
                    {r.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !role}
            className={`w-full font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 border border-white transition-none duration-0 cursor-crosshair rounded-none ${
              role && !loading
                ? 'bg-white text-black hover:bg-transparent hover:text-white'
                : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border border-current border-t-transparent animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#0F0F0F] px-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">Or sign up with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOAuthSignup('google')}
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
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-white hover:text-white/70 uppercase tracking-[0.1em] transition-none duration-0 cursor-crosshair"
          >
            Sign in
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}

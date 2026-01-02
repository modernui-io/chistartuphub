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
import { Bookmark, Shield, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'founder', label: 'Founder / Entrepreneur' },
  { value: 'investor', label: 'Investor' },
  { value: 'service-provider', label: 'Service Provider' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
];

const STAGES = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'pre-revenue', label: 'Pre-Revenue' },
  { value: 'early-revenue', label: 'Early Revenue' },
  { value: 'growth', label: 'Growth Stage' },
  { value: 'scaling', label: 'Scaling' },
];

const INTERESTS = [
  'Capital/Funding',
  'Co-Working Spaces',
  'Networking Events',
  'Accelerators/Incubators',
  'Legal/Compliance',
  'Product Development',
  'Marketing/Growth',
  'Talent/Hiring',
];

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithOAuth, updateProfile } = useAuth();

  // Step 1: Email & Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Step 2: Company/Startup Details
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [stage, setStage] = useState('');
  
  // Founder vetting fields
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState([]);

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setPassword('');
    setFullName('');
    setCompanyName('');
    setRole('');
    setStage('');
    setLinkedinUrl('');
    setWebsiteUrl('');
    setSelectedInterests([]);
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting signup process...');

      // Sign up
      const { data, error: signUpError } = await signUp(email, password, {
        full_name: fullName,
      });

      console.log('Signup response:', { data, error: signUpError });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        toast.error('Signup failed', {
          description: signUpError.message,
        });
        setLoading(false);
        return;
      }

      // Create profile - even if email confirmation is required, we want to store profile data
      if (data?.user) {
        console.log('Creating profile for user:', data.user.id);
        const { error: profileError } = await updateProfile({
          email,
          full_name: fullName,
          company_name: companyName,
          role,
          stage,
          linkedin_url: linkedinUrl || null,
          website_url: websiteUrl || null,
          interests: selectedInterests,
          // Founders start with pending verification (48hr review)
          verification_status: role === 'founder' ? 'pending' : 'none',
          verification_submitted_at: role === 'founder' ? new Date().toISOString() : null,
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast.error('Profile creation failed', {
            description: profileError.message,
          });
        } else {
          console.log('Profile created successfully');
        }
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = data?.user && !data.session;

      if (needsEmailConfirmation) {
        toast.success('Check your email!', {
          description: 'We sent you a confirmation link. Please verify your email to complete signup.',
          duration: 8000,
        });
      } else {
        toast.success('Welcome to ChiStartupHub!', {
          description: 'Your account has been created successfully!',
        });
        
        // Route based on role: founders go to Asks page, others go home
        if (role === 'founder') {
          navigate('/ecosystem/founder-asks');
        } else {
          navigate('/');
        }
      }

      setLoading(false);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast.error('Signup failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
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
            {step === 1 && 'Create Account'}
            {step === 2 && 'Tell Us About You'}
            {step === 3 && 'Your Interests'}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-white/50 uppercase tracking-[0.05em]">
            {step === 1 && 'Join ChiStartupHub to bookmark resources and connect with the ecosystem'}
            {step === 2 && 'Help us personalize your experience'}
            {step === 3 && 'What are you looking for? (Optional)'}
          </DialogDescription>
        </DialogHeader>

        {/* Bureau Progress indicator - Square steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'ACCOUNT' },
              { num: 2, label: 'PROFILE' },
              { num: 3, label: 'INTERESTS' }
            ].map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center font-mono text-[11px] transition-none duration-0 border ${
                      step > s.num
                        ? 'bg-white text-black border-white'
                        : step === s.num
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-white/40 border-white/20'
                    }`}
                  >
                    {step > s.num ? (
                      <Check className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-[0.1em] mt-1.5 transition-none duration-0 ${step >= s.num ? 'text-white/80' : 'text-white/40'}`}>
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`w-12 sm:w-16 h-px mx-2 transition-none duration-0 ${
                      step > s.num ? 'bg-white' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <>
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
                    <Shield className="w-3 h-3 text-white/50" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/90">Your Privacy Matters</p>
                    <p className="font-mono text-[10px] text-white/40">We take your privacy seriously and never share your data without permission</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4 mt-4">
              <div>
                <label htmlFor="fullName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                  Email
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

              <div>
                <label htmlFor="signup-password" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                  Password
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

              <button
                type="submit"
                className="w-full font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair rounded-none"
              >
                Continue
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
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4 mt-4">
            <div>
              <label htmlFor="companyName" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                Company/Startup Name (Optional)
              </label>
              <input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
              />
            </div>

            <div>
              <label htmlFor="role" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                Role *
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border transition-none duration-0 cursor-crosshair rounded-none ${
                      role === r.value
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white/70'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {role === 'founder' && (
              <>
                {/* Founder Vetting Section */}
                <div className="p-3 border border-amber-500/30 bg-amber-500/5 mb-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber-400 mb-1">
                    Founder Verification
                  </p>
                  <p className="text-[11px] text-white/50">
                    To post asks, we need to verify you're a real founder. This helps maintain trust in our community.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="linkedinUrl" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    LinkedIn Profile URL *
                  </label>
                  <input
                    id="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="websiteUrl" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Company Website (Optional)
                  </label>
                  <input
                    id="websiteUrl"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full bg-transparent border border-white/10 py-3 px-4 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
                  />
                </div>
              
                <div>
                  <label htmlFor="stage" className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-2">
                    Startup Stage
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStage(s.value)}
                        className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-2 border transition-none duration-0 cursor-crosshair rounded-none ${
                          stage === s.value
                            ? 'bg-white text-black border-white'
                            : 'bg-transparent text-white/50 border-white/20 hover:border-white/40 hover:text-white/70'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-3 bg-transparent text-white hover:bg-white hover:text-black border border-white/10 hover:border-white transition-none duration-0 cursor-crosshair rounded-none"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                disabled={!role}
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 mt-4">
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border transition-none duration-0 cursor-crosshair rounded-none ${
                    selectedInterests.includes(interest)
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-white/70 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <div className={`w-4 h-4 border flex items-center justify-center transition-none duration-0 ${
                    selectedInterests.includes(interest)
                      ? 'border-black bg-black'
                      : 'border-white/30'
                  }`}>
                    {selectedInterests.includes(interest) && (
                      <Check className="w-3 h-3 text-white" strokeWidth={2} />
                    )}
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.05em]">
                    {interest}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-3 bg-transparent text-white hover:bg-white hover:text-black border border-white/10 hover:border-white transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border border-current border-t-transparent animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Complete Signup'
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/api/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bookmark, Shield, Eye, EyeOff, Check, MessageSquarePlus, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'founder', label: 'Founder / Entrepreneur', description: 'Building a startup or have a business idea' },
  { value: 'investor', label: 'Investor', description: 'Angel investor, VC, or looking to invest' },
  { value: 'service-provider', label: 'Service Provider', description: 'Offer services to startups (legal, accounting, marketing, etc.)' },
  { value: 'student', label: 'Student', description: 'Currently in school, exploring entrepreneurship' },
  { value: 'other', label: 'Other', description: 'Mentor, advisor, ecosystem supporter, or just exploring' },
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

export default function SignupModal({ isOpen, onClose, onSwitchToLogin, onSignupComplete }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithOAuth, updateProfile } = useAuth();

  // Step 1: Account + Role (combined for faster signup)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');

  // Founder vetting fields (shown inline when founder selected)
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [stage, setStage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Step 2: Interests (optional, can skip)
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Age verification
  const [isOver18, setIsOver18] = useState(false);

  // Email verification state (step 3)
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
    setIsOver18(false);
    setShowEmailVerification(false);
    setResendLoading(false);
    setResendCooldown(0);
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    // Validate founder fields if founder role selected
    if (role === 'founder' && !linkedinUrl) {
      toast.error('LinkedIn URL required for founders');
      return;
    }
    setStep(2);
  };

  // Skip interests and complete signup directly
  const handleSkipInterests = async () => {
    await handleFinalSubmit({ preventDefault: () => {} });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
          toast.error('Profile creation failed', {
            description: profileError.message,
          });
        }
      }

      // Check if email confirmation is required
      const needsEmailConfirmation = data?.user && !data.session;

      if (needsEmailConfirmation) {
        // Show in-modal email verification screen instead of just a toast
        setLoading(false);
        setShowEmailVerification(true);
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

  const toggleInterest = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  // Handle resending verification email
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast.error('Failed to resend email', {
          description: error.message,
        });
      } else {
        toast.success('Confirmation email resent!', {
          description: 'Please check your inbox and spam folder.',
        });
        // Start 60 second cooldown
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      toast.error('Failed to resend email', {
        description: 'An unexpected error occurred.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Handle closing after email verification screen
  const handleCloseAfterVerification = () => {
    resetForm();
    onClose();
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
            {showEmailVerification && 'Check Your Email'}
            {!showEmailVerification && step === 1 && 'Create Account'}
            {!showEmailVerification && step === 2 && 'Your Interests'}
          </DialogTitle>
          <DialogDescription className="font-mono text-[11px] text-white/50 uppercase tracking-[0.05em]">
            {showEmailVerification && 'One more step to activate your account'}
            {!showEmailVerification && step === 1 && 'Join ChiStartupHub — takes 30 seconds'}
            {!showEmailVerification && step === 2 && 'What are you looking for? (Optional — you can skip)'}
          </DialogDescription>
        </DialogHeader>

        {/* Bureau Progress indicator - 2 steps now (hidden during email verification) */}
        {!showEmailVerification && <div className="mb-6">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: 'ACCOUNT' },
              { num: 2, label: 'INTERESTS' }
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
                  <span className={`font-mono text-[10px] uppercase tracking-[0.1em] mt-1.5 transition-none duration-0 ${step >= s.num ? 'text-white/80' : 'text-white/40'}`}>
                    {s.label}
                  </span>
                </div>
                {index < 1 && (
                  <div
                    className={`w-16 sm:w-24 h-px mx-3 transition-none duration-0 ${
                      step > s.num ? 'bg-white' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>}

        {!showEmailVerification && step === 1 && (
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

              {/* Age Verification */}
              <div className="flex items-start gap-3 p-3 border border-white/10">
                <input
                  type="checkbox"
                  id="age-verification"
                  checked={isOver18}
                  onChange={(e) => setIsOver18(e.target.checked)}
                  className="mt-0.5 w-4 h-4 bg-transparent border border-white/30 rounded-none cursor-crosshair accent-white"
                  required
                />
                <label htmlFor="age-verification" className="font-mono text-[10px] text-white/60 leading-relaxed cursor-crosshair">
                  I confirm that I am <span className="text-white">18 years of age or older</span> and agree to the Terms of Service and Privacy Policy.
                </label>
              </div>

              {/* Role Selection - Inline */}
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

              {/* Founder fields - shown when founder selected */}
              {role === 'founder' && (
                <div className="space-y-3 p-3 border border-amber-500/30 bg-amber-500/5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber-400">
                    Founder Verification
                  </p>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-1">
                      LinkedIn Profile URL *
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full bg-transparent border border-white/10 py-2 px-3 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mb-1">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-transparent border border-white/10 py-2 px-3 font-mono text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-none duration-0 rounded-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isOver18 || !role}
                className={`w-full font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 border border-white transition-none duration-0 cursor-crosshair rounded-none ${
                  isOver18 && role
                    ? 'bg-white text-black hover:bg-transparent hover:text-white'
                    : 'bg-white/20 text-white/40 border-white/20 cursor-not-allowed'
                }`}
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

        {!showEmailVerification && step === 2 && (
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
                onClick={() => setStep(1)}
                className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-3 bg-transparent text-white hover:bg-white hover:text-black border border-white/10 hover:border-white transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSkipInterests}
                className="font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-3 bg-transparent text-white/50 hover:text-white border border-white/10 hover:border-white/30 transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                disabled={loading}
              >
                Skip
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
                  'Complete'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Email Verification Screen */}
        {showEmailVerification && (
          <div className="space-y-6 py-4">
            {/* Email Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 border border-white/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-white/70" strokeWidth={1.5} />
              </div>
            </div>

            {/* Main Message */}
            <div className="text-center space-y-3">
              <p className="font-mono text-[12px] text-white/90 leading-relaxed">
                We sent a confirmation link to:
              </p>
              <p className="font-mono text-[13px] text-white font-medium bg-white/5 border border-white/10 px-4 py-2 inline-block">
                {email}
              </p>
              <p className="font-mono text-[11px] text-white/50 leading-relaxed">
                Click the link in your email to activate your account.
              </p>
            </div>

            {/* Tips */}
            <div className="border border-white/10 p-4 space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                Did not receive it?
              </p>
              <ul className="space-y-1">
                <li className="font-mono text-[10px] text-white/60 flex items-start gap-2">
                  <span className="text-white/30">-</span>
                  Check your spam or junk folder
                </li>
                <li className="font-mono text-[10px] text-white/60 flex items-start gap-2">
                  <span className="text-white/30">-</span>
                  Make sure {email} is correct
                </li>
                <li className="font-mono text-[10px] text-white/60 flex items-start gap-2">
                  <span className="text-white/30">-</span>
                  Wait a few minutes and try again
                </li>
              </ul>
            </div>

            {/* Resend Button */}
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-transparent text-white border border-white/20 hover:border-white/40 transition-none duration-0 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed rounded-none flex items-center justify-center gap-2"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>Resend in {resendCooldown}s</>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend Confirmation Email
                </>
              )}
            </button>

            {/* Next Steps */}
            <div className="border-t border-white/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 mb-2">
                What happens next
              </p>
              <p className="font-mono text-[11px] text-white/70 leading-relaxed">
                After clicking the confirmation link, return to ChiStartupHub and sign in with your email and password.
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseAfterVerification}
              className="w-full font-mono text-[11px] uppercase tracking-[0.1em] px-6 py-3 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-none duration-0 cursor-crosshair rounded-none"
            >
              Got it, Close
            </button>

            {/* Switch to Login */}
            <p className="text-center font-mono text-[10px] text-white/40">
              Already confirmed?{' '}
              <button
                onClick={() => {
                  resetForm();
                  onSwitchToLogin();
                }}
                className="text-white hover:text-white/70 uppercase tracking-[0.1em] transition-none duration-0 cursor-crosshair"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

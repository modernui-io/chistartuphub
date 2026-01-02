import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function VerificationBanner() {
  const { profile } = useAuth();
  
  // Only show for founders
  if (!profile || profile.role !== 'founder') return null;
  
  // Don't show if verified or not applicable
  if (profile.verification_status === 'verified' || profile.verification_status === 'none') return null;
  
  // Pending verification
  if (profile.verification_status === 'pending') {
    return (
      <div className="bg-blue-500/10 border-b border-blue-500/20 py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
          <span className="font-mono text-[11px] text-blue-300 uppercase tracking-[0.05em]">
            Founder verification in progress — usually within 48 hours
          </span>
        </div>
      </div>
    );
  }
  
  // Flagged - needs attention
  if (profile.verification_status === 'flagged') {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          <span className="font-mono text-[11px] text-amber-300 uppercase tracking-[0.05em]">
            We need additional information to verify your founder status — check your email
          </span>
        </div>
      </div>
    );
  }
  
  return null;
}

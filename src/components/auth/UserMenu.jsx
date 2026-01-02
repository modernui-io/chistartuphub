import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Bookmark, LogOut } from 'lucide-react';

export default function UserMenu() {
  const { user, profile, signOut } = useAuth();

  // Get full name from profile or user metadata
  const fullName = profile?.full_name || user?.user_metadata?.full_name || '';

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none cursor-crosshair">
        {/* Bureau Style Avatar - Square, no rounded corners */}
        <div className="w-9 h-9 border border-white/20 hover:border-white/40 transition-none duration-0 flex items-center justify-center bg-transparent">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile?.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">
              {getInitials()}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-[#0F0F0F] border border-white/10 rounded-none">
        <div className="px-3 py-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white">{fullName || 'User'}</p>
          <p className="font-mono text-[10px] text-white/40">{user?.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="font-mono text-[11px] uppercase tracking-[0.05em] text-white/70 hover:text-white hover:bg-white/5 cursor-crosshair transition-none duration-0 rounded-none focus:bg-white/5">
          <Link to="/Profile">
            <User className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="font-mono text-[11px] uppercase tracking-[0.05em] text-white/70 hover:text-white hover:bg-white/5 cursor-crosshair transition-none duration-0 rounded-none focus:bg-white/5">
          <Link to="/Profile?tab=bookmarks">
            <Bookmark className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Saved Items
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="font-mono text-[11px] uppercase tracking-[0.05em] text-white/50 hover:text-white hover:bg-white/5 cursor-crosshair transition-none duration-0 rounded-none focus:bg-white/5"
        >
          <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

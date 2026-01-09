import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Modal triggers - allows any component to open auth modals
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Load profile separately - don't block auth
  // Uses decrypted view for PII fields (email, name, etc.)
  const loadUserProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('user_profiles_decrypted')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      setProfile(data);
    } catch (error) {
      console.warn('Profile load failed:', error.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session - don't wait for profile
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Load profile in background if logged in
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setSession(null);
    }
    return { error };
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          { id: user.id, email: user.email, ...updates },
          { onConflict: 'id', ignoreDuplicates: false }
        )
        .select()
        .single();

      if (error) return { data: null, error };
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      return { error: err };
    }
  };

  // Helper functions for opening modals
  const openSignup = () => setShowSignupModal(true);
  const openLogin = () => setShowLoginModal(true);

  // Refresh profile from database (useful after signup/updates)
  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signUp,
      signIn,
      signInWithOAuth,
      signOut,
      updateProfile,
      refreshProfile,
      // Modal controls
      showSignupModal,
      setShowSignupModal,
      showLoginModal,
      setShowLoginModal,
      openSignup,
      openLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

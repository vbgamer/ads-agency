import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';

// Global reference to queryClient for sign out cache clearing
let globalQueryClient: QueryClient | null = null;

export function setGlobalQueryClient(client: QueryClient) {
  globalQueryClient = client;
}

type UserType = 'user' | 'company' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: UserType;
  profile: any | null;
  company: any | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>, referralCode?: string) => Promise<{ error: any }>;
  signUpCompany: (email: string, password: string, companyData: Record<string, any>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; userType?: UserType }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [company, setCompany] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer data fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserType(null);
          setProfile(null);
          setCompany(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Check role from user_roles table (source of truth for authorization)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        throw roleError;
      }

      const userRole = roleData?.role;
      setIsAdmin(userRole === 'admin');

      if (userRole === 'company') {
        // Fetch company data
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (companyData) {
          setCompany(companyData);
          setUserType('company');
          setProfile(null);
          window.dispatchEvent(new Event('brandAuthChange'));
        } else {
          // Fallback if company metadata is missing
          setUserType('company');
        }
      } else {
        // Treat as regular user (including 'user', 'admin', 'moderator' roles)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (profileData) {
          setProfile(profileData);
          setUserType('user');
          setCompany(null);
          window.dispatchEvent(new Event('userAuthChange'));
        } else {
          // Fallback if user profile metadata is missing
          setUserType('user');
        }
      }
    } catch (error) {
      console.error('Error fetching user data, falling back to default user role:', error);
      // Fallback: default to 'user' role if database queries fail
      setUserType('user');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>, referralCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    if (!error && data.user) {
      // Assign 'user' role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'user'
      });

      // Update profile with additional metadata after signup
      if (metadata) {
        await supabase.from('profiles').update({
          name: metadata.name,
          phone: metadata.phone,
          gender: metadata.gender,
          age: metadata.age,
          country: metadata.country,
          state: metadata.state,
          city: metadata.city,
        }).eq('id', data.user.id);
      }

      // Record referral if referral code was provided
      if (referralCode) {
        await supabase.rpc('record_referral', {
          p_referred_id: data.user.id,
          p_referral_code: referralCode,
        });
      }
    }

    return { error };
  };

  const signUpCompany = async (email: string, password: string, companyData: Record<string, any>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: redirectUrl,
        data: { name: companyData.name },
      },
    });

    if (!error && data.user) {
      // IMPORTANT: Assign 'company' role FIRST (required for RLS policy)
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'company'
      });

      if (roleError) {
        console.error('Error assigning company role:', roleError);
        return { error: roleError };
      }

      // Then create company record (RLS policy now allows this)
      const { error: companyError } = await supabase.from('companies').insert({
        id: data.user.id,
        email,
        name: companyData.name,
        category: companyData.category,
        logo_url: companyData.logo_url,
        cover_url: companyData.cover_url,
      });

      if (companyError) {
        return { error: companyError };
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    let detectedType: UserType = 'user';

    try {
      // Determine user type from user_roles table (source of truth)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        detectedType = roleData?.role === 'company' ? 'company' : 'user';
        
        // Fallback: if no role found, check companies table
        if (!roleData) {
          const { data: companyCheck } = await supabase
            .from('companies')
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();
          
          if (companyCheck) {
            // Auto-assign company role for data integrity
            try {
              await supabase.from('user_roles').insert({
                user_id: currentUser.id,
                role: 'company'
              });
            } catch (err) {
              console.error("Auto-assigning company role failed:", err);
            }
            detectedType = 'company';
          } else {
            // Auto-assign user role
            try {
              await supabase.from('user_roles').insert({
                user_id: currentUser.id,
                role: 'user'
              });
            } catch (err) {
              console.error("Auto-assigning user role failed:", err);
            }
            detectedType = 'user';
          }
        }
        
        // Check and update subscription status for regular users
        if (detectedType === 'user') {
          try {
            await supabase.rpc('check_subscription_status', { p_user_id: currentUser.id });
          } catch (rpcError) {
            console.error("check_subscription_status RPC failed:", rpcError);
          }
        }
      }
    } catch (dbError) {
      console.error("Database queries failed during sign-in, defaulting to regular user:", dbError);
      detectedType = 'user';
    }

    return { error: null, userType: detectedType };
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
      // Update localStorage cache for splash screen
      localStorage.setItem('isPremiumUser', profileData.is_premium ? 'true' : 'false');
    }
  };

  const signOut = async () => {
    // Clear React Query cache FIRST to prevent stale data from appearing for next user
    if (globalQueryClient) {
      globalQueryClient.clear();
    }
    
    // Clear state BEFORE signout to prevent re-renders with stale data
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
    setUserType(null);
    setIsAdmin(false);
    
    await supabase.auth.signOut();
    
    // Clear legacy localStorage
    localStorage.removeItem('brandAuth');
    localStorage.removeItem('userAuth');
    
    window.dispatchEvent(new Event('brandAuthChange'));
    window.dispatchEvent(new Event('userAuthChange'));
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userType,
      profile,
      company,
      isLoading,
      signUp,
      signUpCompany,
      signIn,
      signOut,
      refreshProfile,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

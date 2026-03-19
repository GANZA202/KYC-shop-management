import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole | null;
  signOut: () => Promise<void>;
  connectionIssue: boolean;
  tableMissing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  useEffect(() => {
    console.time('AuthInit');
    console.log('AuthProvider initializing...');
    
    // Initial session check
    const initAuth = async () => {
      const timeoutId = setTimeout(() => {
        console.warn('Initial auth check timed out');
        setLoading(false);
      }, 10000); // 10s timeout for initial check

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        if (error) throw error;
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          const cachedProfile = localStorage.getItem(`profile_${currentUser.id}`);
          if (cachedProfile) {
            try {
              setProfile(JSON.parse(cachedProfile));
              setLoading(false);
            } catch (e) {
              console.error('Failed to parse cached profile', e);
            }
          }
          fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Initial auth check failed:', err);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, retries = 2) {
    // Prevent concurrent fetches for the same user
    if (fetchingId === userId) return;
    
    if (!isSupabaseConfigured) {
      console.error('Supabase is not configured. Profile fetch aborted.');
      setConnectionIssue(true);
      setLoading(false);
      return;
    }

    setFetchingId(userId);
    
    try {
      for (let i = 0; i < retries + 1; i++) {
        // Attempt 1: 10s, Attempt 2: 20s, Attempt 3: 40s
        const timeoutDuration = i === 0 ? 10000 : 20000 * i; 
        
        console.log(`Fetching profile for: ${userId} (Attempt ${i + 1}/${retries + 1}, Timeout: ${timeoutDuration}ms)`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          clearTimeout(timeoutId);

          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('Profile not found for user:', userId);
              setProfile(null);
              setLoading(false);
              return;
            }
            throw error;
          } else {
            console.log('Profile fetched successfully');
            setProfile(data);
            // Cache the successful result
            localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
            setLoading(false);
            setConnectionIssue(false);
            setTableMissing(false);
            return;
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
          const isTableMissing = error.message?.includes('Could not find the table');
          const isNetworkError = error.message?.includes('Failed to fetch') || error.name === 'TypeError';
          
          if (isTableMissing) {
            setTableMissing(true);
            setLoading(false);
            return;
          }

          console.error(`Error fetching profile (Attempt ${i + 1}):`, 
            isTimeout ? `Timeout after ${timeoutDuration}ms` : 
            isNetworkError ? 'Network error (Failed to fetch)' : 
            error.message || error
          );
          
          if ((isTimeout || isNetworkError) && i === 0) {
            setConnectionIssue(true);
          }

          if (i === retries) {
            if (!profile) setProfile(null);
          }
        }
        
        if (i < retries) {
          const backoff = 1000 * (i + 1); // Increased backoff
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    } finally {
      setFetchingId(null);
      setLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    loading,
    role: profile?.role ?? (user?.user_metadata?.role as UserRole) ?? null,
    signOut,
    connectionIssue,
    tableMissing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

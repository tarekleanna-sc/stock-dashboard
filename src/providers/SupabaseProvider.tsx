'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type SupabaseClient, type User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { usePortfolioStore } from '@/stores/portfolioStore';

type SupabaseContextType = {
  supabase: SupabaseClient;
  user: User | null;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used inside SupabaseProvider');
  return ctx;
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const hydrate = usePortfolioStore((s) => s.hydrate);
  const reset = usePortfolioStore((s) => s.reset);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) hydrate(supabase, user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === 'SIGNED_IN' && currentUser) {
          await hydrate(supabase, currentUser.id);
          // Only redirect when on an auth page — the login form handles its own routing
          // for sign-in; this catches cases like email-confirmation auto-login.
          const isOnAuthPage = window.location.pathname.startsWith('/auth');
          if (isOnAuthPage) {
            const onboardingComplete = currentUser.user_metadata?.onboarding_completed === true;
            router.push(onboardingComplete ? '/dashboard' : '/onboarding');
          } else {
            // Already inside the app — just refresh so server components see the new session.
            router.refresh();
          }
        }
        if (event === 'SIGNED_OUT') {
          reset();
          router.refresh();           // clear RSC cache so server components re-check auth
          router.push('/auth/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, hydrate, reset, router]);

  return (
    <SupabaseContext.Provider value={{ supabase, user }}>
      {children}
    </SupabaseContext.Provider>
  );
}

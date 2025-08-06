'use client';

import { useState, useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { syncUserWithDatabase } from '@/lib/supabase/user-sync';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Listen for auth state changes and sync user data
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Sync user with our custom database
            await syncUserWithDatabase(session.user);
            
            // Check for redirect parameter
            const redirectTo = searchParams.get('redirect');
            const destination = redirectTo && redirectTo !== '/auth' ? redirectTo : '/dashboard';
            
            // Redirect to intended destination or dashboard
            router.push(destination);
          } catch (error) {
            console.error('Error syncing user after sign in:', error);
            // Still redirect even if sync fails
            const redirectTo = searchParams.get('redirect');
            const destination = redirectTo && redirectTo !== '/auth' ? redirectTo : '/dashboard';
            router.push(destination);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Preserve redirect parameter in OAuth flow
      const redirectTo = searchParams.get('redirect');
      const redirectUrl = redirectTo 
        ? `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectTo)}`
        : `${window.location.origin}/auth`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setError(error.message);
        console.error('Google sign-in error:', error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  text-white p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Paywise</h1>
          <p className="text-gray-400">Sign in to manage your expenses and bills</p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle size={24} />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
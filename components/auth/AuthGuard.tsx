'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/context/user-context';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  fallback 
}: AuthGuardProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !user) {
      router.push('/auth');
      return;
    }

    // If admin access is required but user is not admin
    if (requireAdmin && user) {
      // Check if user has the specific admin email
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ashutoshswain7383@gmail.com';
      const isAdmin = user.email === adminEmail;
      
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
    }

    setIsAuthorized(true);
  }, [user, loading, requireAuth, requireAdmin, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  // Show fallback if not authorized
  if (!isAuthorized) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center max-w-md mx-auto p-8 bg-slate-900 rounded-lg border border-slate-800">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-slate-300 mb-4">
            {requireAdmin 
              ? "You don't have administrator privileges to access this page. Only authorized administrators can access this area."
              : "You don't have permission to access this page."
            }
          </p>
          <p className="text-sm text-slate-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/context/user-context';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedLayout({ children, requireAdmin = false }: ProtectedLayoutProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth');
      return;
    }

    if (requireAdmin) {
      // Check if user has the specific admin email
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ashutoshswain7383@gmail.com';
      const isAdmin = user.email === adminEmail;
      
      if (!isAdmin) {
        router.push('/dashboard?error=access_denied');
        return;
      }
    }
  }, [user, loading, requireAdmin, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return <>{children}</>;
}

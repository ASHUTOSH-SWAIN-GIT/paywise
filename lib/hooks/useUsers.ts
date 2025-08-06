'use client';

import { useState, useEffect } from 'react';
// import type { User as PrismaUser } from '@prisma/client';

// Alternative: Use any type to avoid import issues
type PrismaUser = any;

export function useUsers() {
  const [users, setUsers] = useState<PrismaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const result = await response.json();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        throw new Error(result.error || 'Failed to fetch users');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
}

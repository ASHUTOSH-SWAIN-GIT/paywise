'use client';

import { useState, useEffect } from 'react';

type User = any;

export function useUserSearch() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const result = await response.json();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        throw new Error(result.error || 'Failed to search users');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce hook to prevent too many API calls
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Generic debounce function
function debounce<T extends unknown[]>(
  func: (...args: T) => void, 
  wait: number
): (...args: T) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: T) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

  const debouncedSearch = debounce(searchUsers, 300);

  return { users, loading, error, searchUsers: debouncedSearch, clearUsers: () => setUsers([]) };
}

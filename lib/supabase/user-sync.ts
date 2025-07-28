import { supabase } from './client';
import type { User as PrismaUser } from '@prisma/client';

export interface CreateUserData {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
}

export async function syncUserWithDatabase(authUser: any): Promise<PrismaUser | null> {
  try {
    const response = await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: authUser.id }),
    });

    const result = await response.json();
    
    if (result.success && result.user) {
      console.log('User synced to database:', result.user);
      return result.user;
    } else {
      console.error('Error syncing user:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error syncing user with database:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<PrismaUser | null> {
  try {
    const response = await fetch('/api/user/current', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.success && result.user) {
      return result.user;
    } else if (response.status === 404) {
      // User not synced, let's sync them
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        return await syncUserWithDatabase(authUser);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, data: Partial<Pick<PrismaUser, 'name' | 'phoneNumber' | 'emailVerified' | 'phoneVerified'>>): Promise<PrismaUser | null> {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, data }),
    });

    const result = await response.json();
    
    if (result.success && result.user) {
      console.log('User profile updated:', result.user);
      return result.user;
    } else {
      console.error('Error updating user profile:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<PrismaUser | null> {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      return currentUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

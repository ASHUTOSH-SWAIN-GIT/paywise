'use server';

import { prisma } from '@/lib/prisma/prisma';
import { supabase } from '@/lib/supabase/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User as PrismaUser } from '@prisma/client';

function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore;
          return cookie.get(name)?.value;
        },
      },
    }
  );
}
// fix
export async function syncUserAction(userId: string): Promise<{ success: boolean; user?: PrismaUser; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the authenticated user from Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser || authUser.id !== userId) {
      return { success: false, error: 'Unauthorized or user not found' };
    }

    // Check if user already exists in our custom table using Prisma
    const existingUser = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    // If user doesn't exist, create them
    if (!existingUser) {
      if (!authUser.email) {
        return { success: false, error: 'User email is required' };
      }

      const userData = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        emailVerified: authUser.email_confirmed_at ? true : false,
        QrCode: '', // Provide a default value or generate as needed
      };

      const newUser = await prisma.user.create({
        data: userData
      });

      console.log('User synced to database:', newUser);
      return { success: true, user: newUser };
    }

    // If user exists but data might be outdated, update it
    if (!authUser.email) {
      return { success: false, error: 'User email is required' };
    }

    const updatedData = {
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || existingUser.name,
      emailVerified: authUser.email_confirmed_at ? true : existingUser.emailVerified,
    };

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: updatedData
    });

    console.log('User data updated:', updatedUser);
    return { success: true, user: updatedUser };

  } catch (error) {
    console.error('Error syncing user with database:', error);
    return { success: false, error: 'Failed to sync user' };
  }
}

export async function getCurrentUserAction(): Promise<{ success: boolean; user?: PrismaUser; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user from our custom table using Prisma
    const customUser = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    if (!customUser) {
      // If user doesn't exist in custom table, sync them
      return await syncUserAction(authUser.id);
    }

    return { success: true, user: customUser };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { success: false, error: 'Failed to get user' };
  }
}

export async function updateUserProfileAction(
  userId: string, 
  data: Partial<Pick<PrismaUser, 'name' | 'phoneNumber' | 'emailVerified' | 'phoneVerified'>>
): Promise<{ success: boolean; user?: PrismaUser; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Verify the user is authenticated and matches the userId
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser || authUser.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data
    });

    console.log('User profile updated:', updatedUser);
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

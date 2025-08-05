'use server';

import { prisma } from '@/lib/prisma/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendSplitNotificationEmails } from './email-actions';

interface CreateSplitData {
  amount: number;
  description: string;
  selectedUserIds: string[];
  notificationInterval: string;
  splitType?: 'equal' | 'custom';
  customAmounts?: { [userId: string]: string };
}

export async function createSplitAction(data: CreateSplitData): Promise<{ success: boolean; error?: string; splitId?: string }> {
  try {
    console.log('Creating split with data:', data);
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the current user exists in our database
    const currentUser = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    if (!currentUser) {
      return { success: false, error: 'User not found in database' };
    }

    // Verify all selected users exist
    const selectedUsers = await prisma.user.findMany({
      where: {
        id: { in: data.selectedUserIds }
      }
    });

    if (selectedUsers.length !== data.selectedUserIds.length) {
      return { success: false, error: 'Some selected users were not found' };
    }

    // Calculate split amount per person (including the current user)
    const totalPeople = data.selectedUserIds.length + 1; // +1 for current user
    const amountPerPerson = data.amount / totalPeople;
    
    // Determine amounts for each participant based on split type
    const getParticipantAmount = (userId: string): number => {
      if (data.splitType === 'custom' && data.customAmounts && data.customAmounts[userId]) {
        return parseFloat(data.customAmounts[userId]);
      }
      return amountPerPerson;
    };

    // Calculate notification date based on interval
    const getNotificationDate = (interval: string): Date => {
      const now = new Date();
      switch (interval) {
        case 'daily':
          return new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
        case 'weekly':
          return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
        case 'biweekly':
          return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days
        case 'monthly':
          const nextMonth = new Date(now);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          return nextMonth;
        case 'never':
        default:
          return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 year (far future)
      }
    };

    // Create SplitManagement record
    const splitManagement = await prisma.splitManagement.create({
      data: {
        description: data.description,
        Notification: getNotificationDate(data.notificationInterval),
        assigneeId: authUser.id, // The person who created the split and paid the money
        totalAmount: data.amount, // Store the total amount
      }
    });

    // Create SplitParticipant records for each person who owes money
    const splitParticipants = await Promise.all(
      data.selectedUserIds.map(async (userId) => {
        const participantAmount = getParticipantAmount(userId);
        return prisma.splitParticipant.create({
          data: {
            splitId: splitManagement.id,
            userId: userId,
            amountOwed: participantAmount,
            isPaid: false,
          }
        });
      })
    );

    console.log('Split created successfully:', {
      totalAmount: data.amount,
      amountPerPerson,
      participantsCreated: splitParticipants.length,
      splitId: splitManagement.id
    });

    // Send notification emails to participants (async, don't wait for completion)
    const customAmounts: { [userId: string]: number } = {};
    data.selectedUserIds.forEach(userId => {
      customAmounts[userId] = getParticipantAmount(userId);
    });

    sendSplitNotificationEmails(
      splitManagement.id,
      data.selectedUserIds,
      {
        description: data.description,
        totalAmount: data.amount,
        creatorName: currentUser.name || currentUser.email,
        customAmounts: data.splitType === 'custom' ? customAmounts : undefined
      }
    ).catch(emailError => {
      console.error('Failed to send notification emails:', emailError);
      // Don't fail the split creation if emails fail
    });

    return { success: true, splitId: splitManagement.id };

  } catch (error) {
    console.error('Error creating split:', error);
    return { success: false, error: 'Failed to update QR code' };
  }
}

export async function closeSplitAction(splitId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the user is the creator of the split
    const split = await prisma.splitManagement.findUnique({
      where: { id: splitId },
      select: { assigneeId: true }
    });

    if (!split) {
      return { success: false, error: 'Split not found' };
    }

    if (split.assigneeId !== authUser.id) {
      return { success: false, error: 'Only the creator can close this split' };
    }

    // Delete the split and all related data (cascade will handle related records)
    await prisma.splitManagement.delete({
      where: { id: splitId }
    });

    console.log('Split closed and deleted:', splitId);
    return { success: true };

  } catch (error) {
    console.error('Error closing split:', error);
    return { success: false, error: 'Failed to close split' };
  }
}
  


export async function getUserSplitsAction(): Promise<{ success: boolean; splits?: any[]; error?: string }> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current user from database
    const currentUser = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    if (!currentUser) {
      return { success: false, error: 'User not found in database' };
    }

    // Get all splits where the current user is either the assignee (creator) OR a participant
    const splits = await prisma.splitManagement.findMany({
      where: {
        OR: [
          {
            assigneeId: authUser.id // Splits created by the user
          },
          {
            splitParticipants: {
              some: {
                userId: authUser.id // Splits where user is a participant
              }
            }
          }
        ]
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        splitParticipants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        Notification: 'desc'
      }
    });

    console.log('Retrieved splits:', splits.length);
    return { success: true, splits };

  } catch (error) {
    console.error('Error getting splits:', error);
    return { success: false, error: 'Failed to get splits' };
  }
}

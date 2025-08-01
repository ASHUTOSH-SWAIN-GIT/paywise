'use server';

import { prisma } from '@/lib/prisma/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Create TrackExpense records for each person in the split
    const expenses = await Promise.all([
      // Create expense for the current user (who paid)
      prisma.trackExpense.create({
        data: {
          amount: data.amount,
          description: `${data.description} (You paid, split ${totalPeople} ways)`,
          category: 'Split',
          userId: authUser.id,
          splitManagementId: splitManagement.id,
          tags: ['split', 'paid'],
          date: new Date(),
        }
      }),
      // Create expenses for each selected user (who owe money)
      ...data.selectedUserIds.map(async (userId) => {
        return prisma.trackExpense.create({
          data: {
            amount: -amountPerPerson, // Negative amount indicates they owe money
            description: `Your share of "${data.description}" ($${amountPerPerson.toFixed(2)} of $${data.amount})`,
            category: 'Split',
            userId: userId,
            splitManagementId: splitManagement.id,
            tags: ['split', 'owe'],
            date: new Date(),
          }
        });
      })
    ]);

    console.log('Split created successfully:', {
      totalAmount: data.amount,
      amountPerPerson,
      expensesCreated: expenses.length,
      splitId: splitManagement.id
    });

    return { success: true, splitId: splitManagement.id };

  } catch (error) {
    console.error('Error creating split:', error);
    return { success: false, error: 'Failed to create split' };
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

    // Get all splits where the current user is the assignee (created the split)
    const splits = await prisma.splitManagement.findMany({
      where: {
        assigneeId: authUser.id
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
        },
        trackExpenses: {
          select: {
            id: true,
            amount: true,
            description: true,
            date: true,
            tags: true
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

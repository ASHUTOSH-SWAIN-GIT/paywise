'use server';

import { prisma } from '@/lib/prisma/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ExpenseStatus } from '@prisma/client';

interface CreateSplitData {
  amount: number;
  description: string;
  selectedUserIds: string[];
  notificationInterval: string;
}

export async function createSplitAction(data: CreateSplitData): Promise<{ success: boolean; error?: string; splitId?: string }> {
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

    // Create expense records for each person who owes money to the payer
    const expenses = await Promise.all(
      data.selectedUserIds.map(async (userId) => {
        return prisma.expense.create({
          data: {
            title: `Split: ${data.description}`,
            amount: amountPerPerson,
            description: `Your share of "${data.description}" (total: $${data.amount}, split ${totalPeople} ways)`,
            status: 'UNPAID' as ExpenseStatus,
            category: 'SPLIT',
            payerId: authUser.id, // The person who paid
            payeeId: userId, // The person who owes money
            createdAt: new Date(),
          }
        });
      })
    );

    // TODO: Set up notification interval based on data.notificationInterval
    // This could involve creating recurring notifications or setting up reminders

    console.log('Split created successfully:', {
      totalAmount: data.amount,
      amountPerPerson,
      expensesCreated: expenses.length,
      expenseIds: expenses.map(e => e.id)
    });

    return { success: true, splitId: expenses[0]?.id || 'unknown' };

  } catch (error) {
    console.error('Error creating split:', error);
    return { success: false, error: 'Failed to create split' };
  }
}

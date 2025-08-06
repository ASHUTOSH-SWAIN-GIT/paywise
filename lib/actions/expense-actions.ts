'use server';

import { prisma } from '@/lib/prisma/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface CreateExpenseData {
  description: string;
  amount: number;
  currency: string;
  category: string;
  receiptUrl?: string;
  tags?: string[];
}

export async function createExpenseAction(data: CreateExpenseData): Promise<{ success: boolean; error?: string; expense?: any }> {
  try {
    console.log('Creating expense with data:', data);
    
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

    // Validate required fields
    if (!data.description || !data.amount || !data.category) {
      return { success: false, error: 'Missing required fields' };
    }

    // Validate amount
    if (data.amount <= 0) {
      return { success: false, error: 'Amount must be greater than 0' };
    }

    // Create the expense
    const expense = await prisma.trackExpense.create({
      data: {
        description: data.description.trim(),
        amount: parseFloat(data.amount.toString()),
        currency: data.currency,
        category: data.category,
        receiptUrl: data.receiptUrl?.trim() || null,
        tags: data.tags || [],
        userId: authUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    console.log('Expense created successfully:', expense.id);
    return { success: true, expense };

  } catch (error) {
    console.error('Error creating expense:', error);
    return { success: false, error: 'Failed to create expense' };
  }
}

export async function getUserExpensesAction(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const expenses = await prisma.trackExpense.findMany({
      where: {
        userId: userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, expenses };

  } catch (error) {
    console.error('Error fetching user expenses:', error);
    return { success: false, error: 'Failed to fetch expenses' };
  }
}

export async function deleteExpenseAction(expenseId: string): Promise<{ success: boolean; error?: string }> {
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

    // Check if expense exists and belongs to the user
    const expense = await prisma.trackExpense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    if (expense.userId !== authUser.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete the expense
    await prisma.trackExpense.delete({
      where: { id: expenseId }
    });

    console.log('Expense deleted successfully:', expenseId);
    return { success: true };

  } catch (error) {
    console.error('Error deleting expense:', error);
    return { success: false, error: 'Failed to delete expense' };
  }
}

export async function getExpenseStatsAction(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Get current month expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyExpenses = await prisma.trackExpense.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const totalThisMonth = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Get category breakdown
    const categoryStats = await prisma.trackExpense.groupBy({
      by: ['category'],
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    return { 
      success: true, 
      stats: {
        totalThisMonth,
        categoryStats,
        expenseCount: monthlyExpenses.length
      }
    };

  } catch (error) {
    console.error('Error fetching expense stats:', error);
    return { success: false, error: 'Failed to fetch expense statistics' };
  }
}

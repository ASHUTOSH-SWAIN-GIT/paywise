'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserExpensesAction, deleteExpenseAction, getExpenseStatsAction } from '@/lib/actions/expense-actions';
import { createServerClient } from '@supabase/ssr';
import { Trash2, Receipt, Calendar } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  receiptUrl?: string | null;
  createdAt: Date;
  tags: string[];
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ExpenseStats {
  totalThisMonth: number;
  categoryStats: Array<{
    category: string;
    _sum: { amount: number | null };
    _count: { id: number };
  }>;
  expenseCount: number;
}

interface ExpenseDisplayProps {
  refreshTrigger: number;
}

export function ExpenseDisplay({ refreshTrigger }: ExpenseDisplayProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return document.cookie
                .split('; ')
                .find(row => row.startsWith(name + '='))
                ?.split('=')[1];
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const [expensesResult, statsResult] = await Promise.all([
        getUserExpensesAction(user.id),
        getExpenseStatsAction(user.id)
      ]);

      if (expensesResult.success && expensesResult.expenses) {
        setExpenses(expensesResult.expenses);
      }

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setIsDeleting(expenseId);
    try {
      const result = await deleteExpenseAction(expenseId);
      if (result.success) {
        setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
        // Refresh stats
        fetchExpenses();
      } else {
        alert(result.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTopCategories = () => {
    if (!stats?.categoryStats) return [];
    return stats.categoryStats
      .sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
      .slice(0, 3);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-800 rounded-lg p-4 bg-black/50 animate-pulse">
              <div className="h-4 bg-neutral-700 rounded mb-2"></div>
              <div className="h-8 bg-neutral-700 rounded mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-neutral-800 rounded-lg p-4 bg-black/50">
          <h3 className="font-semibold text-white mb-2">This Month</h3>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(stats?.totalThisMonth || 0)}
          </p>
          <p className="text-neutral-500 text-sm">
            {stats?.expenseCount || 0} expenses recorded
          </p>
        </div>

        <div className="border border-neutral-800 rounded-lg p-4 bg-black/50">
          <h3 className="font-semibold text-white mb-2">Top Categories</h3>
          <div className="space-y-1">
            {getTopCategories().length > 0 ? (
              getTopCategories().map((cat, index) => (
                <div key={cat.category} className="flex justify-between text-sm">
                  <span className="text-neutral-300">{cat.category}</span>
                  <span className="text-white">{formatCurrency(cat._sum.amount || 0)}</span>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 text-sm">No expenses recorded</p>
            )}
          </div>
        </div>

        <div className="border border-neutral-800 rounded-lg p-4 bg-black/50">
          <h3 className="font-semibold text-white mb-2">Recent Activity</h3>
          <p className="text-neutral-500 text-sm">
            {expenses.length > 0 
              ? `Last expense: ${formatDate(new Date(expenses[0].createdAt))}`
              : 'No recent activity'
            }
          </p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Recent Expenses</h3>
        
        {expenses.length === 0 ? (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6 text-center">
              <p className="text-neutral-400">No expenses recorded yet. Add your first expense to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <Card key={expense.id} className="bg-neutral-900 border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-white">{expense.description}</h4>
                        <span className="px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-full">
                          {expense.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(new Date(expense.createdAt))}
                        </div>
                        
                        {expense.receiptUrl && (
                          <a 
                            href={expense.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            <Receipt className="w-3 h-3" />
                            Receipt
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">
                        {formatCurrency(expense.amount)}
                      </span>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(expense.id)}
                        disabled={isDeleting === expense.id}
                        className="border-red-800 text-red-400 hover:bg-red-900/50"
                      >
                        {isDeleting === expense.id ? (
                          <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

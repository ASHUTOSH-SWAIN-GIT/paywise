'use client';

import React, { useEffect, useState } from 'react';
import { getUserRecurringBillsAction, deleteRecurringBillAction } from '@/lib/actions/recurring-bills-actions';
import { useUser } from '@/lib/context/user-context';
import { toast } from 'sonner';
import { formatCurrency } from '@/components/ui/CurrencyAmountInput';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Trash2, 
  ExternalLink, 
  AlertTriangle,
  FileX2,
  Tag,
  Clock,
  RepeatIcon
} from "lucide-react";

interface RecurringBill {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  startDate: Date;
  frequency: string;
  paymentLink?: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface RecurringBillsDisplayProps {
  refreshTrigger?: number;
}

export function RecurringBillsDisplay({ refreshTrigger }: RecurringBillsDisplayProps) {
  const { user } = useUser();
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getUserRecurringBillsAction(user.id);
        
        if (result.success && result.recurringBills) {
          setBills(result.recurringBills);
        } else {
          setError(result.error || 'Failed to fetch recurring bills');
          toast.error(result.error || 'Failed to fetch recurring bills');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching recurring bills:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [user?.id, refreshTrigger]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFrequency = (frequency: string) => {
    const frequencyMap: Record<string, string> = {
      weekly: "Weekly",
      biweekly: "Bi-weekly", 
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly"
    };
    return frequencyMap[frequency] || frequency;
  };

  const getNextDueDate = (startDate: Date | string, frequency: string) => {
    const start = new Date(startDate);
    const now = new Date();
    
    let nextDate = new Date(start);
    
    while (nextDate <= now) {
      switch (frequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          nextDate.setMonth(nextDate.getMonth() + 1);
      }
    }
    
    return nextDate;
  };

  const getDaysUntilDue = (startDate: Date | string, frequency: string) => {
    const nextDue = getNextDueDate(startDate, frequency);
    const now = new Date();
    const diffTime = nextDue.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (startDate: Date | string, frequency: string) => {
    const daysUntilDue = getDaysUntilDue(startDate, frequency);
    if (daysUntilDue <= 3) return 'text-red-400';
    if (daysUntilDue <= 7) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusText = (startDate: Date | string, frequency: string) => {
    const daysUntilDue = getDaysUntilDue(startDate, frequency);
    if (daysUntilDue <= 0) return 'Due Today';
    if (daysUntilDue === 1) return 'Due Tomorrow';
    if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`;
    return `Due in ${daysUntilDue} days`;
  };

  const handleDelete = async (billId: string, description: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${description}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    if (!user?.id) return;

    setDeletingId(billId);
    toast.loading('Deleting recurring bill...');
    
    try {
      const result = await deleteRecurringBillAction(billId, user.id);
      toast.dismiss();
      
      if (result.success) {
        toast.success('Recurring bill deleted successfully!');
        setBills(prevBills => prevBills.filter(b => b.id !== billId));
      } else {
        toast.error(result.error || 'Failed to delete recurring bill.');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error deleting recurring bill:', error);
      toast.error('Failed to delete recurring bill.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Loading recurring bills...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-red-500/50">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-600 dark:text-red-500">An Error Occurred</h3>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">{error}</p>
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <FileX2 className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No Recurring Bills Found</h3>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">
          Start tracking your recurring expenses by adding your first bill.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bills.map((bill) => (
        <Card key={bill.id} className="bg-black border-slate-800 hover:border-slate-700 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-white text-lg font-semibold mb-1">
                  {bill.description}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {bill.category}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                {bill.paymentLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(bill.paymentLink!, '_blank')}
                    className="text-slate-400 hover:text-white p-1 h-8 w-8"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(bill.id, bill.description)}
                  disabled={deletingId === bill.id}
                  className="text-red-400 hover:text-red-300 p-1 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="py-3">
            <div className="space-y-3">
              {/* Amount and Frequency */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-semibold text-lg">
                    {formatCurrency(bill.amount, bill.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-300 text-sm bg-slate-800 px-2 py-1 rounded">
                  <RepeatIcon className="h-3 w-3" />
                  {formatFrequency(bill.frequency)}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className={`text-sm font-medium ${getStatusColor(bill.startDate, bill.frequency)}`}>
                  {getStatusText(bill.startDate, bill.frequency)}
                </span>
              </div>

              {/* Next Due Date */}
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="h-4 w-4" />
                Next due: {formatDate(getNextDueDate(bill.startDate, bill.frequency))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 w-full text-center">
              Created {formatDate(bill.createdAt)}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
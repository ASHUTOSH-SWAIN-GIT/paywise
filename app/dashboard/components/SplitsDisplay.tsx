'use client';

import React, { useEffect, useState } from 'react';
import { getUserSplitsAction, closeSplitAction } from '@/lib/actions/split-actions';
import { getCreatorQRCodeAction } from '@/lib/actions/qr-actions';
import { useUser } from '@/lib/context/user-context';
import { toast } from 'sonner';
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
  Download, 
  Users, 
  CalendarClock, 
  CircleDollarSign, 
  Landmark, 
  CheckCircle2, 
  FileX2, 
  AlertTriangle,
  ReceiptText,
  Hourglass,
  BadgeInfo,
  Eye,
  EyeOff
} from "lucide-react";

interface Split {
  id: string;
  description: string;
  totalAmount: number;
  Notification: string;
  createdAt: string;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  };
  splitParticipants: {
    id: string;
    amountOwed: number;
    isPaid: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
}

interface SplitsDisplayProps {
  refreshTrigger?: number;
}

export function SplitsDisplay({ refreshTrigger }: SplitsDisplayProps) {
  const { user } = useUser();
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSplits = async () => {
      try {
        setLoading(true);
        const result = await getUserSplitsAction();
        
        if (result.success && result.splits) {
          setSplits(result.splits);
        } else {
          setError(result.error || 'Failed to fetch splits');
          toast.error(result.error || 'Failed to fetch splits');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching splits:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSplits();
  }, [refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAmountPending = (split: Split) => {
    return split.splitParticipants
      .filter(p => !p.isPaid)
      .reduce((sum, p) => sum + p.amountOwed, 0);
  };

  const isUserCreator = (split: Split) => {
    return user?.id === split.assignee.id;
  };

  const getUserAmountOwed = (split: Split) => {
    const participant = split.splitParticipants.find(p => p.user.id === user?.id);
    return participant ? participant.amountOwed : 0;
  };

  const isUserPaid = (split: Split) => {
    const participant = split.splitParticipants.find(p => p.user.id === user?.id);
    return participant ? participant.isPaid : false;
  };

  const [showQR, setShowQR] = useState<{ [key: string]: boolean }>({});
  const [qrUrls, setQrUrls] = useState<{ [key: string]: string }>({});

  const handleShowQR = async (creatorId: string, splitId: string) => {
    try {
      // If we already have the QR URL, just toggle display
      if (qrUrls[creatorId]) {
        setShowQR(prev => ({ ...prev, [splitId]: !prev[splitId] }));
        return;
      }

      // Get the QR code URL
      const result = await getCreatorQRCodeAction(creatorId);
      
      if (!result.success || !result.qrCodeUrl) {
        toast.error(result.error || 'Failed to get QR code');
        return;
      }

      // Store the QR URL and show it
      setQrUrls(prev => ({ ...prev, [creatorId]: result.qrCodeUrl! }));
      setShowQR(prev => ({ ...prev, [splitId]: true }));
      
    } catch (error) {
      console.error('Error getting QR code:', error);
      toast.error('Failed to load QR code. Please try again.');
    }
  };

  const handleCloseSplit = async (splitId: string, splitDescription: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to close the split "${splitDescription}"? This action is permanent and will delete all associated data.`
    );
    
    if (!confirmed) return;

    toast.loading('Closing split...');
    try {
      const result = await closeSplitAction(splitId);
      toast.dismiss();
      
      if (result.success) {
        toast.success('Split closed successfully!');
        setSplits(prevSplits => prevSplits.filter(s => s.id !== splitId));
      } else {
        toast.error(result.error || 'Failed to close split.');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error closing split:', error);
      toast.error('Failed to close split.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Loading splits...</p>
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

  if (splits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <FileX2 className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No Splits Found</h3>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md">
          You haven't created or been added to any splits yet.
          <br />
          Start by creating a new split from your dashboard!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {splits.map((split) => {
        const creator = isUserCreator(split);
        const userPaid = isUserPaid(split);
        
        return (
          <Card key={split.id} className="w-full flex flex-col bg-black border border-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-lg font-bold text-slate-100">{split.description}</CardTitle>
                {creator ? (
                  <span className="text-xs font-semibold bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-full">Creator</span>
                ) : (
                  <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">Participant</span>
                )}
              </div>
              <CardDescription className="text-sm text-slate-400 !mt-1">
                {creator ? `Created on ${formatDate(split.createdAt)}` : `By ${split.assignee.name || split.assignee.email}`}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow border-t border-slate-800 pt-4 grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <ReceiptText className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Bill</span>
                </div>
                <span className="font-semibold text-slate-100 text-base">{formatCurrency(split.totalAmount)}</span>
              </div>
              
              {/* User-specific section */}
              <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
                {creator ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Landmark className="h-4 w-4" />
                      <span className="text-sm font-medium">Amount Pending</span>
                    </div>
                    <span className="font-semibold text-sky-400">{formatCurrency(getAmountPending(split))}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <CircleDollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Your Share</span>
                      </div>
                      <span className="font-semibold text-slate-50">{formatCurrency(getUserAmountOwed(split))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-slate-300">
                        <BadgeInfo className="h-4 w-4" />
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      {userPaid ? (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Paid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-500">
                          <Hourglass className="h-4 w-4" /> Pending
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-sm font-medium">Next Reminder</span>
                </div>
                <span className="font-medium text-slate-300 text-sm">{formatDate(split.Notification)}</span>
              </div>

              {/* QR Code Display */}
              {!creator && showQR[split.id] && qrUrls[split.assignee.id] && (
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Payment QR Code</h4>
                  <div className="flex justify-center">
                    <img 
                      src={qrUrls[split.assignee.id]} 
                      alt="Payment QR Code" 
                      className="w-48 h-48 object-contain bg-white rounded-lg p-2"
                      onError={(e) => {
                        console.error('Failed to load QR image');
                        toast.error('Failed to load QR code image');
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Scan this QR code to pay {split.assignee.name || split.assignee.email}
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-slate-800 pt-3 pb-3 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="h-4 w-4" />
                <span>{split.splitParticipants.length + 1} participants</span>
              </div>
              {!creator ? (
                <Button
                  size="sm"
                  onClick={() => handleShowQR(split.assignee.id, split.id)}
                  className="flex items-center gap-2 bg-slate-50 text-slate-900 hover:bg-slate-200"
                >
                  {showQR[split.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showQR[split.id] ? 'Hide QR' : 'Show QR'}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className='bg-white text-black font-sans'
                  onClick={() => handleCloseSplit(split.id, split.description)}
                >
                  Close Split
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
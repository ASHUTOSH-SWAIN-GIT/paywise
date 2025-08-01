'use client';

import React, { useEffect, useState } from 'react';
import { getUserSplitsAction, closeSplitAction } from '@/lib/actions/split-actions';
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
import { Download } from "lucide-react";

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
  trackExpenses: {
    id: string;
    amount: number;
    description:string;
    date: string;
    tags: string[];
  }[];
}

export function SplitsDisplay() {
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
  }, []);

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

  const handleDownloadQR = async (split: Split) => {
    try {
      toast.loading('Checking for QR code...');
      
      // Import the server action dynamically
      const { getCreatorQRCodeAction } = await import('@/lib/actions/qr-actions');
      const result = await getCreatorQRCodeAction(split.assignee.id);
      
      toast.dismiss();
      
      if (result.success && result.qrCodeUrl) {
        // Create a temporary link to download the QR code
        const link = document.createElement('a');
        link.href = result.qrCodeUrl;
        link.download = `qr-code-${split.description}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('QR code downloaded successfully!');
      } else {
        toast.error(result.error || 'QR code not uploaded by creator');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleCloseSplit = async (splitId: string, splitDescription: string) => {
    // Confirm with the user before closing
    const confirmed = window.confirm(
      `Are you sure you want to close the split "${splitDescription}"? This action cannot be undone and will remove all split data.`
    );
    
    if (!confirmed) return;

    try {
      toast.loading('Closing split...');
      
      const result = await closeSplitAction(splitId);
      
      toast.dismiss();
      
      if (result.success) {
        toast.success('Split closed successfully!');
        // Refresh the splits list
        const updatedResult = await getUserSplitsAction();
        if (updatedResult.success && updatedResult.splits) {
          setSplits(updatedResult.splits);
        }
      } else {
        toast.error(result.error || 'Failed to close split');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error closing split:', error);
      toast.error('Failed to close split');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Skeleton cards */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full border-4 animate-pulse">
            <CardHeader>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-black/20 rounded w-3/4"></div>
                  <div className="h-4 bg-black/30 rounded w-16"></div>
                </div>
                <div className="h-4 bg-black/10 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-black/10 rounded w-1/3"></div>
                <div className="h-4 bg-black/20 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-black/10 rounded w-1/3"></div>
                <div className="h-4 bg-black/20 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-black/10 rounded w-1/3"></div>
                <div className="h-4 bg-black/20 rounded w-1/4"></div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="h-4 bg-black/10 rounded w-1/4"></div>
              <div className="h-8 bg-black/20 rounded w-24"></div>
            </CardFooter>
          </Card>
        ))}
        
        {/* Loading overlay with spinner */}
        <div className="col-span-full flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black/20"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent absolute top-0 left-0"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-black">Loading Your Splits</h3>
            <p className="text-sm text-black/60">Fetching your expense data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-sm border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription className="text-destructive">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (splits.length === 0) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>No Splits Found</CardTitle>
          <CardDescription>
            You haven't created or been added to any splits yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
      {splits.map((split) => (
        <Card key={split.id} className="w-full border-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{split.description}</span>
              {isUserCreator(split) ? (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Creator</span>
              ) : (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Participant</span>
              )}
            </CardTitle>
            <CardDescription>
              {isUserCreator(split) ? (
                <>Created on {formatDate(split.createdAt)}</>
              ) : (
                <>Created by {split.assignee.name || split.assignee.email} on {formatDate(split.createdAt)}</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-bold">Total Amount</span>
              <span className="font-semibold">{formatCurrency(split.totalAmount)}</span>
            </div>
            {isUserCreator(split) ? (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-bold">Amount Pending</span>
                <span className="font-semibold">{formatCurrency(getAmountPending(split))}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Your Share</span>
                  <span className="font-semibold">{formatCurrency(getUserAmountOwed(split))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Status</span>
                  <span className={`font-semibold ${isUserPaid(split) ? 'text-green-500' : 'text-red-500'}`}>
                    {isUserPaid(split) ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-bold">Next Reminder</span>
              <span className="font-semibold">{formatDate(split.Notification)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{split.splitParticipants.length + 1} participants</p>
            {!isUserCreator(split) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadQR(split)}
                className="flex items-center gap-2 bg-white text-black font-bold"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleCloseSplit(split.id, split.description)}
                className="flex items-center gap-2 bg-white text-black font-bold cursor-pointer"
              >
                Close Split
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

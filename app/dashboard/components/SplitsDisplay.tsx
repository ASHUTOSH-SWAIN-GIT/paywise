'use client';

import React, { useEffect, useState } from 'react';
import { getUserSplitsAction } from '@/lib/actions/split-actions';
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

  if (loading) {
    return (
      <Card className="w-full max-w-sm border-2">
        <CardHeader>
          <CardTitle>Loading Splits...</CardTitle>
          <CardDescription>Please wait while we fetch your data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </CardContent>
      </Card>
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
            {!isUserCreator(split) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadQR(split)}
                className="flex items-center gap-2 bg-white text-black font-bold"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

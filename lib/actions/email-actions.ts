'use server';

import { EmailService } from '@/lib/services/EmailService';
import { prisma } from '@/lib/prisma/prisma';

export async function sendSplitNotificationEmails(
  splitId: string,
  participantIds: string[],
  splitData: {
    description: string;
    totalAmount: number;
    creatorName: string;
    customAmounts?: { [userId: string]: number };
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get participant details
    const participants = await prisma.user.findMany({
      where: {
        id: { in: participantIds }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    // Get split details for due date
    const split = await prisma.splitManagement.findUnique({
      where: { id: splitId },
      select: { Notification: true }
    });

    if (!split) {
      return { success: false, error: 'Split not found' };
    }

    // Send emails to all participants
    const emailPromises = participants.map(async (participant) => {
      const userAmount = splitData.customAmounts 
        ? (splitData.customAmounts[participant.id] || 0)
        : splitData.totalAmount / (participantIds.length + 1); // +1 for creator

      return EmailService.sendSplitNotification({
        participantEmail: participant.email,
        participantName: participant.name || 'User',
        creatorName: splitData.creatorName,
        splitDescription: splitData.description,
        totalAmount: splitData.totalAmount,
        userAmount: userAmount,
        dueDate: new Date(split.Notification).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    });

    const results = await Promise.all(emailPromises);
    
    // Check if any emails failed
    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
      console.error('Some emails failed to send:', failures);
      return { success: false, error: `${failures.length} emails failed to send` };
    }

    console.log(`Successfully sent ${results.length} split notification emails`);
    return { success: true };

  } catch (error) {
    console.error('Error sending split notification emails:', error);
    return { success: false, error: 'Failed to send notification emails' };
  }
}

export async function sendRecurringPaymentReminder(
  recurringPaymentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get recurring payment details
    const recurringPayment = await prisma.reccuringPayments.findUnique({
      where: { id: recurringPaymentId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!recurringPayment) {
      return { success: false, error: 'Recurring payment not found' };
    }

    // Send reminder email
    const result = await EmailService.sendRecurringPaymentReminder({
      userEmail: recurringPayment.user.email,
      userName: recurringPayment.user.name || 'User',
      description: recurringPayment.description,
      provider: recurringPayment.provider,
      dueDate: new Date(recurringPayment.Notification).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    console.log('Recurring payment reminder sent successfully');
    return { success: true };

  } catch (error) {
    console.error('Error sending recurring payment reminder:', error);
    return { success: false, error: 'Failed to send reminder email' };
  }
}

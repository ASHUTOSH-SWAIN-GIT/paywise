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
    const emailPromises = participants.map(async (participant: any) => {
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
      provider: recurringPayment.paymentLink ?? '',
      dueDate: new Date(recurringPayment.frequency).toLocaleDateString('en-US', {
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

// Helper function to calculate next due date
function calculateNextDueDate(startDate: Date, frequency: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  // If start date is in the future, return it
  if (start > today) {
    return start;
  }
  
  let nextDate = new Date(start);
  
  // Calculate how many periods have passed since start date
  while (nextDate <= today) {
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
        // Default to monthly if frequency is invalid
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }
  
  return nextDate;
}

export async function sendDailyRecurringPaymentReminders(): Promise<{ success: boolean; error?: string; sentCount?: number }> {
  try {
    // Get tomorrow's date for comparison
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1); // End of tomorrow

    // Get all active recurring payments
    const recurringPayments = await prisma.reccuringPayments.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Filter payments that are due tomorrow
    const paymentsDueTomorrow = recurringPayments.filter((payment: any) => {
      const nextDueDate = calculateNextDueDate(payment.startDate, payment.frequency);
      
      // Check if the calculated due date falls on tomorrow
      return nextDueDate >= tomorrow && nextDueDate < dayAfterTomorrow;
    });

    if (paymentsDueTomorrow.length === 0) {
      console.log('No recurring payments due tomorrow');
      return { success: true, sentCount: 0 };
    }

    // Send reminder emails
    const emailPromises = paymentsDueTomorrow.map(async (payment: any) => {
      const nextDueDate = calculateNextDueDate(payment.startDate, payment.frequency);
      
      return EmailService.sendRecurringPaymentReminder({
        userEmail: payment.user.email,
        userName: payment.user.name || 'User',
        description: payment.description,
        provider: payment.paymentLink ?? '',
        dueDate: nextDueDate.toLocaleDateString('en-US', {
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
      console.error('Some reminder emails failed to send:', failures);
      return { 
        success: false, 
        error: `${failures.length} reminder emails failed to send`,
        sentCount: results.length - failures.length
      };
    }

    console.log(`Successfully sent ${results.length} recurring payment reminder emails`);
    return { success: true, sentCount: results.length };

  } catch (error) {
    console.error('Error sending daily recurring payment reminders:', error);
    return { success: false, error: 'Failed to send daily reminders' };
  }
}

export async function sendDailySplitPaymentReminders(): Promise<{ success: boolean; error?: string; sentCount?: number }> {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // End of today

    // Get all split payments with notification dates due today
    const splitsDueToday = await prisma.splitManagement.findMany({
      where: {
        Notification: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        assignee: {
          select: {
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
      }
    });

    if (splitsDueToday.length === 0) {
      console.log('No split payment reminders due today');
      return { success: true, sentCount: 0 };
    }

    let totalEmailsSent = 0;
    const allEmailPromises: Promise<any>[] = [];

    // Process each split payment
    for (const split of splitsDueToday) {
      // Send reminder emails to all participants
      const participantEmails = split.splitParticipants.map(async (participant: any) => {
        return EmailService.sendSplitNotification({
          participantEmail: participant.user.email,
          participantName: participant.user.name || 'User',
          creatorName: split.assignee.name || 'User',
          splitDescription: split.description,
          totalAmount: split.totalAmount,
          userAmount: participant.amountOwed,
          dueDate: split.Notification.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      });

      allEmailPromises.push(...participantEmails);
      totalEmailsSent += participantEmails.length;
    }

    const results = await Promise.all(allEmailPromises);
    
    // Check if any emails failed
    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
      console.error('Some split reminder emails failed to send:', failures);
      return { 
        success: false, 
        error: `${failures.length} split reminder emails failed to send`,
        sentCount: results.length - failures.length
      };
    }

    console.log(`Successfully sent ${results.length} split payment reminder emails`);
    return { success: true, sentCount: results.length };

  } catch (error) {
    console.error('Error sending daily split payment reminders:', error);
    return { success: false, error: 'Failed to send split reminders' };
  }
}

export async function sendAllDailyReminders(): Promise<{ success: boolean; error?: string; recurringCount?: number; splitCount?: number; totalCount?: number }> {
  try {
    console.log('Starting all daily reminders...');

    // Send both recurring and split payment reminders
    const [recurringResult, splitResult] = await Promise.all([
      sendDailyRecurringPaymentReminders(),
      sendDailySplitPaymentReminders()
    ]);

    const recurringCount = recurringResult.sentCount || 0;
    const splitCount = splitResult.sentCount || 0;
    const totalCount = recurringCount + splitCount;

    // Check if either failed
    if (!recurringResult.success || !splitResult.success) {
      const errors = [];
      if (!recurringResult.success) errors.push(`Recurring: ${recurringResult.error}`);
      if (!splitResult.success) errors.push(`Split: ${splitResult.error}`);
      
      return {
        success: false,
        error: errors.join('; '),
        recurringCount,
        splitCount,
        totalCount
      };
    }

    console.log(`Daily reminders completed: ${recurringCount} recurring + ${splitCount} split = ${totalCount} total emails sent`);
    
    return {
      success: true,
      recurringCount,
      splitCount,
      totalCount
    };

  } catch (error) {
    console.error('Error sending all daily reminders:', error);
    return { success: false, error: 'Failed to send daily reminders' };
  }
}

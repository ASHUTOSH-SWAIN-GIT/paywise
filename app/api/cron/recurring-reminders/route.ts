import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prisma';
import { sendRecurringPaymentReminder } from '@/lib/actions/email-actions';

export async function GET(request: NextRequest) {
  try {
    // Get current date
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find recurring payments that are due based on their frequency
    // This is a simplified approach - in production you'd want more sophisticated scheduling
    const allRecurringPayments = await prisma.reccuringPayments.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Filter payments that are due for reminder
    const dueRecurringPayments = allRecurringPayments.filter((payment: any) => {
      const startDate = new Date(payment.startDate);
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Simple frequency check - in production you'd want more sophisticated logic
      switch (payment.frequency) {
        case 'weekly':
          return daysSinceStart % 7 === 0;
        case 'biweekly':
          return daysSinceStart % 14 === 0;
        case 'monthly':
          return daysSinceStart % 30 === 0; // Simplified - should use actual month calculation
        case 'quarterly':
          return daysSinceStart % 90 === 0; // Simplified
        case 'yearly':
          return daysSinceStart % 365 === 0; // Simplified
        default:
          return false;
      }
    });

    console.log(`Found ${dueRecurringPayments.length} recurring payments due within 24 hours`);

    // Send reminder emails
    const emailPromises = dueRecurringPayments.map((payment: any) => 
      sendRecurringPaymentReminder(payment.id)
    );

    const results = await Promise.all(emailPromises);
    
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.filter(result => !result.success).length;

    console.log(`Recurring payment reminders sent: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${dueRecurringPayments.length} recurring payments`,
      results: {
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error in recurring payment reminder cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring payment reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same logic as GET for flexibility
  return GET(request);
}

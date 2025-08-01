import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prisma';
import { sendRecurringPaymentReminder } from '@/lib/actions/email-actions';

export async function GET(request: NextRequest) {
  try {
    // Check for authorization (you might want to add a secret token)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find recurring payments that are due within the next 24 hours
    const dueRecurringPayments = await prisma.reccuringPayments.findMany({
      where: {
        Notification: {
          gte: now,
          lte: tomorrow
        }
      }
    });

    console.log(`Found ${dueRecurringPayments.length} recurring payments due within 24 hours`);

    // Send reminder emails
    const emailPromises = dueRecurringPayments.map(payment => 
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

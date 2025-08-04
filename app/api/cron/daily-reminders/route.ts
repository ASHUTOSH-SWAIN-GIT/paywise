import { NextRequest, NextResponse } from 'next/server';
import { sendDailyRecurringPaymentReminders } from '@/lib/actions/email-actions';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow requests without auth for development or if no CRON_SECRET is set
    const isDevMode = process.env.NODE_ENV === 'development';
    const hasValidAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const shouldAllowRequest = !cronSecret || hasValidAuth || isDevMode;
    
    if (cronSecret && !hasValidAuth && !isDevMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily recurring payment reminders cron job');
    
    const result = await sendDailyRecurringPaymentReminders();
    
    if (!result.success) {
      console.error('Daily reminders failed:', result.error);
      return NextResponse.json(
        { error: result.error, sentCount: result.sentCount || 0 },
        { status: 500 }
      );
    }

    console.log(`Daily reminders completed successfully. Sent ${result.sentCount} emails.`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully sent ${result.sentCount} reminder emails`,
      sentCount: result.sentCount
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { sendAllDailyReminders } from '@/lib/actions/email-actions';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting daily reminders for both recurring and split payments');
    
    const result = await sendAllDailyReminders();
    
    if (!result.success) {
      console.error('Daily reminders failed:', result.error);
      return NextResponse.json(
        { 
          error: result.error, 
          recurringCount: result.recurringCount || 0,
          splitCount: result.splitCount || 0,
          totalCount: result.totalCount || 0
        },
        { status: 500 }
      );
    }

    console.log(`Daily reminders completed successfully. Sent ${result.totalCount} emails total (${result.recurringCount} recurring + ${result.splitCount} split).`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully sent ${result.totalCount} reminder emails (${result.recurringCount} recurring + ${result.splitCount} split)`,
      recurringCount: result.recurringCount,
      splitCount: result.splitCount,
      totalCount: result.totalCount
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

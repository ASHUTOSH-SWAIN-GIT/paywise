'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const triggerDailyReminders = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/cron/daily-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Success: ${data.message}`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Reminder Management</CardTitle>
            <CardDescription>
              Manually trigger daily recurring payment reminders for testing purposes.
              This will send reminder emails to users who have payments due tomorrow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={triggerDailyReminders}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending Reminders...' : 'Send Daily Reminders'}
            </Button>
            
            {result && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm">{result}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cron Job Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">For Production (Vercel):</h4>
              <p className="text-muted-foreground">
                Set up a cron job using Vercel Cron Jobs or an external service like GitHub Actions
                to call the endpoint daily at a specific time.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">API Endpoint:</h4>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                GET/POST /api/cron/daily-reminders
              </code>
            </div>
            
            <div>
              <h4 className="font-medium">Environment Variable:</h4>
              <p className="text-muted-foreground">
                Set <code className="bg-muted px-1 rounded">CRON_SECRET</code> for production authentication.
                Development mode allows requests without authentication.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

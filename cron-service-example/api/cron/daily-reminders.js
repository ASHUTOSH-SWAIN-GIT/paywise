// Standalone cron function that calls your main app's API
export default async function handler(req, res) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Call your main app's cron endpoint
    const response = await fetch(`${process.env.MAIN_APP_URL}/api/cron/daily-reminders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    });

    const data = await response.json();
    
    console.log('Daily reminders triggered:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error triggering daily reminders:', error);
    res.status(500).json({ error: 'Failed to trigger daily reminders' });
  }
}

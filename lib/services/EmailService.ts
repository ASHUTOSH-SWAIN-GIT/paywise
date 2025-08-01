import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Get the appropriate from email based on environment
const getFromEmail = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use your verified production domain
    return process.env.RESEND_FROM_EMAIL || 'Paywise <noreply@your-app-name.vercel.app>';
  }
  // Use Resend test domain for development
  return 'Paywise <onboarding@resend.dev>';
};

interface SplitNotificationEmailData {
  participantEmail: string;
  participantName: string;
  creatorName: string;
  splitDescription: string;
  totalAmount: number;
  userAmount: number;
  dueDate: string;
}

interface RecurringPaymentEmailData {
  userEmail: string;
  userName: string;
  description: string;
  provider: string;
  amount?: number;
  dueDate: string;
}

export class EmailService {
  static async sendSplitNotification(data: SplitNotificationEmailData) {
    try {
      const { data: emailData, error } = await resend.emails.send({
        from: getFromEmail(),
        to: [data.participantEmail],
        subject: `You've been added to a split: ${data.splitDescription}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You've been added to a split!</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Split Details</h3>
              <p><strong>Description:</strong> ${data.splitDescription}</p>
              <p><strong>Created by:</strong> ${data.creatorName}</p>
              <p><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
              <p><strong>Your Share:</strong> $${data.userAmount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
            
            <p>Hi ${data.participantName},</p>
            <p>You've been added to a new expense split. Please log in to your Paywise dashboard to view the details and make your payment.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              View Split Details
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated message from Paywise. Please do not reply to this email.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Error sending split notification email:', error);
        return { success: false, error: error.message };
      }

      console.log('Split notification email sent successfully:', emailData?.id);
      return { success: true, emailId: emailData?.id };

    } catch (error) {
      console.error('Error sending split notification email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  static async sendRecurringPaymentReminder(data: RecurringPaymentEmailData) {
    try {
      const { data: emailData, error } = await resend.emails.send({
        from: getFromEmail(),
        to: [data.userEmail],
        subject: `Recurring Payment Reminder: ${data.description}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Recurring Payment Reminder</h2>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="margin-top: 0;">Payment Due</h3>
              <p><strong>Service:</strong> ${data.description}</p>
              <p><strong>Provider:</strong> ${data.provider}</p>
              ${data.amount ? `<p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>` : ''}
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
            
            <p>Hi ${data.userName},</p>
            <p>This is a reminder that your recurring payment for <strong>${data.description}</strong> is due soon.</p>
            
            <p>Please make sure to complete your payment before the due date to avoid any service interruptions.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/recurring" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              Manage Recurring Payments
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated reminder from Paywise. You can manage your notification preferences in your dashboard.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('Error sending recurring payment reminder:', error);
        return { success: false, error: error.message };
      }

      console.log('Recurring payment reminder sent successfully:', emailData?.id);
      return { success: true, emailId: emailData?.id };

    } catch (error) {
      console.error('Error sending recurring payment reminder:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }
}

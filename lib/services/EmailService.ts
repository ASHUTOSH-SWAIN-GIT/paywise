import nodemailer from 'nodemailer';

// Create Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // Enable debug logging
  logger: true, // Enable logging
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Get the appropriate from email
const getFromEmail = () => {
  return process.env.SMTP_FROM_EMAIL || 'Paywise <noreply@paywise.com>';
};

interface SplitNotificationEmailData {
  participantEmail: string;
  participantName: string;
  creatorName: string;
  splitDescription: string;
  totalAmount: number;
  userAmount: number;
  currency?: string; // Currency code (USD, INR, EUR, etc.)
  dueDate: string;
}

interface RecurringPaymentEmailData {
  userEmail: string;
  userName: string;
  description: string;
  provider: string;
  amount?: number;
  currency?: string; // Currency code (USD, INR, EUR, etc.)
  dueDate: string;
}

export class EmailService {
  // Helper function to format currency
  private static formatCurrency(amount: number, currency: string = 'USD'): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'SEK': 'kr',
      'NZD': 'NZ$',
      'MXN': '$',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NOK': 'kr'
    };
    
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }

  static async sendSplitNotification(data: SplitNotificationEmailData) {
    try {
      const mailOptions = {
        from: getFromEmail(),
        to: data.participantEmail,
        subject: `You've been added to a split: ${data.splitDescription}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">You've been added to a split!</h2>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Split Details</h3>
              <p><strong>Description:</strong> ${data.splitDescription}</p>
              <p><strong>Created by:</strong> ${data.creatorName}</p>
              <p><strong>Total Amount:</strong> ${this.formatCurrency(data.totalAmount, data.currency)}</p>
              <p><strong>Your Share:</strong> ${this.formatCurrency(data.userAmount, data.currency)}</p>
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
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('Split notification email sent successfully:', info.messageId);
      return { success: true, emailId: info.messageId };

    } catch (error) {
      console.error('Error sending split notification email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  static async sendRecurringPaymentReminder(data: RecurringPaymentEmailData) {
    try {
      const mailOptions = {
        from: getFromEmail(),
        to: data.userEmail,
        subject: `Recurring Payment Reminder: ${data.description}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Recurring Payment Reminder</h2>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="margin-top: 0;">Payment Due</h3>
              <p><strong>Service:</strong> ${data.description}</p>
              <p><strong>Provider:</strong> ${data.provider}</p>
              ${data.amount ? `<p><strong>Amount:</strong> ${this.formatCurrency(data.amount, data.currency)}</p>` : ''}
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
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('Recurring payment reminder sent successfully:', info.messageId);
      return { success: true, emailId: info.messageId };

    } catch (error) {
      console.error('Error sending recurring payment reminder:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  static async sendRecurringPaymentCreated(data: {
    email: string;
    userName: string;
    description: string;
    amount: number;
    currency?: string; // Currency code (USD, INR, EUR, etc.)
    frequency: string;
    category: string;
    firstPaymentDate: string;
    nextDueDate: string;
  }) {
    try {
      const mailOptions = {
        from: getFromEmail(),
        to: data.email,
        subject: `Recurring Payment Created: ${data.description}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
              Recurring Payment Created Successfully
            </h2>
            
            <p>Hi ${data.userName},</p>
            <p>Your recurring payment has been successfully created with the following details:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
              <p><strong>Description:</strong> ${data.description}</p>
              <p><strong>Amount:</strong> ${this.formatCurrency(data.amount, data.currency)}</p>
              <p><strong>Frequency:</strong> ${data.frequency}</p>
              <p><strong>Category:</strong> ${data.category}</p>
              <p><strong>First Payment Date:</strong> ${data.firstPaymentDate}</p>
              <p><strong>Next Due Date:</strong> ${data.nextDueDate}</p>
            </div>
            
            <p>We'll send you reminders before each payment is due to help you stay on top of your finances.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/recurring" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
              View Recurring Payments
            </a>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This is an automated confirmation from Paywise. You can manage your recurring payments in your dashboard.
            </p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('Recurring payment creation email sent successfully:', info.messageId);
      return { success: true, emailId: info.messageId };

    } catch (error) {
      console.error('Error sending recurring payment creation email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }
}

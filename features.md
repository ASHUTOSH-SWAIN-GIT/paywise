# Expense Sharing & Reminder App – Feature List

## Core Features

### User Management
- User signup/login (email, OTP, or social login)
- User profile with name, email, phone number
- Phone/email verification for reminders

### Shared Expense Tracking
- Add new expenses between users
  - Title, amount, payer, payee, due date, description
- Mark expenses as Paid/Unpaid
- View all expenses in a dashboard
- Upload QR codes (UPI/Paytm/GPay) for payment
- Send payment reminders via Email and SMS

### Recurring Expense Reminders
- Add recurring bills (Netflix, Rent, etc.)
  - Title, amount, start date, frequency, due date
- Shared responsibility (split between users)
- Automatic reminders (email/SMS) before due date
- Mark recurring expenses as paid
- View recurring expense history

### Notifications
- Email reminders using Resend/SendGrid/Mailgun
- SMS reminders using Twilio/Fast2SMS/MSG91

## Additional Features

### Expense History and Dashboard
- Filter expenses by user, category, or date
- Track monthly and yearly expenditure
- View Paid, Unpaid, and Overdue expenses

### Payment Screenshot Upload (Smart Expense Detection)
- Upload payment screenshots
- Extract amount, merchant, and date using OCR
- Automatically add to monthly expenditure (with user confirmation)

## Optional / Future Features
- Group expenses for trips, flatmates, or events
- Push notifications (browser/mobile)
- Spending analytics and graphs
- Smart settlement suggestions for multiple debts
- Receipt uploads and storage
- Calendar sync for recurring bills
- PWA or dedicated mobile app

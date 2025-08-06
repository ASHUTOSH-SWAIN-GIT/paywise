# 🚀 Paywise Deployment Guide

## Step-by-Step Deployment to Vercel

### 📋 Prerequisites

Before deploying, ensure you have:
- [x] GitHub account
- [x] Vercel account (free tier is sufficient)
- [x] Supabase project set up
- [x] Resend account for emails
- [x] All environment variables ready

---

## 🗄️ **Step 1: Database Setup (Supabase)**

### 1.1 Create/Verify Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Note down your project URL and anon key

### 1.2 Run Database Migrations
```bash
# Make sure you're in the project directory
cd /home/ash/paywise

# Generate Prisma client
npx prisma generate

# Push schema to Supabase (if not done already)
npx prisma db push

# Verify tables are created
npx prisma studio
```

### 1.3 Configure Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Create bucket named `paywise` (if not exists)
3. Set bucket to **Public**
4. Add storage policies:

```sql
-- Allow public read access for QR codes
CREATE POLICY "Public read access for QR codes" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'paywise');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload QR codes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'paywise' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update own files
CREATE POLICY "Users can update own QR codes" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'paywise' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🔐 **Step 2: Environment Variables**

### 2.1 Create Production Environment File
Create a secure note with these variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database URL (from Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key

# Security
CRON_SECRET=your_super_secure_random_string_here
NEXT_PUBLIC_ADMIN_EMAIL=ashutoshswain7383@gmail.com

# Node Environment
NODE_ENV=production
```

### 2.2 Generate CRON_SECRET
```bash
# Generate a secure random string
openssl rand -base64 32
# OR use online generator: https://generate-secret.vercel.app/32
```

---

## 📤 **Step 3: GitHub Repository Setup**

### 3.1 Initialize Git (if not done)
```bash
cd /home/ash/paywise

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Paywise application ready for deployment"
```

### 3.2 Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `paywise`
4. Set to **Private** (recommended for production apps)
5. Don't initialize with README (we already have code)
6. Click "Create repository"

### 3.3 Push to GitHub
```bash
# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/paywise.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 **Step 4: Vercel Deployment**

### 4.1 Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your `paywise` repository
4. Click "Deploy"

### 4.2 Configure Build Settings
Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 4.3 Add Environment Variables in Vercel
1. Go to Project Settings → Environment Variables
2. Add each variable from Step 2.1:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
RESEND_API_KEY = re_your_resend_api_key
CRON_SECRET = your_generated_secret
NEXT_PUBLIC_ADMIN_EMAIL = ashutoshswain7383@gmail.com
NODE_ENV = production
```

### 4.4 Deploy
1. Click "Deploy" button
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

---

## ⚙️ **Step 5: Configure OAuth (Supabase)**

### 5.1 Update Supabase OAuth Settings
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. **Site URL**: `https://your-project.vercel.app`
3. **Redirect URLs**: Add these URLs:
   ```
   https://your-project.vercel.app/auth
   https://your-project.vercel.app/dashboard
   ```

### 5.2 Configure Google OAuth (if using)
1. Go to Supabase → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set authorized redirect URIs in Google Console:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

---

## 📧 **Step 6: Email Service Setup (Resend)**

### 6.1 Verify Domain (Optional but Recommended)
1. Go to [resend.com](https://resend.com) → Domains
2. Add your custom domain
3. Add DNS records as instructed
4. Wait for verification

### 6.2 Test Email Sending
1. Go to your deployed app: `https://your-project.vercel.app/admin`
2. Login with `ashutoshswain7383@gmail.com`
3. Click "Send All Daily Reminders"
4. Check if emails are sent successfully

---

## 🔄 **Step 7: Cron Jobs Setup**

### 7.1 Verify Cron Configuration
Your `vercel.json` is already configured to run daily at 9 AM UTC:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 7.2 Test Cron Job Manually
```bash
# Test the cron endpoint
curl -X POST https://your-project.vercel.app/api/cron/daily-reminders \
  -H "Authorization: Bearer your_cron_secret"
```

---

## 🧪 **Step 8: Testing Deployment**

### 8.1 Test Core Functionality
1. **Authentication**: 
   - Visit your app
   - Sign up/login with Google
   - Verify redirect to dashboard

2. **Split Management**:
   - Create a new split
   - Add participants
   - Verify email notifications

3. **QR Code Functionality**:
   - Upload QR code in profile
   - Test QR display in splits
   - Verify signed URLs work

4. **Admin Panel**:
   - Access `/admin` with your email
   - Test manual reminder sending
   - Verify non-admin users are blocked

### 8.2 Test Email Notifications
1. Create a recurring payment
2. Verify creation email is sent
3. Wait for daily reminders (or trigger manually)

---

## 🔧 **Step 9: Post-Deployment Configuration**

### 9.1 Custom Domain (Optional)
1. In Vercel → Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 9.2 Analytics Setup (Optional)
1. Enable Vercel Analytics in project settings
2. Add Google Analytics if needed

### 9.3 Monitoring
1. Set up Vercel monitoring alerts
2. Configure Supabase monitoring
3. Set up uptime monitoring (e.g., UptimeRobot)

---

## 📱 **Step 10: Mobile Testing**

### 10.1 Test on Mobile Devices
1. Test authentication flow
2. Verify QR code scanning works
3. Check responsive design
4. Test touch interactions

---

## 🚀 **Deployment Checklist**

- [ ] Supabase project configured
- [ ] Database schema deployed
- [ ] Storage bucket and policies set up
- [ ] Environment variables configured
- [ ] GitHub repository created
- [ ] Vercel project deployed
- [ ] OAuth URLs updated
- [ ] Email service configured
- [ ] Cron jobs working
- [ ] Admin access restricted
- [ ] Core functionality tested
- [ ] Mobile compatibility verified

---

## 🆘 **Troubleshooting Common Issues**

### Build Failures
```bash
# If build fails, check these:
1. All environment variables are set
2. DATABASE_URL is correct
3. Prisma schema is valid
4. No TypeScript errors
```

### Authentication Issues
```bash
# Check:
1. Supabase OAuth URLs are correct
2. Google OAuth credentials are valid
3. Site URL matches your domain
```

### Email Issues
```bash
# Verify:
1. RESEND_API_KEY is correct
2. Domain is verified (if using custom domain)
3. Rate limits not exceeded
```

### Cron Job Issues
```bash
# Check:
1. CRON_SECRET is set correctly
2. Vercel.json cron configuration is valid
3. API endpoint is accessible
```

---

## 🎉 **You're Ready to Deploy!**

Follow these steps in order, and your Paywise application will be live and fully functional. Remember to test each step before moving to the next one.

**Your live app will be at**: `https://your-project.vercel.app`

Good luck with your deployment! 🚀

# Environment Configuration

## Required Environment Variables

### Production Environment
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Security
CRON_SECRET=your_secure_random_string_for_cron_jobs

# Admin Access Control
NEXT_PUBLIC_ADMIN_EMAIL=ashutoshswain7383@gmail.com

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Database
DATABASE_URL=your_postgresql_database_url
```

### Development Environment
```env
# Same as production but CRON_SECRET is optional
# Admin email defaults to ashutoshswain7383@gmail.com if not set

NODE_ENV=development
```

## Security Notes

### Admin Access
- Only the email specified in `NEXT_PUBLIC_ADMIN_EMAIL` can access `/admin` routes
- Defaults to `ashutoshswain7383@gmail.com` if environment variable is not set
- Both server-side (middleware) and client-side (AuthGuard) protection

### Cron Job Protection
- `CRON_SECRET` required in production for `/api/cron/*` endpoints
- Development mode allows cron jobs without secret for testing
- Use `Authorization: Bearer {CRON_SECRET}` header or `?secret={CRON_SECRET}` query parameter

### Public Variables
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Safe for admin email as it's only used for comparison, not sensitive data
- Never put secrets in `NEXT_PUBLIC_*` variables

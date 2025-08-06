# Supabase Storage Policy Fix

## Current Issue
The "Bucket not found" error is caused by Row Level Security (RLS) policies that prevent public access to the 'paywise' storage bucket.

## Solution 1: Signed URLs (Already Implemented)
I've updated the `getCreatorQRCodeAction` to use signed URLs which bypass policy restrictions. This should work immediately.

## Solution 2: Fix Storage Policies (Alternative)
If you prefer to use public URLs, follow these steps in your Supabase dashboard:

### Step 1: Enable Public Access
1. Go to Supabase Dashboard → Storage
2. Find the 'paywise' bucket
3. Make sure it's set to "Public" (not "Private")

### Step 2: Create Storage Policies
Go to Supabase Dashboard → Authentication → Policies → Storage

#### Policy 1: Allow Public Read Access
```sql
CREATE POLICY "Public read access for QR codes" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'paywise');
```

#### Policy 2: Allow Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload QR codes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'paywise' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Policy 3: Allow Users to Update Own Files
```sql
CREATE POLICY "Users can update own QR codes" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'paywise' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 3: Verify Bucket Configuration
1. Bucket should be public
2. File path format: `user_{user_id}/qr_{timestamp}.{extension}`
3. Public URL format: `https://{project}.supabase.co/storage/v1/object/public/paywise/{file_path}`

## Recommended Approach
Use the signed URL solution (already implemented) as it's more secure and doesn't require changing bucket policies.

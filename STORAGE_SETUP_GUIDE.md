# Storage Setup Guide for Photo Uploads

## Manual Setup Required in Supabase Dashboard

Since storage policies require admin privileges, you need to set them up manually in the Supabase dashboard.

### Step 1: Create the Photos Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set the bucket name to: `photos`
5. Make sure **Public bucket** is checked
6. Click **Create bucket**

### Step 2: Set Up Storage Policies

1. In the Storage section, click on the `photos` bucket
2. Go to the **Policies** tab
3. Click **New Policy**

#### Policy 1: Allow Uploads
- **Policy Name**: `Allow authenticated users to upload photos`
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **Policy definition**:
```sql
(bucket_id = 'photos' AND (storage.foldername(name))[1] = 'challenge-photos')
```

#### Policy 2: Allow Viewing Own Photos
- **Policy Name**: `Allow users to view their own photos`
- **Allowed operation**: SELECT
- **Target roles**: authenticated
- **Policy definition**:
```sql
(bucket_id = 'photos' AND (storage.foldername(name))[1] = 'challenge-photos' AND (storage.foldername(name))[2] = auth.uid()::text)
```

#### Policy 3: Allow Updating Own Photos
- **Policy Name**: `Allow users to update their own photos`
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **Policy definition**:
```sql
(bucket_id = 'photos' AND (storage.foldername(name))[1] = 'challenge-photos' AND (storage.foldername(name))[2] = auth.uid()::text)
```

#### Policy 4: Allow Deleting Own Photos
- **Policy Name**: `Allow users to delete their own photos`
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **Policy definition**:
```sql
(bucket_id = 'photos' AND (storage.foldername(name))[1] = 'challenge-photos' AND (storage.foldername(name))[2] = auth.uid()::text)
```

### Step 3: Test the Setup

After setting up the policies, users should be able to:
1. Upload photos to the `photos` bucket
2. View their own photos
3. Update their own photos
4. Delete their own photos

The photo upload feature in the app will now work correctly with proper compression and error handling.

## Alternative: Use Supabase CLI

If you have Supabase CLI installed, you can also run:

```bash
supabase storage create photos --public
```

Then set up the policies through the dashboard as described above. 
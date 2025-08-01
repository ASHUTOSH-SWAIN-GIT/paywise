import { supabase } from '@/lib/supabase/client';

export async function uploadImage(file: File, userId: string): Promise<string> {
  try {
    if (!file || !userId) throw new Error('File and userId are required');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `user_${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('paywise') // your bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    return filePath; // You can use this to fetch the public/signed URL later
  } catch (err: any) {
    console.error('Upload failed:', err.message);
    throw err;
  }
}

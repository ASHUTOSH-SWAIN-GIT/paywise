'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma/prisma';

export async function uploadQRCodeAction(formData: FormData): Promise<{ success: boolean; filePath?: string; publicUrl?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Generate file path that matches the Supabase policy
    const fileExt = file.name.split('.').pop();
    const fileName = `qr_${Date.now()}.${fileExt}`;
    const filePath = `user_${user.id}/${fileName}`; // Matches policy: user_{auth.uid()}

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('paywise')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return { success: false, error: error.message };
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('paywise')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update the user's QrCode field in the database with the public URL
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { QrCode: publicUrl }
      });
      console.log('User QrCode field updated with URL:', publicUrl);
    } catch (dbError) {
      console.error('Error updating user QrCode field:', dbError);
      // Don't fail the upload if database update fails, just log it
    }

    console.log('File uploaded successfully:', filePath);
    return { success: true, filePath, publicUrl };

  } catch (error) {
    console.error('Upload action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

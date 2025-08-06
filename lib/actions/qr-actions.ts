'use server';

import { prisma } from '@/lib/prisma/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getCreatorQRCodeAction(creatorId: string): Promise<{ success: boolean; qrCodeUrl?: string; error?: string }> {
  try {
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

    // Get the creator's QR code from the database
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { QrCode: true, name: true, email: true }
    });

    if (!creator) {
      return { success: false, error: 'Creator not found' };
    }

    if (!creator.QrCode) {
      return { success: false, error: 'Creator has not uploaded a QR code yet. Please ask them to upload their payment QR code first.' };
    }

    // If it's a Supabase storage URL, create a signed URL to bypass policy issues
    if (creator.QrCode.includes('supabase.co/storage/v1/object/')) {
      try {
        // Extract file path from the stored URL
        let filePath: string;
        
        if (creator.QrCode.includes('/storage/v1/object/public/paywise/')) {
          filePath = creator.QrCode.split('/storage/v1/object/public/paywise/')[1];
        } else if (creator.QrCode.includes('/storage/v1/object/paywise/')) {
          filePath = creator.QrCode.split('/storage/v1/object/paywise/')[1];
        } else {
          // Try to extract from any Supabase storage URL pattern
          const urlParts = creator.QrCode.split('/');
          const paywiseIndex = urlParts.findIndex(part => part === 'paywise');
          if (paywiseIndex !== -1 && paywiseIndex < urlParts.length - 1) {
            filePath = urlParts.slice(paywiseIndex + 1).join('/');
          } else {
            // Fallback to original URL if we can't parse it
            return { success: true, qrCodeUrl: creator.QrCode };
          }
        }

        console.log('Creating signed URL for file path:', filePath);

        // Create a signed URL that will work regardless of bucket policies
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('paywise')
          .createSignedUrl(filePath, 3600); // Valid for 1 hour

        if (signedUrlError) {
          console.error('Signed URL creation error:', signedUrlError);
          // Fallback to original URL
          return { success: true, qrCodeUrl: creator.QrCode };
        }

        console.log('Generated signed URL successfully');
        return { success: true, qrCodeUrl: signedUrlData.signedUrl };

      } catch (urlError) {
        console.error('Error processing Supabase URL:', urlError);
        // Fallback to original URL
        return { success: true, qrCodeUrl: creator.QrCode };
      }
    }

    // For non-Supabase URLs, return as-is
    console.log('Using original QR code URL:', creator.QrCode);
    return { success: true, qrCodeUrl: creator.QrCode };

  } catch (error) {
    console.error('Error getting creator QR code:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get QR code' 
    };
  }
}

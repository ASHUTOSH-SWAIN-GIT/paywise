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
      return { success: false, error: 'QR code not uploaded by creator' };
    }

    return { success: true, qrCodeUrl: creator.QrCode };

  } catch (error) {
    console.error('Error getting creator QR code:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get QR code' 
    };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

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

    // Get the authenticated user from Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    if (userId && authUser.id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user already exists in our custom table using Prisma
    const existingUser = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    // If user doesn't exist, create them
    if (!existingUser) {
      if (!authUser.email) {
        return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
      }

      const userData = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        emailVerified: authUser.email_confirmed_at ? true : false,
      };

      const newUser = await prisma.user.create({
        data: userData
      });

      return NextResponse.json({ success: true, user: newUser });
    }

    // If user exists but data might be outdated, update it
    if (!authUser.email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
    }

    const updatedData = {
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || existingUser.name,
      emailVerified: authUser.email_confirmed_at ? true : existingUser.emailVerified,
    };

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: updatedData
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

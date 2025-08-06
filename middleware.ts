import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',           // Landing page
    '/auth',       // Authentication page
    '/login',      // Login page (if different from auth)
  ];

  // Define API routes that should be protected
  const protectedApiRoutes = [
    '/api/user',
    '/api/users',
  ];

  // Define admin routes that require special permission
  const adminRoutes = [
    '/admin',
  ];

  // Define cron job routes that should have special authentication
  const cronRoutes = [
    '/api/cron',
  ];

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if current path is a cron route
  const isCronRoute = cronRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if current path is a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Handle cron job authentication
  if (isCronRoute) {
    const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '') || 
                      request.nextUrl.searchParams.get('secret');
    
    // In development, allow cron jobs without secret
    if (process.env.NODE_ENV === 'development') {
      return response;
    }
    
    // In production, require CRON_SECRET
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron secret' }, 
        { status: 401 }
      );
    }
    return response;
  }

  // Handle protected API routes
  if (isProtectedApiRoute) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' }, 
        { status: 401 }
      );
    }
    return response;
  }

  // Handle admin routes - require authentication and specific admin email
  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth?redirect=' + encodeURIComponent(pathname), request.url));
    }
    
    // Check if user has the specific admin email
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ashutoshswain7383@gmail.com';
    const isAdmin = user.email === adminEmail;
    
    if (!isAdmin) {
      // Redirect non-admin users to dashboard with error message
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(redirectUrl);
    }
    
    return response;
  }

  // Handle authenticated user on public routes
  if (user && isPublicRoute && pathname !== '/') {
    // If user is authenticated and trying to access auth/login, redirect to dashboard
    if (pathname === '/auth' || pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Handle unauthenticated user on protected routes
  if (!user && !isPublicRoute) {
    // Save the attempted URL to redirect back after login
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

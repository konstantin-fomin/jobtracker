import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the Supabase auth session cookies and read the current user.
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Unauthenticated users may not access protected routes → send to login.
  if (!user && pathname.startsWith('/dashboard')) {
    return redirectWithSession(request, supabaseResponse, '/auth')
  }

  // Authenticated users have no reason to see the login page → send to app.
  // Note: only the exact /auth login page is redirected; /auth/callback must
  // stay reachable so the OAuth code exchange can complete.
  if (user && pathname === '/auth') {
    return redirectWithSession(request, supabaseResponse, '/dashboard')
  }

  return supabaseResponse
}

// Redirect while carrying over any auth cookies refreshed by getUser(), so the
// SSR session stays in sync across the redirect.
function redirectWithSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  const response = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

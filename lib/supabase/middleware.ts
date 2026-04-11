import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  // Refresh session — IMPORTANT: do not add code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/signup')
  const isCustomerRoute = url.pathname.startsWith('/discover') ||
    url.pathname.startsWith('/search') ||
    url.pathname.startsWith('/business') ||
    url.pathname.startsWith('/orders') ||
    url.pathname.startsWith('/rewards') ||
    url.pathname.startsWith('/profile')
  const isBusinessRoute = url.pathname.startsWith('/biz/')

  if (!user && (isCustomerRoute || isBusinessRoute)) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    // Redirect to appropriate dashboard based on role
    // Role is determined after login; default to customer discover
    url.pathname = '/discover'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

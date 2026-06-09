import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/onboarding',
  '/post-project',
  '/wallet',
  '/settings',
  '/services/create',
]
const AUTH_PATHS = new Set(['/login', '/register'])

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    const { pathname } = request.nextUrl
    if (isProtected(pathname)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('error', 'config')
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && AUTH_PATHS.has(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    const dest =
      profile?.onboarding_completed === false && !profile?.is_admin
        ? '/onboarding'
        : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (user && isProtected(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned, onboarding_completed, is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.is_banned) {
      await supabase.auth.signOut()
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('banned', '1')
      return NextResponse.redirect(loginUrl)
    }

    const onDashboard =
      pathname === '/dashboard' || pathname.startsWith('/dashboard/')
    const onOnboarding = pathname === '/onboarding' || pathname.startsWith('/onboarding/')

    if (onDashboard && profile && profile.onboarding_completed === false && !profile.is_admin) {
      const onboardingUrl = request.nextUrl.clone()
      onboardingUrl.pathname = '/onboarding'
      return NextResponse.redirect(onboardingUrl)
    }

    if (onOnboarding && profile?.onboarding_completed === true) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Admin huquqi clientda AdminGuard orqali tekshiriladi (dashboard ga yashirin redirect yo'q)

  return response
}

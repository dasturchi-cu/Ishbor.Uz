import { type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/supabase/middleware'

export async function proxy(request: NextRequest) {
  const start = Date.now()
  const response = await updateSession(request)
  if (process.env.NODE_ENV === 'development') {
    const ms = Date.now() - start
    const path = request.nextUrl.pathname
    console.log(`${request.method} ${path} ${response.status} in ${ms}ms`)
  }
  return response
}

export const config = {
  matcher: [
    // /api/v1 — Next rewrite → FastAPI; Supabase session middleware kerak emas
    '/((?!api/v1|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

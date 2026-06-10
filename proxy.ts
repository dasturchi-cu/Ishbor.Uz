import { type NextRequest } from 'next/server'
import { updateSession } from '@/infrastructure/supabase/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // /api/v1 — Next rewrite → FastAPI; Supabase session middleware kerak emas
    '/((?!api/v1|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

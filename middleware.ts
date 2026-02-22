import { type NextRequest } from 'next/server'
// Omdat de 'lib' map in de hoofdmap staat (naast de 'app' map), 
// is dit het juiste relatieve pad:
import { updateSession } from './lib/supabase/proxy'

export async function middleware(request: NextRequest) {
  // De proxy regelt de sessie-updates en de redirects voor auth
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match alle paden behalve:
     * - _next/static (statische bestanden)
     * - _next/image (afbeelding optimalisatie)
     * - favicon.ico (icoon)
     * - Bestanden met extensies (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
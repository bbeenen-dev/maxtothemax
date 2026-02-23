// lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Haal de user op (dit ververst ook de sessie-cookie indien nodig)
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 2. Definieer strikte uitsluitingen voor de middleware
  const isAuthPage = pathname.startsWith("/auth");
  const isPublicPage = pathname === "/" || pathname === "/races";
  const isStaticFile = pathname.includes('.') || pathname.startsWith('/_next');
  
  // 3. KRUCIALE FIX: Sla de middleware over voor Next.js interne data-verzoeken
  // Als we dit niet doen, krijgt een 'prefetch' verzoek een redirect terug en bevriest de UI op "Laden"
  const isNextDataRequest = request.headers.get('x-nextjs-data') || pathname.startsWith('/_next/data');

  if (isStaticFile || isNextDataRequest) {
    return supabaseResponse;
  }

  // 4. Redirect logica
  // Alleen redirecten naar login als er GEEN user is en het GEEN publieke of auth pagina is
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Voorkom oneindige loops door te checken of we niet al naar login gaan
    return NextResponse.redirect(url);
  }

  // 5. Redirect ingelogde gebruikers weg van de loginpagina
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/races";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
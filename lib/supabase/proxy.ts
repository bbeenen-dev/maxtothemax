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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Verifieer de gebruiker en ververs de sessie
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 2. Definieer uitsluitingen
  const isAuthPage = pathname.startsWith("/auth");
  const isPublicPage = pathname === "/" || pathname === "/races";
  
  // Check voor statische bestanden en Next.js interne verzoeken
  const isStaticFile = pathname.includes('.') || pathname.startsWith('/_next/static');
  const isNextDataRequest = 
    request.headers.get('x-nextjs-data') || 
    pathname.startsWith('/_next/data') ||
    pathname.includes('_next/image');

  // KRUCIALE FIX: Laat data-requests en statische bestanden ALTIJD door zonder redirects
  // Dit voorkomt dat de UI bevriest op een "Laden" scherm tijdens navigatie
  if (isStaticFile || isNextDataRequest) {
    return supabaseResponse;
  }

  // 3. Redirect logica voor niet-ingelogde gebruikers
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Onthoud waar de gebruiker heen wilde
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 4. Redirect ingelogde gebruikers weg van login/registratie pagina's
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/races";
    return NextResponse.redirect(url);
  }

  // 5. CACHE CONTROL: Voorkom dat de browser oude "loading" statussen opslaat
  // Dit dwingt de browser om bij elke navigatie de meest verse data te vragen
  supabaseResponse.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  supabaseResponse.headers.set('Pragma', 'no-cache');
  supabaseResponse.headers.set('Expires', '0');

  return supabaseResponse;
}
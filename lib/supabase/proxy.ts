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

  // Belangrijk: getUser ververst de sessie als dat nodig is
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  
  // URL definities
  const isAuthPage = pathname.startsWith("/auth");
  const isPublicPage = pathname === "/" || pathname === "/races" || pathname.startsWith("/public");
  
  // KRUCIALE FIX: Sla de middleware over voor Next.js interne verzoeken
  // Dit voorkomt het zwarte "Laden" scherm tijdens navigatie
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('/api/') || 
    request.headers.get('x-nextjs-data')
  ) {
    return supabaseResponse;
  }

  // Redirect logica: alleen voor echte pagina-bezoeken
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Voeg de originele url toe zodat je na login terugkomt waar je was
    url.searchParams.set("next", pathname); 
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
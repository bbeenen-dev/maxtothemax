import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // We maken een basis-respons aan
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
          // We vernieuwen de response alleen als dat nodig is voor de browser cookies
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verifieer de gebruiker
  const { data: { user } } = await supabase.auth.getUser();

  // PAD-DEFINITIES
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isPublicPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/races";
  
  // NIEUW: Check of dit een achtergrond-dataverzoek van Next.js is (RSC/Prefetch)
  // Dit voorkomt dat de browser de verbinding verbreekt (AbortError) bij navigatie
  const isDataRequest = 
    request.headers.get("x-nextjs-data") || 
    request.nextUrl.pathname.startsWith("/_next/data");

  // REDIRECT LOGICA
  // We redirecten NOOIT bij data-requests of publieke pagina's
  if (!user && !isAuthPage && !isPublicPage && !isDataRequest) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
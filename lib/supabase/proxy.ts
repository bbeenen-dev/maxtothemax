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
  const { pathname } = request.nextUrl;
  
  const isAuthPage = pathname.startsWith("/auth");
  const isPublicPage = pathname === "/" || pathname === "/races";
  
  // NIEUW: Voorkom dat statische bestanden (CSS, JS, afbeeldingen) worden geblokkeerd
  // Zonder dit blijft je scherm wit omdat de browser de styling niet mag ophalen
  const isStaticAsset = 
    pathname.startsWith("/_next") || 
    pathname.includes("/favicon.ico") ||
    pathname.includes("."); // Checkt voor bestandsextensies zoals .css, .js, .png

  // Check of dit een achtergrond-dataverzoek van Next.js is (RSC/Prefetch)
  const isDataRequest = 
    request.headers.get("x-nextjs-data") || 
    pathname.startsWith("/_next/data");

  // REDIRECT LOGICA
  // We redirecten NOOIT als:
  // 1. Er een user is
  // 2. Je al op een auth-pagina bent
  // 3. Het een publieke pagina is
  // 4. Het een data-request is (voorkomt AbortError)
  // 5. Het een statisch bestand is (voorkomt wit scherm)
  if (!user && !isAuthPage && !isPublicPage && !isDataRequest && !isStaticAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
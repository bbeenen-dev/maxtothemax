// app/lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Gebruik ANON_KEY ipv PUBLISHABLE_KEY
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

  // Ververs sessie
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect logica
  const isLoginPage = request.nextUrl.pathname.startsWith("/auth/login");
  const isRoot = request.nextUrl.pathname === "/";

  if (!user && !isLoginPage && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login"; // Gebruik het volledige pad omdat je geen haakjes hebt
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
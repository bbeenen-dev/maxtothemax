"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialiseer supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      // Gebruik getUser voor de meest betrouwbare check op mobiel
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      setLoading(false);
    };

    getUser();

    // Luister naar auth veranderingen
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-[100] w-full bg-[#0b0e14]/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-2 md:gap-4">
        
        {/* 1. Terug-navigatie */}
        <div className="w-10">
          {!isHome && (
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white font-bold"
              aria-label="Ga terug"
            >
              &larr;
            </button>
          )}
        </div>

        {/* 2. Navigatie Links */}
        <Link 
          href="/" 
          className={`p-2 px-3 rounded-xl transition-all text-xs font-bold uppercase ${
            pathname === "/" 
              ? "text-white bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Home
        </Link>

        <Link 
          href="/races" 
          className={`p-2 px-3 rounded-xl transition-all text-xs font-bold uppercase ${
            pathname === "/races" 
              ? "text-white bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]" 
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Races
        </Link>

        {/* 3. Status & Branding */}
        <div className="ml-auto flex items-center gap-3">
          {/* De Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-slate-500' : userEmail ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
              {loading ? "..." : userEmail ? userEmail.split('@')[0] : "OFF"}
            </span>
          </div>

          <div className="pr-2">
            <span className="text-xs font-black italic uppercase tracking-tighter text-red-600">
              Max<span className="text-white">2</span>TheMax
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
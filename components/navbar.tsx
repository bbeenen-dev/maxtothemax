"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // Nieuwe state voor admin-status
  const [loading, setLoading] = useState(true);

  // Initialiseer supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkUserStatus = async (userId: string | undefined) => {
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      setIsAdmin(profile?.is_admin ?? false);
    };

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      await checkUserStatus(user?.id);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      await checkUserStatus(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-[100] w-full bg-[#0b0e14]/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-2 md:gap-4">
        
        {/* 1. Terug-navigatie */}
        <div className="flex items-center">
          {!isHome && (
            <button 
              onClick={() => router.back()}
              className="p-2 px-3 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white text-xs font-bold"
              aria-label="Ga terug"
            >
              &lt;
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

        {/* ADMIN LINK - Alleen zichtbaar als isAdmin TRUE is */}
        {isAdmin && (
          <Link 
            href="/admin" 
            className={`p-2 px-3 rounded-xl transition-all text-xs font-bold uppercase border ${
              pathname.startsWith("/admin") 
                ? "text-white bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                : "text-blue-400 border-blue-900/50 hover:bg-blue-500/10"
            }`}
          >
            Admin
          </Link>
        )}

        {/* 3. Status indicator rechts uitgelijnd */}
        <div className="ml-auto flex items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-slate-500' : userEmail ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
              {loading ? "..." : userEmail ? userEmail.split('@')[0] : "OFF"}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}